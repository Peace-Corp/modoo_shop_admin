'use server';

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Order, OrderItem, Refund, RefundedItem } from '@/types';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: { name: string; images: string[]; brand_id: string } })[];
}

export async function fetchOrders(): Promise<{ orders: OrderWithItems[]; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, images, brand_id)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { orders: [], error: error.message };
  }

  return { orders: (data || []) as unknown as OrderWithItems[] };
}

export async function fetchBrands(): Promise<{ id: string; name: string }[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('brands').select('id, name').order('name');
  return (data || []) as { id: string; name: string }[];
}

export async function updateOrderStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', id)
    .single();

  if (fetchError || !order) {
    return { success: false, error: '주문을 찾을 수 없습니다.' };
  }

  if (order.payment_status === 'refunded' && status !== 'cancelled') {
    return { success: false, error: '전액 환불된 주문의 상태는 변경할 수 없습니다.' };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function deleteOrder(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function updatePaymentStatus(id: string, paymentStatus: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/orders');
  return { success: true };
}

async function cancelTossPayment(paymentKey: string, reason: string, amount?: number): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.' };
  }

  const encoded = Buffer.from(`${secretKey}:`).toString('base64');

  const body: Record<string, unknown> = { cancelReason: reason };
  if (amount !== undefined) {
    body.cancelAmount = amount;
  }

  const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Toss cancel failed:', data);
    return { success: false, error: data.message || `토스 환불 실패 (${data.code})` };
  }

  return { success: true };
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal 인증 정보가 설정되지 않았습니다.');
  }

  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX === 'true';
  const apiUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('PayPal 인증에 실패했습니다.');
  }

  const data = await response.json();
  return data.access_token;
}

async function refundPayPalPayment(captureId: string, reason: string, amount?: number, currency: string = 'USD'): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getPayPalAccessToken();
    const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_SANDBOX === 'true';
    const apiUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const body: Record<string, unknown> = {
      note_to_payer: reason,
    };
    if (amount !== undefined) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency,
      };
    }

    const response = await fetch(`${apiUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal refund failed:', data);
      return { success: false, error: data.message || `PayPal 환불 실패` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'PayPal 환불 중 오류 발생' };
  }
}

export async function processRefund(params: {
  orderId: string;
  refundType: 'full' | 'partial';
  refundAmount: number;
  reason: string;
  refundedItems?: RefundedItem[];
  adminNote?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, total, payment_status, payment_method, payment_id, refund_amount')
    .eq('id', params.orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: '주문을 찾을 수 없습니다.' };
  }

  if (order.payment_status !== 'completed' && order.payment_status !== 'partially_refunded') {
    return { success: false, error: '결제 완료된 주문만 환불할 수 있습니다.' };
  }

  if (!order.payment_id) {
    return { success: false, error: '결제 ID가 없어 환불을 처리할 수 없습니다.' };
  }

  const currentRefunded = (order.refund_amount as number) || 0;
  const newTotalRefunded = currentRefunded + params.refundAmount;

  if (newTotalRefunded > (order.total as number)) {
    return { success: false, error: '환불 금액이 주문 총액을 초과합니다.' };
  }

  const isFullRefund = params.refundType === 'full' && params.refundAmount >= ((order.total as number) - currentRefunded);

  let pgResult: { success: boolean; error?: string };

  if (order.payment_method === 'toss') {
    pgResult = await cancelTossPayment(
      order.payment_id as string,
      params.reason,
      isFullRefund && currentRefunded === 0 ? undefined : params.refundAmount,
    );
  } else if (order.payment_method === 'paypal') {
    pgResult = await refundPayPalPayment(
      order.payment_id as string,
      params.reason,
      isFullRefund && currentRefunded === 0 ? undefined : params.refundAmount,
    );
  } else {
    return { success: false, error: `지원하지 않는 결제 방법: ${order.payment_method}` };
  }

  if (!pgResult.success) {
    return { success: false, error: `PG사 환불 실패: ${pgResult.error}` };
  }

  const { error: refundError } = await supabase
    .from('refunds')
    .insert({
      order_id: params.orderId,
      refund_type: params.refundType,
      refund_amount: params.refundAmount,
      reason: params.reason,
      status: 'completed',
      refunded_items: params.refundedItems ? JSON.parse(JSON.stringify(params.refundedItems)) : null,
      admin_note: params.adminNote || null,
    });

  if (refundError) {
    console.error('Refund record insert failed (PG refund was successful):', refundError);
    return { success: false, error: `환불은 처리되었으나 기록 저장 실패: ${refundError.message}` };
  }

  const isFullyRefunded = newTotalRefunded >= (order.total as number);
  const newPaymentStatus = isFullyRefunded ? 'refunded' : 'partially_refunded';

  const updateData: Record<string, unknown> = {
    payment_status: newPaymentStatus,
    refund_amount: newTotalRefunded,
    updated_at: new Date().toISOString(),
  };
  if (isFullyRefunded) {
    updateData.status = 'cancelled';
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', params.orderId);

  if (updateError) {
    console.error('Order update failed (PG refund was successful):', updateError);
    return { success: false, error: `환불은 처리되었으나 주문 상태 업데이트 실패: ${updateError.message}` };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function fetchRefundsByOrderId(orderId: string): Promise<{ refunds: Refund[]; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    return { refunds: [], error: error.message };
  }

  return { refunds: (data || []) as unknown as Refund[] };
}
