import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Header from '../../src/components/Header';
import { useQuery } from '../../src/hooks/useSupabase';
import { useCart } from '../../src/context/CartContext';
import { colors, fonts } from '../../src/theme/colors';
import type { Category, MenuItem } from '../../src/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 24 * 2 - 12) / 2;

export default function MenuScreen() {
  const { data: categories, loading: catLoading } = useQuery<Category>('categories', {
    orderBy: 'sort_order',
    ascending: true,
    filter: { column: 'active', value: true },
  });
  const { data: menuItems, loading: itemsLoading } = useQuery<MenuItem>('menu_items', {
    filter: { column: 'active', value: true },
  });
  const { addItem } = useCart();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const activeCategoryId = selectedCategoryId || (categories.length > 0 ? categories[0].id : null);
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category_id === activeCategoryId),
    [menuItems, activeCategoryId]
  );

  function handleQuickAdd(item: MenuItem) {
    addItem({
      menuItemId: item.id,
      menuItemName: item.name,
      quantity: 1,
      unitPrice: item.price,
      customizations: [],
      itemTotal: item.price,
    });
  }

  if (catLoading || itemsLoading) {
    return (
      <View style={styles.container}>
        <Header showCart />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showCart />

      {/* Category Pills */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            const count = menuItems.filter((i) => i.category_id === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
                <Text style={[styles.categoryCount, isActive && styles.categoryCountActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Title */}
      {activeCategory && (
        <View style={styles.categoryTitleWrap}>
          <Text style={styles.categoryTitle}>{activeCategory.name}</Text>
          <Text style={styles.categoryItemCount}>{filteredItems.length} items</Text>
        </View>
      )}

      {/* Items Grid */}
      <FlatList
        data={filteredItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push(`/menu/item/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.itemImage}>
              <Text style={{ fontSize: 28, opacity: 0.12 }}>&#9749;</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              <View style={styles.itemBottom}>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleQuickAdd(item)}
                >
                  <Feather name="plus" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="coffee" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No items in this category</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categorySection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryList: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  categoryPillActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.1,
  },
  categoryTextActive: {
    color: '#fff',
  },
  categoryCount: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryCountActive: {
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Category Title
  categoryTitleWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
  },
  categoryTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  categoryItemCount: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  // Grid
  grid: {
    padding: 24,
    paddingTop: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Item Card
  itemCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  itemImage: {
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.2,
    minHeight: 36,
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
});
