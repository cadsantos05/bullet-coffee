'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  featured: boolean;
  active: boolean;
}

interface CustomizationGroup {
  id: string;
  name: string;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [customizationGroups, setCustomizationGroups] = useState<CustomizationGroup[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    featured: false,
    active: true,
  });
  const [itemCustomizations, setItemCustomizations] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadCategories();
    loadCustomizationGroups();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadItems(selectedCategory);
    }
  }, [selectedCategory]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    setCategories(data ?? []);
    if (data && data.length > 0 && !selectedCategory) {
      setSelectedCategory(data[0].id);
    }
  }

  async function loadItems(categoryId: string) {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    setItems(data ?? []);
  }

  async function loadCustomizationGroups() {
    const { data } = await supabase
      .from('customization_groups')
      .select('id, name')
      .order('name');
    setCustomizationGroups(data ?? []);
  }

  async function loadItemCustomizations(itemId: string) {
    const { data } = await supabase
      .from('item_customization_groups')
      .select('customization_group_id')
      .eq('menu_item_id', itemId);
    setItemCustomizations((data ?? []).map((d: any) => d.customization_group_id));
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await supabase.from('categories').insert({
      name: newCategoryName.trim(),
      sort_order: categories.length,
      active: true,
    });
    setNewCategoryName('');
    setShowAddCategory(false);
    loadCategories();
  }

  async function updateCategory(id: string, updates: Partial<Category>) {
    await supabase.from('categories').update(updates).eq('id', id);
    loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category and all its items?')) return;
    await supabase.from('menu_items').delete().eq('category_id', id);
    await supabase.from('categories').delete().eq('id', id);
    if (selectedCategory === id) setSelectedCategory(null);
    loadCategories();
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('menu-images').upload(name, file);
    if (error) return null;
    const { data } = supabase.storage.from('menu-images').getPublicUrl(name);
    return data.publicUrl;
  }

  async function saveItem() {
    let imageUrl = editingItem?.image_url ?? null;
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) imageUrl = url;
    }

    const payload = {
      category_id: selectedCategory,
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(itemForm.price) || 0,
      featured: itemForm.featured,
      active: itemForm.active,
      image_url: imageUrl,
    };

    let itemId = editingItem?.id;

    if (editingItem) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
    } else {
      const { data } = await supabase.from('menu_items').insert(payload).select('id').single();
      itemId = data?.id;
    }

    // Save customization group assignments
    if (itemId) {
      await supabase.from('item_customization_groups').delete().eq('menu_item_id', itemId);
      if (itemCustomizations.length > 0) {
        await supabase.from('item_customization_groups').insert(
          itemCustomizations.map((gid) => ({ menu_item_id: itemId, customization_group_id: gid }))
        );
      }
    }

    resetItemForm();
    if (selectedCategory) loadItems(selectedCategory);
  }

  async function toggleItemActive(item: MenuItem) {
    await supabase.from('menu_items').update({ active: !item.active }).eq('id', item.id);
    if (selectedCategory) loadItems(selectedCategory);
  }

  async function toggleItemFeatured(item: MenuItem) {
    await supabase.from('menu_items').update({ featured: !item.featured }).eq('id', item.id);
    if (selectedCategory) loadItems(selectedCategory);
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      featured: item.featured,
      active: item.active,
    });
    loadItemCustomizations(item.id);
    setShowAddItem(true);
  }

  function resetItemForm() {
    setEditingItem(null);
    setShowAddItem(false);
    setItemForm({ name: '', description: '', price: '', featured: false, active: true });
    setItemCustomizations([]);
    setImageFile(null);
  }

  const categoryItemCounts = items.length;

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu Management</h1>
          <p className="text-[#666] text-sm mt-1">Manage categories and items</p>
        </div>
        <a
          href="/menu/customizations"
          className="text-sm text-white/60 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors"
        >
          Manage Customizations
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Categories */}
        <div className="bg-[#1A1A1A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Categories</h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-sm bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              + Add
            </button>
          </div>

          {showAddCategory && (
            <div className="flex gap-2 mb-4">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <button onClick={addCategory} className="text-sm bg-white text-black px-3 py-1.5 rounded-lg font-medium">
                Save
              </button>
              <button onClick={() => setShowAddCategory(false)} className="text-sm text-[#666] px-2">
                Cancel
              </button>
            </div>
          )}

          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {editingCategory?.id === cat.id ? (
                  <input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    onBlur={() => {
                      updateCategory(cat.id, { name: editingCategory.name });
                      setEditingCategory(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateCategory(cat.id, { name: editingCategory.name });
                        setEditingCategory(null);
                      }
                    }}
                    className="bg-transparent border-b border-white/30 text-sm text-white focus:outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm">{cat.name}</span>
                )}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => updateCategory(cat.id, { active: !cat.active })}
                    className={`w-8 h-5 rounded-full transition-colors ${
                      cat.active ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                        cat.active ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="text-[#666] hover:text-white text-xs"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-[#666] hover:text-red-400 text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-[#444] text-sm text-center py-4">No categories yet</p>
            )}
          </div>
        </div>

        {/* RIGHT: Items */}
        <div className="lg:col-span-2 bg-[#1A1A1A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Items {selectedCategory && `(${items.length})`}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => {
                  resetItemForm();
                  setShowAddItem(true);
                }}
                className="text-sm bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Add/Edit Item Form */}
          {showAddItem && (
            <div className="bg-[#111111] rounded-xl p-6 mb-6 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-4">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#666] mb-1">Name</label>
                  <input
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#666] mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-[#666] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-white/10 file:text-white/60"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.featured}
                      onChange={(e) => setItemForm({ ...itemForm, featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-white/60">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.active}
                      onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-white/60">Active</span>
                  </label>
                </div>
                {/* Customization Groups */}
                {customizationGroups.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#666] mb-2">Customization Groups</label>
                    <div className="flex flex-wrap gap-2">
                      {customizationGroups.map((g) => (
                        <label key={g.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={itemCustomizations.includes(g.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setItemCustomizations([...itemCustomizations, g.id]);
                              } else {
                                setItemCustomizations(itemCustomizations.filter((id) => id !== g.id));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-xs text-white/60">{g.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveItem}
                  className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={resetItemForm}
                  className="text-sm text-[#666] px-4 py-2 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items Grid */}
          {!selectedCategory ? (
            <p className="text-[#444] text-sm text-center py-8">Select a category</p>
          ) : items.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-8">No items in this category</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#111111] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                  onClick={() => openEditItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          '☕'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-sm text-white/60">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleItemFeatured(item)}
                        className={`text-sm ${item.featured ? 'text-yellow-400' : 'text-[#444]'}`}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => toggleItemActive(item)}
                        className={`w-8 h-5 rounded-full transition-colors ${
                          item.active ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                            item.active ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
