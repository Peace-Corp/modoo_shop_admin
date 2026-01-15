import { supabase } from '@/lib/supabase';
import { Order, OrderItem } from '@/types';
import OrdersClient from './OrdersClient';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: { name: string; images: string[] } })[];
  profiles?: { name: string; email: string };
}

async function getData() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, images)
      ),
      profiles (name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return { orders: [] };
  }

  return { orders: (data || []) as OrderWithItems[] };
}

export default async function OrdersPage() {
  const { orders } = await getData();

  return <OrdersClient initialOrders={orders} />;
}
