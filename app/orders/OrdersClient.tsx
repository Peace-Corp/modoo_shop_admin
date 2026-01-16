'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Order, OrderItem } from '@/types';
import { updateOrderStatus, fetchOrders } from './actions';

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
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOrders = async () => {
    setIsRefreshing(true);
    const result = await fetchOrders();
    if (!result.error) {
      setOrders(result.orders);
    }
    setIsRefreshing(false);
  };

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

  const statusLabels: Record<string, string> = {
    pending: '대기중',
    processing: '처리중',
    shipped: '배송중',
    delivered: '배송완료',
    cancelled: '취소됨',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">주문</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshOrders} disabled={isRefreshing}>
            <svg className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? '로딩중...' : '새로고침'}
          </Button>
          <Button variant="outline">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            내보내기
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { key: 'pending', label: '대기중' },
          { key: 'processing', label: '처리중' },
          { key: 'shipped', label: '배송중' },
          { key: 'delivered', label: '배송완료' },
          { key: 'cancelled', label: '취소됨' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.status === key).length}
            </p>
            <p className="text-sm text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            주문이 없습니다
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredOrders.map(order => (
              <AccordionItem key={order.id} value={order.id} className="border-b border-gray-100">
                <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 w-full text-left">
                    <div className="flex items-center gap-3 md:gap-6 flex-1">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div className="hidden md:block min-w-0">
                        <p className="text-gray-900 truncate">{order.profiles?.name || '게스트'}</p>
                        <p className="text-sm text-gray-500 truncate">{order.profiles?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                      <p className="hidden md:block text-sm text-gray-600 whitespace-nowrap">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                      </p>
                      <p className="font-semibold text-gray-900 whitespace-nowrap">
                        ₩{order.total.toLocaleString('ko-KR')}
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 md:px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Customer Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">고객 정보</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">이름</span>
                            <span className="text-sm font-medium text-gray-900">{order.profiles?.name || '게스트'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">이메일</span>
                            <span className="text-sm font-medium text-gray-900 break-all">{order.profiles?.email || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">배송지</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                          <p className="text-gray-900">{order.shipping_street}</p>
                          <p className="text-gray-600">
                            {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
                          </p>
                          <p className="text-gray-600">{order.shipping_country}</p>
                          <p className="text-gray-600">{order.shipping_phone}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">결제 정보</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">결제 방법</span>
                            <span className="text-sm font-medium text-gray-900 capitalize">{order.payment_method}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">결제 상태</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${paymentStatusColors[order.payment_status]}`}>
                              {order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">주문 상품</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {order.order_items?.length ? (
                            order.order_items.map(item => (
                              <div key={item.id} className="flex justify-between items-start gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {item.products?.name || '알 수 없는 상품'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    수량: {item.quantity}
                                    {item.size && ` · 사이즈: ${item.size}`}
                                  </p>
                                </div>
                                <p className="font-medium text-gray-900 text-sm whitespace-nowrap">
                                  ₩{item.price_at_time.toLocaleString('ko-KR')}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">상품 없음</p>
                          )}
                          <div className="pt-3 border-t border-gray-200 flex justify-between">
                            <span className="font-semibold text-gray-900">합계</span>
                            <span className="font-semibold text-gray-900">
                              ₩{order.total.toLocaleString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">주문 상태 변경</h3>
                        <select
                          className={`w-full px-4 py-2 text-sm font-medium rounded-lg border-0 cursor-pointer ${statusColors[order.status]}`}
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          disabled={isPending}
                        >
                          <option value="pending">대기중</option>
                          <option value="processing">처리중</option>
                          <option value="shipped">배송중</option>
                          <option value="delivered">배송완료</option>
                          <option value="cancelled">취소됨</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {orders.length}개 주문 중 {filteredOrders.length}개 표시
          </p>
        </div>
      </div>
    </div>
  );
}
