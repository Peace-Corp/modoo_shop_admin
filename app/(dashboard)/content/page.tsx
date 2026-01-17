import { supabase } from '@/lib/supabase';
import ContentClient from './ContentClient';

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

async function getData() {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    return { banners: [] };
  }

  return { banners: (data || []) as HeroBanner[] };
}

export default async function ContentPage() {
  const { banners } = await getData();

  return <ContentClient initialBanners={banners} />;
}
