import { supabase } from '@/lib/supabase';
import { Product, Brand } from '@/types';
import ProductsClient from './ProductsClient';

async function getData() {
  const [productsRes, brandsRes] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('brands').select('*'),
  ]);

  return {
    products: (productsRes.data || []) as Product[],
    brands: (brandsRes.data || []) as Brand[],
  };
}

export default async function ProductsPage() {
  const { products, brands } = await getData();

  return <ProductsClient initialProducts={products} brands={brands} />;
}
