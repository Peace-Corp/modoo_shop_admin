'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Order, OrderItem, Refund, RefundedItem } from '@/types';
import { processRefund, fetchRefundsByOrderId } from './actions';

interface OrderWithItems extends Order {
  order_items?: (OrderItem & { products?: { name: string; images: string[]; brand_id: string } })[];
}

interface RefundDialogProps {
  order: OrderWithItems;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefundComplete: () => void;
}

const REFUND_REASONS = [
  '고객 요청',
  '상품 불량/파손',
  '오배송',
  '상품 품절',
  '배송 지연',
  '기타',
] as const;

export default function RefundDialog({ order, open, onOpenChange, onRefundComplete }: RefundDialogProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refundHistory, setRefundHistory] = useState<Refund[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number; amount: number }>>({});
  const [partialAmount, setPartialAmount] = useState<number>(0);

  const alreadyRefunded = order.refund_amount || 0;
  const maxRefundable = order.total - alreadyRefunded;

  useEffect(() => {
    if (open) {
      setRefundType('full');
      setReason('');
      setCustomReason('');
      setAdminNote('');
      setError('');
      setPartialAmount(0);

      const itemMap: Record<string, { selected: boolean; quantity: number; amount: number }> = {};
      order.order_items?.forEach(item => {
        itemMap[item.id] = { selected: false, quantity: item.quantity, amount: item.price_at_time * item.quantity };
      });
      setSelectedItems(itemMap);

      setIsLoadingHistory(true);
      fetchRefundsByOrderId(order.id).then(result => {
        if (!result.error) setRefundHistory(result.refunds);
        setIsLoadingHistory(false);
      });
    }
  }, [open, order]);

  const computedRefundAmount = useMemo(() => {
    if (refundType === 'full') return maxRefundable;
    return partialAmount;
  }, [refundType, maxRefundable, partialAmount]);

  const selectedItemsList = useMemo((): RefundedItem[] => {
    if (refundType !== 'partial') return [];
    return Object.entries(selectedItems)
      .filter(([, v]) => v.selected)
      .map(([id, v]) => {
        const item = order.order_items?.find(i => i.id === id);
        return {
          order_item_id: id,
          product_name: item?.products?.name || '알 수 없는 상품',
          quantity: v.quantity,
          amount: v.amount,
        };
      });
  }, [selectedItems, refundType, order.order_items]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [itemId]: { ...prev[itemId], selected: !prev[itemId].selected } };
      const total = Object.values(updated).filter(v => v.selected).reduce((sum, v) => sum + v.amount, 0);
      setPartialAmount(total);
      return updated;
    });
  };

  const handleItemAmountChange = (itemId: string, amount: number) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [itemId]: { ...prev[itemId], amount } };
      const total = Object.values(updated).filter(v => v.selected).reduce((sum, v) => sum + v.amount, 0);
      setPartialAmount(total);
      return updated;
    });
  };

  const finalReason = reason === '기타' ? customReason : reason;

  const handleSubmit = async () => {
    if (!finalReason.trim()) {
      setError('환불 사유를 입력해 주세요.');
      return;
    }
    if (computedRefundAmount <= 0) {
      setError('환불 금액은 0보다 커야 합니다.');
      return;
    }
    if (computedRefundAmount > maxRefundable) {
      setError(`환불 가능 금액(₩${maxRefundable.toLocaleString()})을 초과합니다.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await processRefund({
      orderId: order.id,
      refundType,
      refundAmount: computedRefundAmount,
      reason: finalReason,
      refundedItems: refundType === 'partial' ? selectedItemsList : undefined,
      adminNote: adminNote || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      onRefundComplete();
      onOpenChange(false);
    } else {
      setError(result.error || '환불 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">환불 처리</DialogTitle>
          <DialogDescription className="text-xs">
            주문 #{order.id.slice(0, 8)} · ₩{order.total.toLocaleString()}
            {alreadyRefunded > 0 && (
              <span className="text-orange-600 ml-1">
                (기환불: ₩{alreadyRefunded.toLocaleString()})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refund type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">환불 유형</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefundType('full')}
                className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                  refundType === 'full'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900">전체 환불</p>
                <p className="text-[10px] text-gray-500 mt-0.5">₩{maxRefundable.toLocaleString()}</p>
              </button>
              <button
                type="button"
                onClick={() => setRefundType('partial')}
                className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                  refundType === 'partial'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900">부분 환불</p>
                <p className="text-[10px] text-gray-500 mt-0.5">상품별 선택</p>
              </button>
            </div>
          </div>

          {/* Partial refund: item selection */}
          {refundType === 'partial' && order.order_items && order.order_items.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">환불 상품 선택</label>
              <div className="space-y-2 bg-gray-50 rounded-lg p-2.5">
                {order.order_items.map(item => {
                  const sel = selectedItems[item.id];
                  if (!sel) return null;
                  const maxAmount = item.price_at_time * item.quantity;
                  return (
                    <div key={item.id} className={`rounded-md border p-2.5 transition-all ${sel.selected ? 'border-blue-300 bg-white' : 'border-gray-200 bg-white/60'}`}>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sel.selected}
                          onChange={() => handleItemToggle(item.id)}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {item.products?.name || '알 수 없는 상품'}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            수량: {item.quantity} · 단가: ₩{item.price_at_time.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          ₩{maxAmount.toLocaleString()}
                        </span>
                      </label>
                      {sel.selected && (
                        <div className="mt-2 ml-6">
                          <label className="text-[10px] text-gray-500 block mb-0.5">환불 금액</label>
                          <input
                            type="number"
                            value={sel.amount}
                            onChange={e => handleItemAmountChange(item.id, Math.max(0, Math.min(maxAmount, Number(e.target.value))))}
                            min={0}
                            max={maxAmount}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-right">
                <span className="text-xs text-gray-500">환불 합계: </span>
                <span className="text-sm font-bold text-blue-600">₩{partialAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Partial refund: direct amount (if no items) */}
          {refundType === 'partial' && (!order.order_items || order.order_items.length === 0) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">환불 금액</label>
              <input
                type="number"
                value={partialAmount}
                onChange={e => setPartialAmount(Math.max(0, Math.min(maxRefundable, Number(e.target.value))))}
                min={0}
                max={maxRefundable}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`최대 ₩${maxRefundable.toLocaleString()}`}
              />
            </div>
          )}

          {/* Reason selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">환불 사유</label>
            <div className="grid grid-cols-2 gap-1.5">
              {REFUND_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-2 py-1.5 text-[11px] rounded-md border transition-all ${
                    reason === r
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {reason === '기타' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="환불 사유를 상세히 입력해 주세요"
                rows={2}
                className="mt-2 w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            )}
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">관리자 메모 (선택)</label>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="내부 참고용 메모"
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">주문 금액</span>
              <span className="font-medium text-gray-900">₩{order.total.toLocaleString()}</span>
            </div>
            {alreadyRefunded > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">기환불 금액</span>
                <span className="font-medium text-orange-600">-₩{alreadyRefunded.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5">
              <span className="font-semibold text-gray-900">환불 금액</span>
              <span className="font-bold text-red-600 text-sm">₩{computedRefundAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Refund history */}
          {refundHistory.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">환불 내역</label>
              <div className="space-y-1.5">
                {refundHistory.map(refund => (
                  <div key={refund.id} className="bg-orange-50 rounded-md p-2.5 border border-orange-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          refund.refund_type === 'full' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {refund.refund_type === 'full' ? '전체환불' : '부분환불'}
                        </span>
                        <p className="text-[11px] text-gray-600 mt-1">{refund.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-600">-₩{refund.refund_amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">
                          {refund.created_at ? new Date(refund.created_at).toLocaleDateString('ko-KR') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isLoadingHistory && (
            <p className="text-[11px] text-gray-400 text-center">환불 내역 불러오는 중...</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || computedRefundAmount <= 0 || !finalReason.trim() || maxRefundable <= 0}
            className="text-xs bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? '처리 중...' : `₩${computedRefundAmount.toLocaleString()} 환불`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
