import { fetchOrders, fetchBrands } from './actions';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const [{ orders }, brands] = await Promise.all([fetchOrders(), fetchBrands()]);

  return <OrdersClient initialOrders={orders} brands={brands} />;
}
