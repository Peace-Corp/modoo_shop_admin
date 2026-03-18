'use server';

import { createServerClient } from '@/lib/supabase';
import { Brand } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createBrand(formData: FormData): Promise<{ success: boolean; data?: Brand; error?: string }> {
  const supabase = createServerClient();

  const validPeriodStart = formData.get('valid_period_start') as string;
  const validPeriodEnd = formData.get('valid_period_end') as string;

  const brandData = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    eng_name: formData.get('eng_name') as string || null,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    logo: formData.get('logo') as string,
    banner: formData.get('banner') as string,
    brand_color: (formData.get('brand_color') as string) || null,
    featured: formData.get('featured') === 'on',
    valid_period_start: validPeriodStart || null,
    valid_period_end: validPeriodEnd || null,
    delivery_domestic_enabled: formData.get('delivery_domestic_enabled') === 'on',
    delivery_domestic_price: parseInt(formData.get('delivery_domestic_price') as string) || 3000,
    delivery_international_enabled: formData.get('delivery_international_enabled') === 'on',
    delivery_international_price: parseInt(formData.get('delivery_international_price') as string) || 15000,
    delivery_pickup_enabled: formData.get('delivery_pickup_enabled') === 'on',
    delivery_pickup_price: parseInt(formData.get('delivery_pickup_price') as string) || 0,
    delivery_pickup_address: (formData.get('delivery_pickup_address') as string) || null,
  };

  const { data, error } = await supabase
    .from('brands')
    .insert(brandData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/brands');
  return { success: true, data: data as Brand };
}

export async function updateBrand(id: string, formData: FormData): Promise<{ success: boolean; data?: Brand; error?: string }> {
  const supabase = createServerClient();

  const validPeriodStart = formData.get('valid_period_start') as string;
  const validPeriodEnd = formData.get('valid_period_end') as string;

  const brandData = {
    name: formData.get('name') as string,
    eng_name: formData.get('eng_name') as string || null,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    logo: formData.get('logo') as string,
    banner: formData.get('banner') as string,
    brand_color: (formData.get('brand_color') as string) || null,
    featured: formData.get('featured') === 'on',
    order_detail_image: (formData.get('order_detail_image') as string) || null,
    valid_period_start: validPeriodStart || null,
    valid_period_end: validPeriodEnd || null,
    delivery_domestic_enabled: formData.get('delivery_domestic_enabled') === 'on',
    delivery_domestic_price: parseInt(formData.get('delivery_domestic_price') as string) || 3000,
    delivery_international_enabled: formData.get('delivery_international_enabled') === 'on',
    delivery_international_price: parseInt(formData.get('delivery_international_price') as string) || 15000,
    delivery_pickup_enabled: formData.get('delivery_pickup_enabled') === 'on',
    delivery_pickup_price: parseInt(formData.get('delivery_pickup_price') as string) || 0,
    delivery_pickup_address: (formData.get('delivery_pickup_address') as string) || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('brands')
    .update(brandData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/brands');
  return { success: true, data: data as Brand };
}

export async function deleteBrand(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/brands');
  return { success: true };
}
