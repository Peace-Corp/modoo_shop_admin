import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/types';

async function getDashboardStats(): Promise<DashboardStats> {
  const [productsRes, brandsRes, ordersRes, salesRes] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact' }),
    supabase.from('brands').select('*', { count: 'exact' }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('sales_data').select('*').order('date', { ascending: false }).limit(7),
  ]);

  const totalRevenue = salesRes.data?.reduce((sum, d) => sum + Number(d.revenue), 0) || 0;

  return {
    totalRevenue,
    totalOrders: ordersRes.data?.length || 0,
    totalProducts: productsRes.count || 0,
    totalBrands: brandsRes.count || 0,
    recentOrders: (ordersRes.data || []) as DashboardStats['recentOrders'],
    salesData: (salesRes.data || []) as DashboardStats['salesData'],
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      name: '총 매출',
      value: `₩${stats.totalRevenue.toLocaleString('ko-KR')}`,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      name: '총 주문',
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">대시보드 개요</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(stat => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">매출 현황 (최근 7일)</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.salesData.map((day, index) => {
              const maxRevenue = Math.max(...stats.salesData.map(d => Number(d.revenue)));
              const height = maxRevenue > 0 ? (Number(day.revenue) / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 주문</h2>
          <div className="space-y-4">
            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">주문이 없습니다</p>
            ) : (
              stats.recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₩{order.total.toLocaleString('ko-KR')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
