import { fetchOrders } from './actions';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const { orders } = await fetchOrders();

  return <OrdersClient initialOrders={orders} />;
}
