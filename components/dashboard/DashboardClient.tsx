'use client';

import { useState, useEffect, useTransition } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DashboardStats } from '@/types';
import { fetchDashboardStats } from '@/app/(dashboard)/actions';

interface DashboardClientProps {
  initialStats: DashboardStats;
}

export default function DashboardClient({ initialStats }: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const dateRange = date?.from
        ? {
            from: date.from.toISOString(),
            to: date.to?.toISOString(),
          }
        : undefined;

      const newStats = await fetchDashboardStats(dateRange);
      setStats(newStats);
    });
  }, [date]);

  const handleClearDate = () => {
    setDate(undefined);
  };

  const statCards = [
    {
      name: '총 주문 금액',
      value: `₩${stats.totalOrderAmount.toLocaleString('ko-KR')}`,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      name: '총 주문 수',
      value: stats.totalOrders.toString(),
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    },
    {
      name: '총 상품',
      value: stats.totalProducts.toString(),
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      name: '총 브랜드',
      value: stats.totalBrands.toString(),
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-lg font-bold text-gray-900">대시보드 개요</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal min-w-[240px]',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'yyyy.MM.dd', { locale: ko })} -{' '}
                      {format(date.to, 'yyyy.MM.dd', { locale: ko })}
                    </>
                  ) : (
                    format(date.from, 'yyyy.MM.dd', { locale: ko })
                  )
                ) : (
                  <span>날짜 범위 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button variant="ghost" size="sm" onClick={handleClearDate}>
              초기화
            </Button>
          )}
          {isPending && (
            <span className="text-sm text-gray-500">로딩중...</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {statCards.map(stat => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          최근 주문
          {date?.from && (
            <span className="text-xs font-normal text-gray-500 ml-2">
              ({format(date.from, 'MM.dd', { locale: ko })}
              {date.to && ` - ${format(date.to, 'MM.dd', { locale: ko })}`})
            </span>
          )}
        </h2>
        <div className="space-y-2">
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center text-xs py-6">주문이 없습니다</p>
          ) : (
            stats.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-xs truncate max-w-[120px]">{order.id}</p>
                  <p className="text-xs text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 text-xs">₩{order.total.toLocaleString('ko-KR')}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status === 'pending' ? '대기중' :
                     order.status === 'processing' ? '처리중' :
                     order.status === 'shipped' ? '배송중' :
                     order.status === 'delivered' ? '배송완료' :
                     order.status === 'cancelled' ? '취소됨' : order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
