import { supabase } from '@/lib/supabase';
import { Product, Brand } from '@/types';
import { notFound } from 'next/navigation';
import BrandProductsClient from './BrandProductsClient';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

async function getData(brandId: string) {
  const [brandRes, productsRes] = await Promise.all([
    supabase.from('brands').select('*').eq('id', brandId).single(),
    supabase.from('products').select('*').eq('brand_id', brandId).order('created_at', { ascending: false }),
  ]);

  return {
    brand: brandRes.data as Brand | null,
    products: (productsRes.data || []) as Product[],
  };
}

export default async function BrandProductsPage({ params }: PageProps) {
  const { brandId } = await params;
  const { brand, products } = await getData(brandId);

  if (!brand) {
    notFound();
  }

  return <BrandProductsClient brand={brand} initialProducts={products} />;
}
