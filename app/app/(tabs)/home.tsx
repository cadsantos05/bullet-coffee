import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/context/AuthContext';
import { useQuery, useSingle } from '../../src/hooks/useSupabase';
import { useCart } from '../../src/context/CartContext';
import { colors, fonts } from '../../src/theme/colors';
import type { MenuItem, StoreInfo } from '../../src/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const { data: featured } = useQuery<MenuItem>('menu_items', {
    filter: { column: 'featured', value: true },
  });
  const { data: storeInfo } = useSingle<StoreInfo>('store_info');
  const { addItem } = useCart();

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

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

  return (
    <View style={styles.container}>
      <Header showCart />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingSub}>
            {getGreeting()},
          </Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>

        {/* Store Status Card */}
        {storeInfo && (
          <TouchableOpacity
            style={styles.storeCard}
            onPress={() => router.push('/store-info')}
            activeOpacity={0.7}
          >
            <View style={styles.storeLeft}>
              <View style={styles.storeIconWrap}>
                <Feather name="map-pin" size={16} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>Bullet Coffee</Text>
                <Text style={styles.storeAddress} numberOfLines={1}>{storeInfo.address}</Text>
              </View>
            </View>
            <View style={styles.storeStatusBadge}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.storeStatusText}>Open</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Order Now Banner */}
        <TouchableOpacity
          style={styles.orderBanner}
          onPress={() => router.push('/(tabs)/menu')}
          activeOpacity={0.8}
        >
          <View>
            <Text style={styles.bannerTitle}>Order ahead</Text>
            <Text style={styles.bannerSub}>Skip the line, pick up fast</Text>
          </View>
          <View style={styles.bannerArrow}>
            <Feather name="arrow-right" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Featured */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.featuredList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => router.push(`/menu/item/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.featuredImage}>
                  <Text style={{ fontSize: 36, opacity: 0.15 }}>&#9749;</Text>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={1}>{item.description}</Text>
                  <View style={styles.featuredBottom}>
                    <Text style={styles.featuredPrice}>${item.price.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleQuickAdd(item)}
                    >
                      <Feather name="plus" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Quick Reorder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.emptyCard}>
            <Feather name="clock" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>Your recent orders will appear here</Text>
          </View>
        </View>

        {/* Rewards Card */}
        {profile && (
          <TouchableOpacity
            style={styles.rewardsCard}
            onPress={() => router.push('/(tabs)/rewards')}
            activeOpacity={0.8}
          >
            <View style={styles.rewardsLeft}>
              <View style={styles.rewardsIconWrap}>
                <Feather name="star" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.rewardsLabel}>Reward Points</Text>
                <Text style={styles.rewardsPoints}>{profile.total_points ?? 0} pts</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scroll: {
    flex: 1,
  },

  // Greeting
  greetingSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  greetingSub: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  greetingName: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },

  // Store Card
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  storeAddress: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  storeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  storeStatusText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.success,
  },

  // Order Banner
  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#999',
    marginTop: 3,
  },
  bannerArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  // Featured
  featuredList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredImage: {
    height: CARD_WIDTH * 0.65,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  featuredDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  featuredBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  featuredPrice: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },

  // Rewards
  rewardsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rewardsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  rewardsPoints: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
});
