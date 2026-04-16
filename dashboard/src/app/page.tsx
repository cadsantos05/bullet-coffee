'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/lib/supabase';

const statusColors: Record<string, string> = {
  received: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-yellow-500/20 text-yellow-400',
  ready: 'bg-green-500/20 text-green-400',
  picked_up: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    avgOrderValue: 0,
    activeOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0];

    // Orders today
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, total')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59');

    const orders = todayOrders ?? [];
    const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const avg = orders.length > 0 ? revenue / orders.length : 0;

    // Active orders
    const { count: active } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['received', 'preparing', 'ready']);

    setStats({
      ordersToday: orders.length,
      revenueToday: revenue,
      avgOrderValue: avg,
      activeOrders: active ?? 0,
    });
  }

  async function loadRecentOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, total, status, created_at, user_id, profiles(full_name), order_items(id)')
      .order('created_at', { ascending: false })
      .limit(10);

    const mapped = (data ?? []).map((o: any) => ({
      ...o,
      customer_name: o.profiles?.full_name || 'Guest',
      items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
    }));
    setRecentOrders(mapped);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#666] text-sm mt-1">Overview of your coffee shop</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Orders Today" value={stats.ordersToday} icon="📋" />
        <StatsCard
          title="Revenue Today"
          value={`$${stats.revenueToday.toFixed(2)}`}
          icon="💰"
        />
        <StatsCard
          title="Avg Order Value"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          icon="📊"
        />
        <StatsCard title="Active Orders" value={stats.activeOrders} icon="🔥" />
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1A1A1A] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Order</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Name</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Items</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Total</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Status</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[#444] text-sm py-8">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-4 text-sm text-white font-mono">
                      #{order.id?.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/70">
                      {order.customer_name || 'Guest'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/70">
                      {order.items_count ?? '-'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white font-medium">
                      ${Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          statusColors[order.status] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-[#666]">
                      {timeAgo(order.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
