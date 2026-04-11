'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Search, CreditCard, Coffee, MapPin, Phone, Mail, Camera } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}

interface RewardTier {
  id: string;
  name: string;
  min_points: number;
  benefits: string[];
}

interface StoreInfo {
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: Record<string, { open: string; close: string }>;
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('featured', true)
        .eq('active', true)
        .limit(4);
      if (items) setFeaturedItems(items);

      const { data: tiers } = await supabase
        .from('reward_tiers')
        .select('*')
        .order('min_points', { ascending: true });
      if (tiers) setRewardTiers(tiers);

      const { data: store } = await supabase
        .from('store_info')
        .select('*')
        .single();
      if (store) setStoreInfo(store);
    }
    fetchData();
  }, []);

  return (
    <div>
      {/* ========== HERO ========== */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[90vh] py-20">
            {/* Text */}
            <div className="animate-slide-left">
              <div className="flex items-center gap-3 mb-8">
                <div className="divider" />
                <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#8B7355]">
                  Pelham, Alabama
                </p>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-[-0.02em] leading-[0.95] text-black">
                Fuel
                <br />
                your day.
              </h1>
              <p className="mt-8 text-lg text-gray-400 leading-relaxed max-w-md font-light">
                Premium coffee, crafted with care and served at speed.
                Order ahead and never wait in line again.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/menu"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-medium text-white hover:bg-[#8B7355] transition-all duration-300"
                >
                  Explore Menu
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 px-8 py-4 text-sm font-medium text-black hover:border-black transition-colors duration-300"
                >
                  Download App
                </Link>
              </div>
              {/* Social proof */}
              <div className="mt-16 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {['bg-[#8B7355]', 'bg-black', 'bg-gray-400', 'bg-[#C4A882]'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white`} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className="text-yellow-400 text-xs">&#9733;</span>
                    ))}
                    <span className="text-yellow-400 text-xs">&#9734;</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">4.7 stars &middot; 60+ reviews</p>
                </div>
              </div>
            </div>

            {/* Photo */}
            <div className="relative animate-slide-right">
              <div className="rounded-[2rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
                <img
                  src="/store-hero.png"
                  alt="Bullet Coffee - Pelham, AL"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating accent */}
              <div className="absolute -bottom-6 -left-6 bg-[#FAF7F2] backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
                <p className="text-xs text-[#8B7355] font-semibold tracking-wider uppercase">Open daily</p>
                <p className="text-sm font-medium text-black mt-1">6:00 AM &ndash; 8:00 PM</p>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FAF7F2] rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-black leading-none">4.7</p>
                  <p className="text-[10px] text-[#8B7355] font-medium mt-0.5">RATING</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MARQUEE STRIP ========== */}
      <section className="bg-black py-4 overflow-hidden">
        <div className="flex animate-[slideMarquee_20s_linear_infinite] whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-white/40 text-sm tracking-[0.3em] uppercase font-light mx-8">
              Coffee &middot; Energy &middot; Specialty &middot; Smoothies &middot; Pastries
            </span>
          ))}
        </div>
        <style>{`@keyframes slideMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </section>

      {/* ========== FEATURED ========== */}
      <section className="py-28 bg-[#FAF7F2] relative grain">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-up">
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#8B7355]">
              Popular Picks
            </p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              What&apos;s Hot
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featuredItems.length > 0 ? featuredItems : [
              { id: '1', name: 'So Good', description: 'Our signature blend', price: 4.50, image_url: null },
              { id: '2', name: 'Vulcano', description: 'Rich espresso with a fiery kick', price: 5.00, image_url: null },
              { id: '3', name: 'Caramel Macchiato', description: 'Vanilla espresso with caramel', price: 5.50, image_url: null },
              { id: '4', name: 'Frozen Blueberry', description: 'Red Bull Blueberry Edition', price: 6.00, image_url: null },
            ]).map((item, index) => (
              <div
                key={item.id}
                className={`group bg-white rounded-2xl overflow-hidden hover-lift animate-fade-up delay-${(index + 1) * 100}`}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl opacity-20 group-hover:scale-110 transition-transform duration-500">
                      &#9749;
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-base">{item.name}</h3>
                    <span className="text-sm font-bold text-[#8B7355]">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 text-sm font-medium text-black hover:text-[#8B7355] transition-colors"
            >
              View full menu
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-up">
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#8B7355]">
              Simple & Fast
            </p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { num: '01', title: 'Browse & Order', desc: 'Explore our menu and customize your drink down to the last detail.', icon: <Search className="w-8 h-8 text-[#8B7355]" /> },
              { num: '02', title: 'Pay Securely', desc: 'Quick checkout through the app. Apple Pay, cards, all accepted.', icon: <CreditCard className="w-8 h-8 text-[#8B7355]" /> },
              { num: '03', title: 'Pick Up & Go', desc: 'Your order is ready when you arrive. No lines, no waiting.', icon: <Coffee className="w-8 h-8 text-[#8B7355]" /> },
            ].map((step, i) => (
              <div key={step.num} className={`text-center animate-fade-up delay-${(i + 1) * 100}`}>
                <div className="flex justify-center mb-4">{step.icon}</div>
                <p className="text-6xl font-extralight text-gray-100 mb-6">{step.num}</p>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== REWARDS ========== */}
      <section className="py-28 bg-black text-white relative grain">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-up">
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#C4A882]">
              Loyalty Program
            </p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              Earn With Every Sip
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              Join our rewards program and unlock exclusive perks as you level up.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {(rewardTiers.length > 0 ? rewardTiers : [
              { id: '1', name: 'Bronze', min_points: 0, benefits: ['Earn 10 pts per dollar', 'Birthday reward', 'Member-only offers'] },
              { id: '2', name: 'Silver', min_points: 500, benefits: ['Earn 12 pts per dollar', 'Free size upgrade', 'Early access'] },
              { id: '3', name: 'Gold', min_points: 1500, benefits: ['Earn 15 pts per dollar', 'Free monthly drink', 'Priority pickup'] },
            ]).map((tier) => (
              <div
                key={tier.id}
                className={`rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  tier.name === 'Gold'
                    ? 'bg-gradient-to-b from-[#C4A882]/20 to-[#8B7355]/10 border border-[#C4A882]/30 ring-1 ring-[#C4A882]/10'
                    : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {tier.name === 'Gold' && (
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C4A882] mb-4">Most Popular</p>
                )}
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {tier.min_points > 0 ? `${tier.min_points.toLocaleString()}+ points` : 'Starting tier'}
                </p>
                <div className="divider mt-6 mb-6" />
                <ul className="space-y-3">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="mt-0.5 text-[#C4A882]">&#10003;</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/rewards"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium text-black hover:bg-[#FAF7F2] transition-colors"
            >
              Join Now
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== INSTAGRAM CTA ========== */}
      <section className="py-20 bg-[#FAF7F2]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#8B7355]">
            Follow Us
          </p>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
            <Camera className="w-7 h-7 text-[#8B7355]" />
            @bullet_coffee
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            Stay in the loop. New drinks, events, and behind-the-scenes.
          </p>
          <a
            href="https://www.instagram.com/bullet_coffee/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-black hover:border-black transition-colors"
          >
            <Camera className="w-4 h-4" />
            Follow on Instagram
            <span>&rarr;</span>
          </a>
        </div>
      </section>

      {/* ========== LOCATION ========== */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-up">
            <p className="text-xs font-semibold tracking-[0.35em] uppercase text-[#8B7355]">
              Visit Us
            </p>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              Find Us
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3340.5!2d-86.8059874!3d33.3058624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDE4JzIxLjEiTiA4NsKwNDgnMjEuNiJX!5e0!3m2!1sen!2sus!4v1&q=2830+Pelham+Pkwy+Pelham+AL+35124"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>

            {/* Info */}
            <div>
              <h3 className="text-2xl font-bold">Bullet Coffee</h3>
              <p className="mt-2 text-sm text-[#8B7355] font-medium">Pelham, Alabama</p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {storeInfo ? `${storeInfo.address}, ${storeInfo.city}, ${storeInfo.state} ${storeInfo.zip}` : '2830 Pelham Pkwy, Pelham, AL 35124'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 pt-2.5">
                    {storeInfo?.phone || '(205) 555-0187'}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 pt-2.5">
                    {storeInfo?.email || 'bulletcoffeeco@gmail.com'}
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100">
                <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-5">
                  Hours
                </h4>
                <table className="w-full text-sm">
                  <tbody>
                    {storeInfo?.hours
                      ? dayOrder.map((day) => {
                          const h = (storeInfo.hours as Record<string, { open: string; close: string }>)[day];
                          return (
                            <tr key={day} className="border-b border-gray-50">
                              <td className="py-3 font-medium text-gray-700">{capitalize(day)}</td>
                              <td className="py-3 text-right text-gray-400 font-light">
                                {h ? `${formatTime(h.open)} \u2013 ${formatTime(h.close)}` : 'Closed'}
                              </td>
                            </tr>
                          );
                        })
                      : dayOrder.map((day) => (
                          <tr key={day} className="border-b border-gray-50">
                            <td className="py-3 font-medium text-gray-700">{capitalize(day)}</td>
                            <td className="py-3 text-right text-gray-400 font-light">6:00 AM &ndash; 8:00 PM</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
