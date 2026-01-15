'use server';

import { createServerClient } from '@/lib/supabase';
import { Product } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = createServerClient();

  const productData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseInt(formData.get('price') as string),
    original_price: formData.get('original_price') ? parseInt(formData.get('original_price') as string) : null,
    brand_id: formData.get('brand_id') as string,
    category: formData.get('category') as string,
    stock: parseInt(formData.get('stock') as string),
    images: [formData.get('images') as string],
    featured: formData.get('featured') === 'on',
  };

  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/products');
  return { success: true, data: data as Product };
}

export async function updateProduct(id: string, formData: FormData): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = createServerClient();

  const productData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseInt(formData.get('price') as string),
    original_price: formData.get('original_price') ? parseInt(formData.get('original_price') as string) : null,
    brand_id: formData.get('brand_id') as string,
    category: formData.get('category') as string,
    stock: parseInt(formData.get('stock') as string),
    images: [formData.get('images') as string],
    featured: formData.get('featured') === 'on',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/products');
  return { success: true, data: data as Product };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/products');
  return { success: true };
}
