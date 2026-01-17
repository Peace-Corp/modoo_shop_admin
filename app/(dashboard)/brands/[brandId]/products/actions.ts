'use server';

import { createServerClient } from '@/lib/supabase';
import { Product } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createProduct(brandId: string, formData: FormData): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = createServerClient();

  // Get all images from formData
  const images = formData.getAll('images') as string[];

  const sizeChartImage = formData.get('size_chart_image') as string;
  const descriptionImage = formData.get('description_image') as string;

  const productData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseInt(formData.get('price') as string),
    original_price: formData.get('original_price') ? parseInt(formData.get('original_price') as string) : null,
    brand_id: brandId,
    category: formData.get('category') as string,
    stock: parseInt(formData.get('stock') as string),
    images: images.filter(img => img),
    featured: formData.get('featured') === 'on',
    size_chart_image: sizeChartImage || null,
    description_image: descriptionImage || null,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/products`);
  revalidatePath('/brands');
  return { success: true, data: data as Product };
}

export async function updateProduct(brandId: string, id: string, formData: FormData): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = createServerClient();

  // Get all images from formData
  const images = formData.getAll('images') as string[];
  const sizeChartImage = formData.get('size_chart_image') as string;
  const descriptionImage = formData.get('description_image') as string;

  const productData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    price: parseInt(formData.get('price') as string),
    original_price: formData.get('original_price') ? parseInt(formData.get('original_price') as string) : null,
    brand_id: brandId,
    category: formData.get('category') as string,
    stock: parseInt(formData.get('stock') as string),
    images: images.filter(img => img),
    featured: formData.get('featured') === 'on',
    size_chart_image: sizeChartImage || null,
    description_image: descriptionImage || null,
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

  revalidatePath(`/brands/${brandId}/products`);
  revalidatePath('/brands');
  return { success: true, data: data as Product };
}

export async function deleteProduct(brandId: string, id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/products`);
  revalidatePath('/brands');
  return { success: true };
}

// Product Variant Actions
interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function getProductVariants(productId: string): Promise<{ success: boolean; data?: ProductVariant[]; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ProductVariant[] };
}

export async function createVariant(
  brandId: string,
  productId: string,
  size: string,
  stock: number,
  sortOrder: number = 0
): Promise<{ success: boolean; data?: ProductVariant; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: productId,
      size,
      stock,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/products`);
  return { success: true, data: data as ProductVariant };
}

export async function updateVariant(
  brandId: string,
  productId: string,
  variantId: string,
  updates: { size?: string; stock?: number; sort_order?: number }
): Promise<{ success: boolean; data?: ProductVariant; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('product_variants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', variantId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/products`);
  return { success: true, data: data as ProductVariant };
}

export async function deleteVariant(
  brandId: string,
  productId: string,
  variantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', variantId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/products`);
  return { success: true };
}
