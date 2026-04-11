'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

interface StoreInfo {
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

export default function ContactPage() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStore() {
      const { data } = await supabase.from('store_info').select('*').single();
      if (data) setStoreInfo(data);
    }
    fetchStore();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
      ]);

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong. Please try again.');
    } else {
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">GET IN TOUCH</h1>
          <p className="mt-4 text-gray-400 text-lg">
            We&apos;d love to hear from you
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold">Send Us a Message</h2>
              <p className="mt-2 text-gray-500">
                Have a question, feedback, or catering inquiry? Drop us a line.
              </p>

              {success && (
                <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
                  Thank you! Your message has been sent. We&apos;ll get back to you soon.
                </div>
              )}

              {error && (
                <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Store Info */}
            <div>
              <h2 className="text-2xl font-bold">Store Information</h2>
              <p className="mt-2 text-gray-500">Come visit us or give us a call.</p>

              <div className="mt-8 space-y-8">
                {/* Address */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h3>
                  <p className="text-gray-700">
                    {storeInfo?.address || '2830 Pelham Pkwy, Pelham, AL 35124'}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <Phone className="w-4 h-4" />
                    Phone
                  </h3>
                  <p className="text-gray-700">
                    {storeInfo?.phone || '(205) 555-0187'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <Mail className="w-4 h-4" />
                    Email
                  </h3>
                  <p className="text-gray-700">
                    {storeInfo?.email || 'bulletcoffeeco@gmail.com'}
                  </p>
                </div>

                {/* Hours */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    <Clock className="w-4 h-4" />
                    Hours
                  </h3>
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
          </div>
        </div>
      </section>
    </div>
  );
}
