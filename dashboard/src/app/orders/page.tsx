'use client';

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  status: string;
  total: number;
  items_count: number;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  customizations: any;
}

const columns = [
  { key: 'received', label: 'New', color: 'border-blue-500' },
  { key: 'preparing', label: 'Preparing', color: 'border-yellow-500' },
  { key: 'ready', label: 'Ready', color: 'border-green-500' },
  { key: 'picked_up', label: 'Picked Up', color: 'border-gray-500' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const prevOrderCountRef = useRef(0);

  useEffect(() => {
    loadOrders();

    // Realtime subscription
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playBeep();
          }
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function playBeep() {
    try {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 200);
    } catch {
      // Audio not available
    }
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, created_at, user_id, profiles(full_name), order_items(id)')
      .in('status', ['received', 'preparing', 'ready', 'picked_up'])
      .order('created_at', { ascending: false });
    const mapped = (data ?? []).map((o: any) => ({
      ...o,
      customer_name: o.profiles?.full_name || 'Guest',
      customer_email: '',
      items_count: Array.isArray(o.order_items) ? o.order_items.length : 0,
    }));
    setOrders(mapped);
  }

  async function loadOrderItems(orderId: string) {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('id, menu_item_name, quantity, unit_price, customizations')
      .eq('order_id', orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data ?? [] }));
  }

  async function updateStatus(orderId: string, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    loadOrders();
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

  function toggleExpand(orderId: string) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      loadOrderItems(orderId);
    }
  }

  function getNextAction(status: string): { label: string; nextStatus: string } | null {
    switch (status) {
      case 'received':
        return { label: 'Start Preparing', nextStatus: 'preparing' };
      case 'preparing':
        return { label: 'Mark Ready', nextStatus: 'ready' };
      case 'ready':
        return { label: 'Mark Picked Up', nextStatus: 'picked_up' };
      default:
        return null;
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-[#666] text-sm mt-1">
          Manage incoming orders in real-time
        </p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              {/* Column Header */}
              <div
                className={`bg-[#1A1A1A] rounded-t-xl px-4 py-3 border-t-2 ${col.color}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                  <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-[#1A1A1A]/50 rounded-b-xl p-3 space-y-3 min-h-[200px] flex-1">
                {colOrders.length === 0 ? (
                  <p className="text-[#333] text-xs text-center py-8">No orders</p>
                ) : (
                  colOrders.map((order) => {
                    const action = getNextAction(order.status);
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <div
                        key={order.id}
                        className="bg-[#1A1A1A] rounded-lg p-4 cursor-pointer hover:bg-[#222] transition-colors"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-white/60">
                            #{order.id?.slice(0, 8)}
                          </span>
                          <span className="text-xs text-[#666]">
                            {timeAgo(order.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">
                          {order.customer_name || order.customer_email || 'Guest'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#666]">
                            {order.items_count ?? '?'} item
                            {(order.items_count ?? 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-medium text-white">
                            ${Number(order.total || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            {orderItems[order.id] ? (
                              <div className="space-y-2 mb-3">
                                {orderItems[order.id].map((item) => (
                                  <div key={item.id} className="text-xs">
                                    <div className="flex justify-between text-white/80">
                                      <span>
                                        {item.quantity}x {item.menu_item_name}
                                      </span>
                                      <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    {item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0 && (
                                      <p className="text-[#555] ml-4">
                                        {item.customizations.map((c: any) => c.option_name || c.name || String(c)).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#444] mb-3">Loading items...</p>
                            )}

                            {action && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(order.id, action.nextStatus);
                                }}
                                className="w-full text-xs bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                              >
                                {action.label}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
