'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  max_uses_per_user: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
}

export default function PromotionsPage() {
  const [promo_codes, setPromotions] = useState<Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    max_uses_per_user: '1',
    expires_at: '',
    active: true,
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  async function loadPromotions() {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setPromotions(data ?? []);
  }

  function startEdit(promo: Promotion) {
    setEditing(promo);
    setForm({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      min_order_amount: promo.min_order_amount?.toString() || '',
      max_uses: promo.max_uses?.toString() || '',
      max_uses_per_user: promo.max_uses_per_user?.toString() || '1',
      expires_at: promo.expires_at ? promo.expires_at.split('T')[0] : '',
      active: promo.active,
    });
    setShowForm(true);
  }

  async function savePromotion() {
    if (!form.code.trim()) return;
    const payload = {
      code: form.code.toUpperCase().trim(),
      description: form.description,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      max_uses_per_user: parseInt(form.max_uses_per_user) || 1,
      expires_at: form.expires_at || null,
      active: form.active,
    };

    if (editing) {
      await supabase.from('promo_codes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('promo_codes').insert(payload);
    }
    resetForm();
    loadPromotions();
  }

  async function deletePromotion(id: string) {
    if (!confirm('Delete this promotion?')) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    loadPromotions();
  }

  async function toggleActive(promo: Promotion) {
    await supabase.from('promo_codes').update({ active: !promo.active }).eq('id', promo.id);
    loadPromotions();
  }

  function resetForm() {
    setEditing(null);
    setShowForm(false);
    setForm({
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: '',
      min_order_amount: '',
      max_uses: '',
      max_uses_per_user: '1',
      expires_at: '',
      active: true,
    });
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promotions</h1>
          <p className="text-[#666] text-sm mt-1">Manage promo codes and discounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          + Add Promotion
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#1A1A1A] rounded-xl p-6 mb-6 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editing ? 'Edit Promotion' : 'New Promotion'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#666] mb-1">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER20"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="percent">Percentage</option>
                <option value="flat">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Discount Value</label>
              <input
                type="number"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                placeholder={form.discount_type === 'percent' ? '20' : '5.00'}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Min Order ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                placeholder="0"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-xs text-[#666] mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description of the promotion"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Max Uses (total)</label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="Unlimited"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Max Per User</label>
              <input
                type="number"
                value={form.max_uses_per_user}
                onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-white/60">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={savePromotion}
              className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-[#666] px-4 py-2 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-[#1A1A1A] rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Code</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Description</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Discount</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Min Order</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Usage</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Expires</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3 pr-4">Status</th>
                <th className="text-left text-xs text-[#666] font-medium pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promo_codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[#444] text-sm py-8">
                    No promo_codes yet
                  </td>
                </tr>
              ) : (
                promo_codes.map((promo) => (
                  <tr key={promo.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-4 text-sm text-white font-mono font-medium">
                      {promo.code}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/60 max-w-[200px] truncate">
                      {promo.description || '-'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white">
                      {promo.discount_type === 'percent'
                        ? `${promo.discount_value}%`
                        : `$${promo.discount_value.toFixed(2)}`}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/60">
                      {promo.min_order_amount ? `$${promo.min_order_amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 pr-4 text-sm text-white/60">
                      {promo.used_count ?? 0}
                      {promo.max_uses ? ` / ${promo.max_uses}` : ''}
                    </td>
                    <td className="py-3 pr-4 text-sm text-[#666]">
                      {promo.expires_at
                        ? new Date(promo.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => toggleActive(promo)}>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            promo.active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {promo.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(promo)}
                          className="text-xs text-[#666] hover:text-white px-2 py-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deletePromotion(promo.id)}
                          className="text-xs text-[#666] hover:text-red-400 px-2 py-1"
                        >
                          🗑️
                        </button>
                      </div>
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
