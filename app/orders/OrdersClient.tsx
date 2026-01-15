'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Order, OrderItem } from '@/types';
import { updateOrderStatus } from './actions';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: { name: string; images: string[] } })[];
  profiles?: { name: string; email: string };
}

interface OrdersClientProps {
  initialOrders: OrderWithItems[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders = orders.filter(order =>
    !statusFilter || order.status === statusFilter
  );

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
        ));
      }
    });
  };

  const selectedOrderData = orders.find(o => o.id === selectedOrder);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button variant="outline">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === status).length}
            </p>
            <p className="text-sm text-gray-500 capitalize">{status}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900 text-sm">{order.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-gray-900">{order.profiles?.name || '-'}</p>
                        <p className="text-sm text-gray-500">{order.profiles?.email || order.user_id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600 capitalize">{order.payment_method}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${paymentStatusColors[order.payment_status]}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={isPending}
                        className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${statusColors[order.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {selectedOrder && selectedOrderData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium text-gray-900 break-all">{selectedOrderData.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedOrderData.created_at
                      ? new Date(selectedOrderData.created_at).toLocaleString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{selectedOrderData.profiles?.name || '-'}</p>
                  <p className="text-sm text-gray-500">{selectedOrderData.profiles?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">${selectedOrderData.total.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Order Items</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {selectedOrderData.order_items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{item.products?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">${item.price_at_time.toFixed(2)}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500">No items</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{selectedOrderData.shipping_street}</p>
                  <p className="text-gray-600">
                    {selectedOrderData.shipping_city}, {selectedOrderData.shipping_state} {selectedOrderData.shipping_zip_code}
                  </p>
                  <p className="text-gray-600">{selectedOrderData.shipping_country}</p>
                  <p className="text-gray-600">{selectedOrderData.shipping_phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Update Status</p>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedOrderData.status}
                  onChange={(e) => handleStatusUpdate(selectedOrderData.id, e.target.value)}
                  disabled={isPending}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
