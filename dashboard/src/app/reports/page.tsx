'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/lib/supabase';

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    newCustomers: 0,
  });
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);

  useEffect(() => {
    loadReport();
  }, [dateFrom, dateTo]);

  async function loadReport() {
    // Orders in date range
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status')
      .gte('created_at', dateFrom + 'T00:00:00')
      .lte('created_at', dateTo + 'T23:59:59');

    const allOrders = orders ?? [];
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const avgOrder = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    // Status breakdown
    const statusMap: Record<string, number> = {};
    allOrders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    setStatusBreakdown(
      Object.entries(statusMap).map(([status, count]) => ({ status, count }))
    );

    // New customers
    const { count: newCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFrom + 'T00:00:00')
      .lte('created_at', dateTo + 'T23:59:59');

    setStats({
      totalRevenue,
      totalOrders: allOrders.length,
      avgOrderValue: avgOrder,
      newCustomers: newCustomers ?? 0,
    });

    // Top selling items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('menu_item_name, quantity, unit_price, order_id')
      .in(
        'order_id',
        allOrders.map((o) => o.id)
      );

    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    (orderItems ?? []).forEach((item) => {
      const name = item.menu_item_name || 'Unknown';
      if (!itemMap[name]) itemMap[name] = { quantity: 0, revenue: 0 };
      itemMap[name].quantity += item.quantity || 1;
      itemMap[name].revenue += (item.unit_price || 0) * (item.quantity || 1);
    });

    const sorted = Object.entries(itemMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setTopItems(sorted);
  }

  const statusColors: Record<string, string> = {
    received: 'text-blue-400',
    preparing: 'text-yellow-400',
    ready: 'text-green-400',
    picked_up: 'text-gray-400',
    cancelled: 'text-red-400',
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-[#666] text-sm mt-1">Analyze your shop performance</p>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block text-xs text-[#666] mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[#666] mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon="💰"
        />
        <StatsCard title="Total Orders" value={stats.totalOrders} icon="📋" />
        <StatsCard
          title="Avg Order Value"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          icon="📊"
        />
        <StatsCard title="New Customers" value={stats.newCustomers} icon="👤" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Selling Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Item</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Qty Sold</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-[#444] text-sm py-8">
                      No data for this period
                    </td>
                  </tr>
                ) : (
                  topItems.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 text-sm text-white">{item.name}</td>
                      <td className="py-3 pr-4 text-sm text-white/60">{item.quantity}</td>
                      <td className="py-3 text-sm text-white font-medium">
                        ${item.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {statusBreakdown.length === 0 ? (
              <p className="text-[#444] text-sm text-center py-8">No data for this period</p>
            ) : (
              statusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between bg-[#111111] rounded-lg px-4 py-3"
                >
                  <span
                    className={`text-sm font-medium capitalize ${
                      statusColors[item.status] || 'text-white/60'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-white/5 rounded-full h-2">
                      <div
                        className="bg-white/30 rounded-full h-2"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.count / Math.max(stats.totalOrders, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
