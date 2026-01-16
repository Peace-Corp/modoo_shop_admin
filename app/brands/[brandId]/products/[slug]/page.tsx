import { supabase } from '@/lib/supabase';
import { Product, Brand } from '@/types';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ brandId: string; slug: string }>;
}

async function getData(brandId: string, productId: string) {
  const [brandRes, productRes] = await Promise.all([
    supabase.from('brands').select('*').eq('id', brandId).single(),
    supabase.from('products').select('*').eq('id', productId).single(),
  ]);

  return {
    brand: brandRes.data as Brand | null,
    product: productRes.data as Product | null,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { brandId, slug: productId } = await params;
  const { brand, product } = await getData(brandId, productId);

  if (!brand || !product || product.brand_id !== brandId) {
    notFound();
  }

  return <ProductDetailClient brand={brand} initialProduct={product} />;
}
