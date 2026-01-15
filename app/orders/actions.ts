'use server';

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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
