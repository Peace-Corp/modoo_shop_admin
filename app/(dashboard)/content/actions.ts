'use server';

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  tags: string[] | null;
  display_order: number | null;
  image_link: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function fetchHeroBanners(): Promise<{ banners: HeroBanner[]; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    return { banners: [], error: error.message };
  }

  return { banners: (data || []) as HeroBanner[] };
}

export async function createHeroBanner(banner: Omit<HeroBanner, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; banner?: HeroBanner; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('hero_banners')
    .insert({
      title: banner.title,
      subtitle: banner.subtitle,
      link: banner.link,
      tags: banner.tags,
      display_order: banner.display_order,
      image_link: banner.image_link,
      is_active: banner.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/content');
  return { success: true, banner: data as HeroBanner };
}

export async function updateHeroBanner(id: string, updates: Partial<Omit<HeroBanner, 'id' | 'created_at'>>): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('hero_banners')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/content');
  return { success: true };
}

export async function deleteHeroBanner(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('hero_banners')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/content');
  return { success: true };
}
