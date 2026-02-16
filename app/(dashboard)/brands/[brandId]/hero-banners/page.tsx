import { supabase } from '@/lib/supabase';
import { BrandHeroBanner, Brand } from '@/types';
import { notFound } from 'next/navigation';
import BrandHeroBannersClient from './BrandHeroBannersClient';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

async function getData(brandId: string) {
  const [brandRes, bannersRes] = await Promise.all([
    supabase.from('brands').select('*').eq('id', brandId).single(),
    supabase
      .from('brand_hero_banners')
      .select('*')
      .eq('brand_id', brandId)
      .order('display_order', { ascending: true }),
  ]);

  return {
    brand: brandRes.data as Brand | null,
    banners: (bannersRes.data || []) as BrandHeroBanner[],
  };
}

export default async function BrandHeroBannersPage({ params }: PageProps) {
  const { brandId } = await params;
  const { brand, banners } = await getData(brandId);

  if (!brand) {
    notFound();
  }

  return <BrandHeroBannersClient brand={brand} initialBanners={banners} />;
}
