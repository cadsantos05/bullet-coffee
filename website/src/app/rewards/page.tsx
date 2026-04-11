'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RewardTier {
  id: string;
  name: string;
  min_points: number;
  benefits: string[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
}

const fallbackTiers: RewardTier[] = [
  {
    id: '1',
    name: 'Bronze',
    min_points: 0,
    benefits: ['Earn 1 point per dollar', 'Birthday reward', 'Member-only offers'],
  },
  {
    id: '2',
    name: 'Silver',
    min_points: 200,
    benefits: ['Earn 1.5x points', 'Free size upgrades', 'Early access to new drinks'],
  },
  {
    id: '3',
    name: 'Gold',
    min_points: 500,
    benefits: ['Earn 2x points', 'Free drink monthly', 'Exclusive Gold events'],
  },
];

const fallbackRewards: Reward[] = [
  { id: '1', name: 'Free Coffee', description: 'Any regular drip coffee, on us.', points_cost: 100 },
  { id: '2', name: 'Free Pastry', description: 'Choose any pastry from our case.', points_cost: 150 },
  { id: '3', name: 'Free Specialty Drink', description: 'Any handcrafted drink, any size.', points_cost: 250 },
  { id: '4', name: '$5 Off Merch', description: '$5 off any Bullet Coffee merchandise.', points_cost: 200 },
];

export default function RewardsPage() {
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: tierData } = await supabase
        .from('reward_tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (tierData && tierData.length > 0) {
        setTiers(tierData);
      } else {
        setTiers(fallbackTiers);
      }

      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .order('points_cost', { ascending: true });

      if (rewardData && rewardData.length > 0) {
        setRewards(rewardData);
      } else {
        setRewards(fallbackRewards);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            REWARDS PROGRAM
          </h1>
          <p className="mt-4 text-gray-400 text-lg">Every sip earns you more</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="font-medium">Earn Points</span>
            </div>
            <span className="hidden sm:block text-gray-300 text-2xl">&rarr;</span>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="font-medium">Unlock Tiers</span>
            </div>
            <span className="hidden sm:block text-gray-300 text-2xl">&rarr;</span>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span className="font-medium">Redeem Rewards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
            MEMBERSHIP TIERS
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl border p-8 text-center transition-shadow hover:shadow-lg ${
                  tier.name === 'Gold'
                    ? 'border-yellow-400 bg-yellow-50 shadow-md scale-105 relative'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.name === 'Gold' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    BEST VALUE
                  </span>
                )}
                <h3 className="text-2xl font-bold">{tier.name}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {tier.min_points > 0
                    ? `${tier.min_points}+ points`
                    : 'Starting tier'}
                </p>
                <ul className="mt-8 space-y-3 text-left">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 text-green-500 font-bold">&#10003;</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Rewards */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
            AVAILABLE REWARDS
          </h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow flex flex-col"
              >
                <h3 className="font-semibold text-lg">{reward.name}</h3>
                <p className="mt-2 text-sm text-gray-500 flex-1">{reward.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold">{reward.points_cost} pts</span>
                  <button className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800">
                    Redeem in App
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-black text-white text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            START EARNING TODAY
          </h2>
          <p className="mt-4 text-gray-400 max-w-md mx-auto">
            Download the Bullet Coffee app and join our rewards program to start collecting points with every purchase.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-gray-100"
          >
            Download the App to Start Earning
          </a>
        </div>
      </section>
    </div>
  );
}
