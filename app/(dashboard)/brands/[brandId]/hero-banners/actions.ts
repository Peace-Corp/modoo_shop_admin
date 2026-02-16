'use server';

import { createServerClient } from '@/lib/supabase';
import { BrandHeroBanner } from '@/types';
import { revalidatePath } from 'next/cache';

export async function fetchBrandHeroBanners(
  brandId: string
): Promise<{ banners: BrandHeroBanner[]; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('brand_hero_banners')
    .select('*')
    .eq('brand_id', brandId)
    .order('display_order', { ascending: true });

  if (error) {
    return { banners: [], error: error.message };
  }

  return { banners: (data || []) as BrandHeroBanner[] };
}

export async function createBrandHeroBanner(
  brandId: string,
  banner: Omit<BrandHeroBanner, 'id' | 'brand_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; banner?: BrandHeroBanner; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('brand_hero_banners')
    .insert({
      brand_id: brandId,
      title: banner.title,
      subtitle: banner.subtitle,
      link: banner.link,
      color: banner.color,
      display_order: banner.display_order,
      image_link: banner.image_link,
      is_active: banner.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/hero-banners`);
  return { success: true, banner: data as BrandHeroBanner };
}

export async function updateBrandHeroBanner(
  brandId: string,
  id: string,
  updates: Partial<Omit<BrandHeroBanner, 'id' | 'brand_id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('brand_hero_banners')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/hero-banners`);
  return { success: true };
}

export async function deleteBrandHeroBanner(
  brandId: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('brand_hero_banners')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/brands/${brandId}/hero-banners`);
  return { success: true };
}
