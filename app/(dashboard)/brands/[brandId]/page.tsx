import { supabase } from '@/lib/supabase';
import { Brand, Product, BrandHeroBanner } from '@/types';
import { notFound } from 'next/navigation';
import BrandDetailClient from './BrandDetailClient';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

async function getData(brandId: string) {
  const [brandRes, productsRes, bannersRes] = await Promise.all([
    supabase.from('brands').select('*').eq('id', brandId).single(),
    supabase.from('products').select('*').eq('brand_id', brandId).order('created_at', { ascending: false }),
    supabase.from('brand_hero_banners').select('*').eq('brand_id', brandId).order('display_order', { ascending: true }),
  ]);

  return {
    brand: brandRes.data as Brand | null,
    products: (productsRes.data || []) as Product[],
    banners: (bannersRes.data || []) as BrandHeroBanner[],
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { brandId } = await params;
  const { brand, products, banners } = await getData(brandId);

  if (!brand) {
    notFound();
  }

  return <BrandDetailClient brand={brand} initialProducts={products} initialBanners={banners} />;
}
