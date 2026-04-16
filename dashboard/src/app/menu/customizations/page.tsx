'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface CustomizationGroup {
  id: string;
  name: string;
  type: string;
  required: boolean;
  sort_order: number;
}

interface CustomizationOption {
  id: string;
  group_id: string;
  name: string;
  price_modifier: number;
  is_default: boolean;
}

export default function CustomizationsPage() {
  const [groups, setGroups] = useState<CustomizationGroup[]>([]);
  const [options, setOptions] = useState<Record<string, CustomizationOption[]>>({});
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', type: 'single_select' as string, required: false });
  const [editingGroup, setEditingGroup] = useState<CustomizationGroup | null>(null);
  const [showAddOption, setShowAddOption] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState({ name: '', price_modifier: '', is_default: false });
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    const { data } = await supabase
      .from('customization_groups')
      .select('*')
      .order('name');
    setGroups(data ?? []);
  }

  async function loadOptions(groupId: string) {
    const { data } = await supabase
      .from('customization_options')
      .select('*')
      .eq('group_id', groupId)
      .order('name');
    setOptions((prev) => ({ ...prev, [groupId]: data ?? [] }));
  }

  async function saveGroup() {
    if (!groupForm.name.trim()) return;
    if (editingGroup) {
      await supabase.from('customization_groups').update(groupForm).eq('id', editingGroup.id);
    } else {
      await supabase.from('customization_groups').insert(groupForm);
    }
    resetGroupForm();
    loadGroups();
  }

  async function deleteGroup(id: string) {
    if (!confirm('Delete this group and all its options?')) return;
    await supabase.from('customization_options').delete().eq('group_id', id);
    await supabase.from('customization_groups').delete().eq('id', id);
    loadGroups();
  }

  function editGroup(group: CustomizationGroup) {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      type: group.type,
      required: group.required,
    });
    setShowAddGroup(true);
  }

  function resetGroupForm() {
    setEditingGroup(null);
    setShowAddGroup(false);
    setGroupForm({ name: '', type: 'single_select', required: false });
  }

  async function saveOption(groupId: string) {
    if (!optionForm.name.trim()) return;
    const payload = {
      group_id: groupId,
      name: optionForm.name,
      price_modifier: parseFloat(optionForm.price_modifier) || 0,
      is_default: optionForm.is_default,
    };
    if (editingOption) {
      await supabase.from('customization_options').update(payload).eq('id', editingOption.id);
    } else {
      await supabase.from('customization_options').insert(payload);
    }
    resetOptionForm();
    loadOptions(groupId);
  }

  async function deleteOption(id: string, groupId: string) {
    await supabase.from('customization_options').delete().eq('id', id);
    loadOptions(groupId);
  }

  function editOption(option: CustomizationOption) {
    setEditingOption(option);
    setOptionForm({
      name: option.name,
      price_modifier: option.price_modifier.toString(),
      is_default: option.is_default,
    });
    setShowAddOption(option.group_id);
  }

  function resetOptionForm() {
    setEditingOption(null);
    setShowAddOption(null);
    setOptionForm({ name: '', price_modifier: '', is_default: false });
  }

  function toggleExpand(groupId: string) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      if (!options[groupId]) loadOptions(groupId);
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customizations</h1>
          <p className="text-[#666] text-sm mt-1">Manage customization groups and options</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/menu"
            className="text-sm text-white/60 hover:text-white border border-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            Back to Menu
          </a>
          <button
            onClick={() => {
              resetGroupForm();
              setShowAddGroup(true);
            }}
            className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            + Add Group
          </button>
        </div>
      </div>

      {/* Add/Edit Group Form */}
      {showAddGroup && (
        <div className="bg-[#1A1A1A] rounded-xl p-6 mb-6 border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingGroup ? 'Edit Group' : 'New Group'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#666] mb-1">Name</label>
              <input
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="e.g. Milk Type"
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">Type</label>
              <select
                value={groupForm.type}
                onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value })}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="single_select">Single Select</option>
                <option value="multi_select">Multi Select</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={groupForm.required}
                  onChange={(e) => setGroupForm({ ...groupForm, required: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-white/60">Required</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={saveGroup}
              className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {editingGroup ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetGroupForm}
              className="text-sm text-[#666] px-4 py-2 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-xl p-8 text-center">
            <p className="text-[#444] text-sm">No customization groups yet</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-[#1A1A1A] rounded-xl overflow-hidden">
              {/* Group Header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(group.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-sm">
                    {expandedGroup === group.id ? '▼' : '▶'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{group.name}</p>
                    <p className="text-xs text-[#666]">
                      {group.required ? 'Required' : 'Optional'} · {group.type === 'multi_select' ? 'Multi select' : 'Single select'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => editGroup(group)}
                    className="text-xs text-[#666] hover:text-white px-2 py-1"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="text-xs text-[#666] hover:text-red-400 px-2 py-1"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Options */}
              {expandedGroup === group.id && (
                <div className="border-t border-white/5 px-6 py-4">
                  <div className="space-y-2 mb-4">
                    {(options[group.id] ?? []).map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between bg-[#111111] rounded-lg px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white">{opt.name}</span>
                          {opt.price_modifier !== 0 && (
                            <span className="text-xs text-green-400">
                              +${opt.price_modifier.toFixed(2)}
                            </span>
                          )}
                          {opt.is_default && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => editOption(opt)}
                            className="text-xs text-[#666] hover:text-white px-2 py-1"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteOption(opt.id, group.id)}
                            className="text-xs text-[#666] hover:text-red-400 px-2 py-1"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {(options[group.id] ?? []).length === 0 && (
                      <p className="text-[#444] text-xs text-center py-2">No options yet</p>
                    )}
                  </div>

                  {/* Add/Edit Option Form */}
                  {showAddOption === group.id ? (
                    <div className="bg-[#111111] rounded-lg p-4 border border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          value={optionForm.name}
                          onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                          placeholder="Option name"
                          className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={optionForm.price_modifier}
                          onChange={(e) =>
                            setOptionForm({ ...optionForm, price_modifier: e.target.value })
                          }
                          placeholder="Price +/-"
                          className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={optionForm.is_default}
                            onChange={(e) =>
                              setOptionForm({ ...optionForm, is_default: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-xs text-white/60">Default</span>
                        </label>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => saveOption(group.id)}
                          className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-medium"
                        >
                          {editingOption ? 'Update' : 'Add'}
                        </button>
                        <button
                          onClick={resetOptionForm}
                          className="text-xs text-[#666] px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        resetOptionForm();
                        setShowAddOption(group.id);
                      }}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
