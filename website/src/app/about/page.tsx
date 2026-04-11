'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StoreInfo {
  about_text: string;
  address: string;
  phone: string;
  email: string;
  hours: Record<string, {open: string; close: string}>;
}

// Helper to format time from 24h to 12h
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Helper to capitalize day name
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Day order for display
const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const fallbackAbout =
  "Bullet Coffee Co. was born from a simple idea: great coffee should not slow you down. We source premium beans, roast them locally, and serve them fast. Whether you're grabbing your morning fuel or your afternoon pick-me-up, we've got you covered. Proudly serving Pelham, Alabama.";

const values = [
  {
    title: 'Quality First',
    desc: 'We source the finest beans and roast them in small batches for maximum freshness and flavor.',
    icon: '&#9733;',
  },
  {
    title: 'Speed Matters',
    desc: 'Order ahead, pick up fast. Your time is valuable and we respect every minute of it.',
    icon: '&#9889;',
  },
  {
    title: 'Community',
    desc: "More than coffee, we're building a neighborhood gathering place where everyone belongs.",
    icon: '&#9829;',
  },
];

export default function AboutPage() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase.from('store_info').select('*').single();
      if (data) setStoreInfo(data);
    }
    fetchStore();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">OUR STORY</h1>
        </div>
      </section>

      {/* About Text */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-lg sm:text-xl leading-relaxed text-gray-700 text-center">
            {storeInfo?.about_text || fallbackAbout}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
            OUR VALUES
          </h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-8 text-center border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div
                  className="text-4xl mb-6"
                  dangerouslySetInnerHTML={{ __html: value.icon }}
                />
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
            VISIT US
          </h2>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Location</h3>
              <div className="space-y-3 text-gray-600">
                <p>{storeInfo?.address || '2830 Pelham Pkwy, Pelham, AL 35124'}</p>
                <p>{storeInfo?.phone || '(205) 555-0187'}</p>
                <p>{storeInfo?.email || 'bulletcoffeeco@gmail.com'}</p>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Hours</h3>
              <table className="w-full text-sm">
                <tbody>
                  {storeInfo?.hours
                    ? dayOrder.map((day) => {
                        const h = (storeInfo.hours as Record<string, {open: string; close: string}>)[day];
                        return (
                          <tr key={day} className="border-b border-gray-100">
                            <td className="py-2.5 font-medium text-gray-800 capitalize">{capitalize(day)}</td>
                            <td className="py-2.5 text-right text-gray-500">
                              {h ? `${formatTime(h.open)} - ${formatTime(h.close)}` : 'Closed'}
                            </td>
                          </tr>
                        );
                      })
                    : [
                        ['Monday - Friday', '6:00 AM - 8:00 PM'],
                        ['Saturday', '7:00 AM - 9:00 PM'],
                        ['Sunday', '8:00 AM - 6:00 PM'],
                      ].map(([day, time]) => (
                        <tr key={day} className="border-b border-gray-100">
                          <td className="py-2.5 font-medium text-gray-800">{day}</td>
                          <td className="py-2.5 text-right text-gray-500">{time}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
