import { supabase } from '@/lib/supabase';
import { Brand, Product } from '@/types';
import BrandsClient from './BrandsClient';

async function getData() {
  const [brandsRes, productsRes] = await Promise.all([
    supabase.from('brands').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('id, brand_id'),
  ]);

  return {
    brands: (brandsRes.data || []) as Brand[],
    products: (productsRes.data || []) as Pick<Product, 'id' | 'brand_id'>[],
  };
}

export default async function BrandsPage() {
  const { brands, products } = await getData();

  return <BrandsClient initialBrands={brands} products={products} />;
}
