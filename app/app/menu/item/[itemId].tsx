import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../src/lib/supabase';
import { useCart } from '../../../src/context/CartContext';
import { colors } from '../../../src/theme/colors';
import type { MenuItem, CustomizationGroup, CustomizationOption } from '../../../src/types';

interface GroupWithOptions extends CustomizationGroup {
  options: CustomizationOption[];
}

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [groups, setGroups] = useState<GroupWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  async function fetchItem() {
    try {
      const { data: menuItem, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single();
      if (itemError) throw itemError;
      setItem(menuItem as MenuItem);

      const { data: linkRows, error: linkError } = await supabase
        .from('item_customization_groups')
        .select('customization_group_id')
        .eq('menu_item_id', itemId);
      if (linkError) throw linkError;

      if (linkRows && linkRows.length > 0) {
        const groupIds = linkRows.map((r: any) => r.customization_group_id);
        const { data: groupData, error: groupError } = await supabase
          .from('customization_groups')
          .select('*')
          .in('id', groupIds)
          .order('sort_order', { ascending: true });
        if (groupError) throw groupError;

        const { data: optionData, error: optError } = await supabase
          .from('customization_options')
          .select('*')
          .in('group_id', groupIds)
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (optError) throw optError;

        const enriched: GroupWithOptions[] = (groupData || []).map((g: any) => ({
          ...g,
          options: (optionData || []).filter((o: any) => o.group_id === g.id),
        }));
        setGroups(enriched);
      }
    } catch (err) {
      console.error('Error fetching item:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(groupId: string, optionId: string, type: 'single' | 'multi') {
    setSelections((prev) => {
      const current = prev[groupId] || [];
      if (type === 'single') {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  const customizations = useMemo(() => {
    const result: { group: string; option: string; price: number }[] = [];
    for (const group of groups) {
      const selected = selections[group.id] || [];
      for (const optId of selected) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          result.push({ group: group.name, option: opt.name, price: opt.price_modifier });
        }
      }
    }
    return result;
  }, [groups, selections]);

  const totalPrice = useMemo(() => {
    if (!item) return 0;
    const extrasCost = customizations.reduce((sum, c) => sum + c.price, 0);
    return item.price + extrasCost;
  }, [item, customizations]);

  function handleAddToCart() {
    if (!item) return;
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      quantity: 1,
      unitPrice: item.price,
      customizations,
      itemTotal: totalPrice,
    });
    router.back();
  }

  if (loading || !item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.black} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>☕</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
          <Text style={styles.basePrice}>${item.price.toFixed(2)}</Text>

          {groups.map((group) => (
            <View key={group.id} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.required && <Text style={styles.requiredBadge}>Required</Text>}
              </View>
              {group.options.map((option) => {
                const isSelected = (selections[group.id] || []).includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => toggleOption(group.id, option.id, group.type)}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          group.type === 'single' ? styles.radio : styles.checkbox,
                          isSelected && styles.selectorSelected,
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={
                              group.type === 'single'
                                ? styles.radioInner
                                : styles.checkInner
                            }
                          />
                        )}
                      </View>
                      <Text style={styles.optionName}>{option.name}</Text>
                    </View>
                    {option.price_modifier > 0 && (
                      <Text style={styles.optionPrice}>
                        +${option.price_modifier.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  imagePlaceholder: {
    height: 250,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  content: {
    padding: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  basePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  requiredBadge: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.card,
  },
  optionRowSelected: {
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorSelected: {
    borderColor: colors.black,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.black,
  },
  checkInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.black,
  },
  optionName: {
    fontSize: 15,
    color: colors.text,
  },
  optionPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  addToCartBtn: {
    backgroundColor: colors.black,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
