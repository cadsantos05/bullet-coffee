import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme/colors';
import { useCart } from '../context/CartContext';
import { STORE_NAME } from '../lib/constants';

type HeaderProps = {
  showBack?: boolean;
  showCart?: boolean;
};

export default function Header({ showBack = false, showCart = true }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.leftSide}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.storeName}>{STORE_NAME}</Text>
      </View>

      <View style={styles.rightSide}>
        {showCart && (
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconBtn}>
            <Feather name="shopping-bag" size={22} color={colors.text} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.iconBtn}>
          <Feather name="user" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginRight: 4,
    justifyContent: 'center',
    height: 32,
  },
  storeName: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    justifyContent: 'center',
    height: 32,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.black,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
});
