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
    .select('id, total, payment_status, refund_amount')
    .eq('id', params.orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: '주문을 찾을 수 없습니다.' };
  }

  const currentRefunded = (order.refund_amount as number) || 0;
  const newTotalRefunded = currentRefunded + params.refundAmount;

  if (newTotalRefunded > (order.total as number)) {
    return { success: false, error: '환불 금액이 주문 총액을 초과합니다.' };
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
    return { success: false, error: refundError.message };
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
    return { success: false, error: updateError.message };
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
