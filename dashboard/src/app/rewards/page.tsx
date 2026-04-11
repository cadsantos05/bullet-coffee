'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface RewardTier {
  id: string;
  name: string;
  min_points: number;
  benefits: any[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: number;
  active: boolean;
}

export default function RewardsPage() {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [tierForm, setTierForm] = useState({ name: '', min_points: '', benefits: '' });
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_cost: '',
    reward_type: 'discount_percent',
    reward_value: '',
    active: true,
  });

  useEffect(() => {
    loadTiers();
    loadRewards();
  }, []);

  async function loadTiers() {
    const { data } = await supabase
      .from('reward_tiers')
      .select('*')
      .order('min_points');
    setTiers(data ?? []);
  }

  async function loadRewards() {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .order('points_cost');
    setRewards(data ?? []);
  }

  function startEditTier(tier: RewardTier) {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      min_points: tier.min_points.toString(),
      benefits: Array.isArray(tier.benefits) ? tier.benefits.join(', ') : '',
    });
  }

  async function saveTier() {
    if (!editingTier) return;
    await supabase
      .from('reward_tiers')
      .update({
        name: tierForm.name,
        min_points: parseInt(tierForm.min_points) || 0,
        benefits: tierForm.benefits.split(',').map((b: string) => b.trim()).filter(Boolean),
      })
      .eq('id', editingTier.id);
    setEditingTier(null);
    loadTiers();
  }

  function startEditReward(reward: Reward) {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description || '',
      points_cost: reward.points_cost.toString(),
      reward_type: reward.reward_type,
      reward_value: reward.reward_value?.toString() || '',
      active: reward.active,
    });
    setShowAddReward(true);
  }

  async function saveReward() {
    const payload = {
      name: rewardForm.name,
      description: rewardForm.description,
      points_cost: parseInt(rewardForm.points_cost) || 0,
      reward_type: rewardForm.reward_type,
      reward_value: parseFloat(rewardForm.reward_value) || 0,
      active: rewardForm.active,
    };

    if (editingReward) {
      await supabase.from('rewards').update(payload).eq('id', editingReward.id);
    } else {
      await supabase.from('rewards').insert(payload);
    }
    resetRewardForm();
    loadRewards();
  }

  async function deleteReward(id: string) {
    if (!confirm('Delete this reward?')) return;
    await supabase.from('rewards').delete().eq('id', id);
    loadRewards();
  }

  async function toggleRewardActive(reward: Reward) {
    await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id);
    loadRewards();
  }

  function resetRewardForm() {
    setEditingReward(null);
    setShowAddReward(false);
    setRewardForm({
      name: '',
      description: '',
      points_cost: '',
      reward_type: 'discount_percent',
      reward_value: '',
      active: true,
    });
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Rewards Program</h1>
        <p className="text-[#666] text-sm mt-1">Configure tiers and rewards</p>
      </div>

      {/* Reward Tiers */}
      <div className="bg-[#1A1A1A] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Reward Tiers</h2>
        <div className="space-y-3">
          {tiers.length === 0 ? (
            <p className="text-[#444] text-sm">No tiers configured</p>
          ) : (
            tiers.map((tier) =>
              editingTier?.id === tier.id ? (
                <div
                  key={tier.id}
                  className="bg-[#111111] rounded-lg p-4 border border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#666] mb-1">Name</label>
                      <input
                        value={tierForm.name}
                        onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#666] mb-1">Min Points</label>
                      <input
                        type="number"
                        value={tierForm.min_points}
                        onChange={(e) =>
                          setTierForm({ ...tierForm, min_points: e.target.value })
                        }
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#666] mb-1">Benefits</label>
                      <input
                        value={tierForm.benefits}
                        onChange={(e) =>
                          setTierForm({ ...tierForm, benefits: e.target.value })
                        }
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveTier}
                      className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTier(null)}
                      className="text-xs text-[#666] px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={tier.id}
                  className="flex items-center justify-between bg-[#111111] rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{tier.name}</p>
                      <p className="text-xs text-[#666]">
                        {tier.min_points} points required
                      </p>
                    </div>
                    {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                      <p className="text-xs text-white/40">{tier.benefits.join(', ')}</p>
                    )}
                  </div>
                  <button
                    onClick={() => startEditTier(tier)}
                    className="text-xs text-[#666] hover:text-white px-2 py-1"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Available Rewards */}
      <div className="bg-[#1A1A1A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Available Rewards</h2>
          <button
            onClick={() => {
              resetRewardForm();
              setShowAddReward(true);
            }}
            className="text-sm bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            + Add Reward
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddReward && (
          <div className="bg-[#111111] rounded-lg p-4 border border-white/10 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#666] mb-1">Name</label>
                <input
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Points Cost</label>
                <input
                  type="number"
                  value={rewardForm.points_cost}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, points_cost: e.target.value })
                  }
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-[#666] mb-1">Description</label>
                <input
                  value={rewardForm.description}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, description: e.target.value })
                  }
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Type</label>
                <select
                  value={rewardForm.reward_type}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="free_item">Free Item</option>
                  <option value="discount_percent">Percentage Off</option>
                  <option value="discount_flat">Flat Discount</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={rewardForm.reward_value}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={rewardForm.active}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, active: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-white/60">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveReward}
                className="text-xs bg-white text-black px-4 py-2 rounded-lg font-medium"
              >
                {editingReward ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetRewardForm}
                className="text-xs text-[#666] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rewards List */}
        <div className="space-y-2">
          {rewards.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-4">No rewards configured</p>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between bg-[#111111] rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{reward.name}</p>
                    <p className="text-xs text-[#666]">
                      {reward.points_cost} pts · {reward.reward_type} · ${reward.reward_value}
                    </p>
                    {reward.description && (
                      <p className="text-xs text-white/30 mt-0.5">{reward.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRewardActive(reward)}
                    className={`w-8 h-5 rounded-full transition-colors ${
                      reward.active ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                        reward.active ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => startEditReward(reward)}
                    className="text-xs text-[#666] hover:text-white px-2 py-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="text-xs text-[#666] hover:text-red-400 px-2 py-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
