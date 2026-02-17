'use server';

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Order, OrderItem } from '@/types';

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

  return { orders: (data || []) as OrderWithItems[] };
}

export async function fetchBrands(): Promise<{ id: string; name: string }[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('brands').select('id, name').order('name');
  return (data || []) as { id: string; name: string }[];
}

export async function updateOrderStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

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
