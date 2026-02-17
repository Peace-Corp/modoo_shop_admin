'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Order, OrderItem } from '@/types';
import { updateOrderStatus, deleteOrder, fetchOrders } from './actions';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: { name: string; images: string[] } })[];
}

interface OrdersClientProps {
  initialOrders: OrderWithItems[];
}

const STATUS_CONFIG = [
  { key: 'pending', label: '대기중' },
  { key: 'processing', label: '처리중' },
  { key: 'shipped', label: '배송중' },
  { key: 'delivered', label: '배송완료' },
  { key: 'cancelled', label: '취소됨' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  processing: '처리중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '취소됨',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const DELIVERY_LABELS: Record<string, string> = {
  domestic: '국내배송',
  international: '해외배송',
};

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOrders = useCallback(async () => {
    setIsRefreshing(true);
    const result = await fetchOrders();
    if (!result.error) {
      setOrders(result.orders);
    }
    setIsRefreshing(false);
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_phone?.includes(q) ||
        order.customer_email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const { key } of STATUS_CONFIG) {
      counts[key] = 0;
    }
    for (const order of orders) {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    }
    return counts;
  }, [orders]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
        ));
      }
    });
  }, []);

  const handleDelete = useCallback(async (orderId: string) => {
    if (!confirm('주문을 삭제하시겠습니까? 관련된 모든 주문 항목도 함께 삭제됩니다.')) return;
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    });
  }, []);

  const handleFilterClick = useCallback((key: string) => {
    setStatusFilter(prev => prev === key ? '' : key);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">주문</h1>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={refreshOrders} disabled={isRefreshing}>
            <svg className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs">{isRefreshing ? '로딩중...' : '새로고침'}</span>
          </Button>
          <Button variant="outline" size="sm">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs">내보내기</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {STATUS_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterClick(key)}
            className={`px-2 py-2 rounded-lg border transition-all ${
              statusFilter === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {statusCounts[key]}
            </p>
            <p className="text-[11px] text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="주문번호, 이름, 연락처, 이메일 검색"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            주문이 없습니다
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filteredOrders.map(order => (
              <OrderAccordionItem
                key={order.id}
                order={order}
                isPending={isPending}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
              />
            ))}
          </Accordion>
        )}

        <div className="px-3 py-2 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">
            {orders.length}개 주문 중 {filteredOrders.length}개 표시
          </p>
        </div>
      </div>
    </div>
  );
}

interface OrderAccordionItemProps {
  order: OrderWithItems;
  isPending: boolean;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onDelete: (orderId: string) => void;
}

function OrderAccordionItem({ order, isPending, onStatusUpdate, onDelete }: OrderAccordionItemProps) {
  const formattedDate = useMemo(
    () => order.created_at ? new Date(order.created_at).toLocaleDateString() : '-',
    [order.created_at]
  );

  const formattedTotal = useMemo(
    () => `₩${order.total.toLocaleString('ko-KR')}`,
    [order.total]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onStatusUpdate(order.id, e.target.value),
    [order.id, onStatusUpdate]
  );

  return (
    <AccordionItem value={order.id} className="border-b border-gray-100">
      <AccordionTrigger className="px-3 md:px-4 py-2.5 hover:no-underline hover:bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 w-full text-left">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-xs truncate">
                #{order.id.slice(0, 8)}
              </p>
              <p className="text-[10px] text-gray-500 md:hidden">{formattedDate}</p>
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-xs text-gray-900 truncate">{order.customer_name || '게스트'}</p>
              <p className="text-[10px] text-gray-500 truncate">{order.customer_email || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <p className="hidden md:block text-[11px] text-gray-600 whitespace-nowrap">{formattedDate}</p>
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {DELIVERY_LABELS[order.delivery_method] || order.delivery_method}
            </span>
            <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">{formattedTotal}</p>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 md:px-4 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="space-y-2">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-900 mb-1">고객 정보</h3>
              <div className="bg-gray-50 rounded-md p-2.5 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-500">이름</span>
                  <span className="text-[11px] font-medium text-gray-900">{order.customer_name || '게스트'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-500">이메일</span>
                  <span className="text-[11px] font-medium text-gray-900 break-all">{order.customer_email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-500">연락처</span>
                  <span className="text-[11px] font-medium text-gray-900">{order.customer_phone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-gray-900 mb-1">배송지</h3>
              <div className="bg-gray-50 rounded-md p-2.5 text-[11px] space-y-0.5">
                <p className="text-gray-900">{order.shipping_address_line_one}</p>
                {order.shipping_address_line_two && (
                  <p className="text-gray-600">{order.shipping_address_line_two}</p>
                )}
                <p className="text-gray-600">
                  {[order.shipping_city, order.shipping_state, order.shipping_zip_code].filter(Boolean).join(', ')}
                </p>
                {order.shipping_country && <p className="text-gray-600">{order.shipping_country}</p>}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-gray-900 mb-1">결제 정보</h3>
              <div className="bg-gray-50 rounded-md p-2.5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">결제 방법</span>
                  <span className="text-[11px] font-medium text-gray-900 capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">결제 상태</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.payment_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">결제 ID</span>
                    <span className="text-[10px] font-mono text-gray-700 truncate max-w-35">{order.payment_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-900 mb-1">
                주문 상품
                {order.order_name && <span className="font-normal text-gray-500 ml-1">({order.order_name})</span>}
              </h3>
              <div className="bg-gray-50 rounded-md p-2.5 space-y-2">
                {order.order_items?.length ? (
                  order.order_items.map(item => (
                    <div key={item.id} className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-[11px] truncate">
                          {item.products?.name || '알 수 없는 상품'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          수량: {item.quantity}
                          {item.size && ` · 사이즈: ${item.size}`}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 text-[11px] whitespace-nowrap">
                        ₩{item.price_at_time.toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-[11px]">상품 없음</p>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900 text-xs">합계</span>
                  <span className="font-semibold text-gray-900 text-xs">{formattedTotal}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-gray-900 mb-1">주문 상태 변경</h3>
              <select
                className={`w-full px-2.5 py-1.5 text-[11px] font-medium rounded-md border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}
                value={order.status}
                onChange={handleChange}
                disabled={isPending}
              >
                <option value="pending">대기중</option>
                <option value="processing">처리중</option>
                <option value="shipped">배송중</option>
                <option value="delivered">배송완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDelete(order.id)}
              disabled={isPending}
            >
              주문 삭제
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
