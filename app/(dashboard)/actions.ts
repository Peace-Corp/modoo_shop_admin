'use server';

import { createServerClient } from '@/lib/supabase';
import { DashboardStats, DailyOrderStats } from '@/types';

interface DateRange {
  from?: string;
  to?: string;
}

function aggregateOrdersByDate(
  orders: { created_at: string | null; total: number }[],
  startDate: Date,
  endDate: Date
): DailyOrderStats[] {
  const dateMap = new Map<string, { orderCount: number; totalAmount: number }>();

  // Initialize all dates in range with zero values
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dateMap.set(dateStr, { orderCount: 0, totalAmount: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Aggregate actual orders
  orders.forEach(order => {
    if (!order.created_at) return;
    const date = order.created_at.split('T')[0];
    const existing = dateMap.get(date);
    if (existing) {
      dateMap.set(date, {
        orderCount: existing.orderCount + 1,
        totalAmount: existing.totalAmount + Number(order.total),
      });
    }
  });

  return Array.from(dateMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchDashboardStats(dateRange?: DateRange): Promise<DashboardStats> {
  const supabase = createServerClient();

  // Build order query with date filtering
  let ordersQuery = supabase.from('orders').select('*', { count: 'exact' });

  if (dateRange?.from) {
    ordersQuery = ordersQuery.gte('created_at', dateRange.from);
  }
  if (dateRange?.to) {
    const toDate = new Date(dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    ordersQuery = ordersQuery.lt('created_at', toDate.toISOString());
  }

  // Recent orders query (always show 5 most recent within the date range)
  let recentOrdersQuery = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (dateRange?.from) {
    recentOrdersQuery = recentOrdersQuery.gte('created_at', dateRange.from);
  }
  if (dateRange?.to) {
    const toDate = new Date(dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    recentOrdersQuery = recentOrdersQuery.lt('created_at', toDate.toISOString());
  }

  // Orders for chart (last 7 days or date range)
  const chartStartDate = dateRange?.from
    ? new Date(dateRange.from)
    : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // 7 days including today
  chartStartDate.setHours(0, 0, 0, 0);

  const chartEndDate = dateRange?.to ? new Date(dateRange.to) : new Date();
  chartEndDate.setHours(23, 59, 59, 999);

  const queryEndDate = new Date(chartEndDate);
  queryEndDate.setDate(queryEndDate.getDate() + 1);

  const chartOrdersQuery = supabase
    .from('orders')
    .select('created_at, total')
    .gte('created_at', chartStartDate.toISOString())
    .lt('created_at', queryEndDate.toISOString())
    .order('created_at', { ascending: true });

  const [productsRes, brandsRes, ordersRes, recentOrdersRes, salesRes, chartOrdersRes] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact' }),
    supabase.from('brands').select('*', { count: 'exact' }),
    ordersQuery,
    recentOrdersQuery,
    supabase.from('sales_data').select('*').order('date', { ascending: false }).limit(7),
    chartOrdersQuery,
  ]);

  const totalRevenue = salesRes.data?.reduce((sum, d) => sum + Number(d.revenue), 0) || 0;
  const totalOrderAmount = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const dailyOrderStats = aggregateOrdersByDate(chartOrdersRes.data || [], chartStartDate, chartEndDate);

  return {
    totalRevenue,
    totalOrders: ordersRes.count || 0,
    totalOrderAmount,
    totalProducts: productsRes.count || 0,
    totalBrands: brandsRes.count || 0,
    recentOrders: (recentOrdersRes.data || []) as unknown as DashboardStats['recentOrders'],
    salesData: (salesRes.data || []) as DashboardStats['salesData'],
    dailyOrderStats,
  };
}
