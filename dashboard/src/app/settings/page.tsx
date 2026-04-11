'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Hours {
  [day: string]: { open: string; close: string };
}

export default function SettingsPage() {
  const [storeInfo, setStoreInfo] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    tax_rate: '',
    estimated_prep_minutes: '',
    points_per_dollar: '',
    about_text: '',
    hero_image_url: '',
  });
  const [hours, setHours] = useState<Hours>(() => {
    const h: Hours = {};
    DAYS.forEach((d) => (h[d] = { open: '07:00', close: '18:00' }));
    return h;
  });
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase.from('store_info').select('*').limit(1).single();
    if (data) {
      setStoreInfo({
        id: data.id,
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        phone: data.phone || '',
        email: data.email || '',
        tax_rate: data.tax_rate?.toString() || '',
        estimated_prep_minutes: data.estimated_prep_minutes?.toString() || '',
        points_per_dollar: data.points_per_dollar?.toString() || '',
        about_text: data.about_text || '',
        hero_image_url: data.hero_image_url || '',
      });
      if (data.hours) {
        try {
          const parsed = typeof data.hours === 'string' ? JSON.parse(data.hours) : data.hours;
          setHours((prev) => ({ ...prev, ...parsed }));
        } catch {
          // keep defaults
        }
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    let heroUrl = storeInfo.hero_image_url;
    if (heroFile) {
      const ext = heroFile.name.split('.').pop();
      const name = `hero-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('menu-images').upload(name, heroFile);
      if (!error) {
        const { data } = supabase.storage.from('menu-images').getPublicUrl(name);
        heroUrl = data.publicUrl;
      }
    }

    const payload = {
      name: storeInfo.name,
      address: storeInfo.address,
      city: storeInfo.city,
      state: storeInfo.state,
      zip: storeInfo.zip,
      phone: storeInfo.phone,
      email: storeInfo.email,
      tax_rate: parseFloat(storeInfo.tax_rate) || 0,
      estimated_prep_minutes: parseInt(storeInfo.estimated_prep_minutes) || 10,
      points_per_dollar: parseInt(storeInfo.points_per_dollar) || 10,
      about_text: storeInfo.about_text,
      hero_image_url: heroUrl,
      hours: hours,
    };

    if (storeInfo.id) {
      await supabase.from('store_info').update(payload).eq('id', storeInfo.id);
    } else {
      await supabase.from('store_info').insert(payload);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateField(field: string, value: string) {
    setStoreInfo((prev) => ({ ...prev, [field]: value }));
  }

  function updateHours(day: string, field: 'open' | 'close', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Store Settings</h1>
          <p className="text-[#666] text-sm mt-1">Configure your coffee shop</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Store Information */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#666] mb-1">Store Name</label>
              <input
                value={storeInfo.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Email</label>
              <input
                type="email"
                value={storeInfo.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Phone</label>
              <input
                value={storeInfo.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Address</label>
              <input
                value={storeInfo.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">City</label>
              <input
                value={storeInfo.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#666] mb-1">State</label>
                <input
                  value={storeInfo.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs text-[#666] mb-1">ZIP</label>
                <input
                  value={storeInfo.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#666] mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={storeInfo.tax_rate}
                onChange={(e) => updateField('tax_rate', e.target.value)}
                placeholder="8.25"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Est. Prep Time (min)</label>
              <input
                type="number"
                value={storeInfo.estimated_prep_minutes}
                onChange={(e) => updateField('estimated_prep_minutes', e.target.value)}
                placeholder="15"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Points Per Dollar</label>
              <input
                type="number"
                value={storeInfo.points_per_dollar}
                onChange={(e) => updateField('points_per_dollar', e.target.value)}
                placeholder="1"
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>

        {/* About & Hero Image */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">About & Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#666] mb-1">About Text</label>
              <textarea
                value={storeInfo.about_text}
                onChange={(e) => updateField('about_text', e.target.value)}
                rows={4}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
                placeholder="Tell your customers about your coffee shop..."
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Hero Image</label>
              <div className="flex items-center gap-4">
                {storeInfo.hero_image_url && (
                  <img
                    src={storeInfo.hero_image_url}
                    alt="Hero"
                    className="w-24 h-16 rounded-lg object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-[#666] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-white/10 file:text-white/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Hours */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Store Hours</h2>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <span className="text-sm text-white/60 w-28">{day}</span>
                <input
                  type="time"
                  value={hours[day]?.open || '07:00'}
                  onChange={(e) => updateHours(day, 'open', e.target.value)}
                  className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[#666] text-sm">to</span>
                <input
                  type="time"
                  value={hours[day]?.close || '18:00'}
                  onChange={(e) => updateHours(day, 'close', e.target.value)}
                  className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
