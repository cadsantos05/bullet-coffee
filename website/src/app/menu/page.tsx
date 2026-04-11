'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (cats && cats.length > 0) {
        setCategories(cats);
        setActiveCategory(cats[0].id);
      }

      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (menuItems) setItems(menuItems);
    }

    fetchData();
  }, []);

  const filteredItems = activeCategory
    ? items.filter((item) => item.category_id === activeCategory)
    : items;

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">OUR MENU</h1>
          <p className="mt-4 text-gray-400 text-lg">
            Crafted with care, served with speed
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="sticky top-[72px] z-40 bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl text-gray-300">&#9749;</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="mt-3 font-bold text-lg">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">
                {categories.length === 0
                  ? 'Loading menu...'
                  : 'No items in this category yet.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-gray-800"
        >
          <span>Order on the App</span>
          <span>&rarr;</span>
        </a>
      </div>
    </div>
  );
}
