'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  total_points: number;
  lifetime_points: number;
  created_at: string;
}

interface OrderHistory {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface PointsLedger {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [pointsLedger, setPointsLedger] = useState<PointsLedger[]>([]);
  const [pointsAdjust, setPointsAdjust] = useState({ amount: '', reason: '' });
  const [showAdjust, setShowAdjust] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, total_points, lifetime_points, created_at')
      .order('created_at', { ascending: false });
    setCustomers(data ?? []);
  }

  async function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setShowAdjust(false);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setOrderHistory(orders ?? []);

    const { data: ledger } = await supabase
      .from('reward_points_ledger')
      .select('id, points, type, description, created_at')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setPointsLedger(ledger ?? []);
  }

  async function adjustPoints() {
    if (!selectedCustomer || !pointsAdjust.amount || !pointsAdjust.reason) return;
    const amount = parseInt(pointsAdjust.amount);

    await supabase.from('reward_points_ledger').insert({
      user_id: selectedCustomer.id,
      points: amount,
      type: 'adjusted',
      description: pointsAdjust.reason,
    });

    await supabase
      .from('profiles')
      .update({ total_points: (selectedCustomer.total_points || 0) + amount })
      .eq('id', selectedCustomer.id);

    setPointsAdjust({ amount: '', reason: '' });
    setShowAdjust(false);
    loadCustomers();
    selectCustomer({ ...selectedCustomer, total_points: (selectedCustomer.total_points || 0) + amount });
  }

  const filtered = customers.filter(
    (c) =>
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-[#666] text-sm mt-1">Manage customer profiles and points</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-[#1A1A1A] rounded-xl p-6">
          {/* Search */}
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Name</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Phone</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Points</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Lifetime</th>
                  <th className="text-left text-xs text-[#666] font-medium pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-[#444] text-sm py-8">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors ${
                        selectedCustomer?.id === c.id ? 'bg-white/5' : ''
                      }`}
                      onClick={() => selectCustomer(c)}
                    >
                      <td className="py-3 pr-4 text-sm text-white">
                        {c.full_name || 'No name'}
                      </td>
                      <td className="py-3 pr-4 text-sm text-white/60">{c.phone || '-'}</td>
                      <td className="py-3 pr-4 text-sm text-white font-medium">
                        {c.total_points ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-sm text-white/60">
                        {c.lifetime_points ?? 0}
                      </td>
                      <td className="py-3 text-sm text-[#666]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          {!selectedCustomer ? (
            <div className="text-center py-12">
              <p className="text-[#444] text-sm">Select a customer to view details</p>
            </div>
          ) : (
            <>
              {/* Customer Info */}
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg mb-3">
                  {selectedCustomer.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {selectedCustomer.full_name || 'No name'}
                </h3>
                <p className="text-sm text-[#666]">{selectedCustomer.phone || 'No phone'}</p>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-xl font-bold text-white">{selectedCustomer.total_points ?? 0}</p>
                    <p className="text-xs text-[#666]">Points</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {selectedCustomer.lifetime_points ?? 0}
                    </p>
                    <p className="text-xs text-[#666]">Lifetime</p>
                  </div>
                </div>
              </div>

              {/* Adjust Points */}
              <div className="mb-6">
                {showAdjust ? (
                  <div className="bg-[#111111] rounded-lg p-4 border border-white/10">
                    <div className="space-y-3">
                      <input
                        type="number"
                        value={pointsAdjust.amount}
                        onChange={(e) =>
                          setPointsAdjust({ ...pointsAdjust, amount: e.target.value })
                        }
                        placeholder="Points (negative to subtract)"
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <input
                        value={pointsAdjust.reason}
                        onChange={(e) =>
                          setPointsAdjust({ ...pointsAdjust, reason: e.target.value })
                        }
                        placeholder="Reason"
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={adjustPoints}
                          className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => setShowAdjust(false)}
                          className="text-xs text-[#666] px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAdjust(true)}
                    className="text-xs text-white/40 hover:text-white border border-white/10 px-3 py-2 rounded-lg w-full transition-colors"
                  >
                    Adjust Points
                  </button>
                )}
              </div>

              {/* Order History */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white mb-3">Order History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderHistory.length === 0 ? (
                    <p className="text-xs text-[#444]">No orders</p>
                  ) : (
                    orderHistory.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between bg-[#111111] rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-mono text-white/60">
                            #{o.id?.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[#444]">
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-white">
                            ${Number(o.total).toFixed(2)}
                          </p>
                          <p className={`text-xs ${statusColors[o.status] || 'text-[#666]'}`}>
                            {o.status}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Points Ledger */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Points History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pointsLedger.length === 0 ? (
                    <p className="text-xs text-[#444]">No transactions</p>
                  ) : (
                    pointsLedger.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between bg-[#111111] rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-white/60">{p.description || p.type}</p>
                          <p className="text-xs text-[#444]">
                            {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            p.points >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {p.points >= 0 ? '+' : ''}
                          {p.points}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
