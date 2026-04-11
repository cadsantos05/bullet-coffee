import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { supabase } from '../src/lib/supabase';
import { colors, fonts } from '../src/theme/colors';

const TAX_RATE = 0.1;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  async function handlePlaceOrder() {
    if (!user) {
      Alert.alert('Error', 'Please sign in to place an order.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order in Supabase with pending_payment status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending_payment',
          subtotal,
          tax,
          total,
          discount: 0,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error(orderError?.message || 'Failed to create order');

      // 2. Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        menu_item_name: item.menuItemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        customizations: item.customizations,
        item_total: item.itemTotal,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      // 3. Create Stripe Checkout Session
      const stripeItems = items.map((item) => ({
        name: item.menuItemName,
        price: item.itemTotal / item.quantity,
        quantity: item.quantity,
        customizations: item.customizations.map((c) => c.option).join(', '),
      }));

      // Add tax as line item
      stripeItems.push({
        name: 'Tax',
        price: tax,
        quantity: 1,
        customizations: '',
      });

      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: stripeItems,
          orderId: order.id,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // 4. Open Stripe Checkout in browser
        clearCart();
        await Linking.openURL(data.url);
        // Navigate to order tracking
        router.replace(`/order/${order.id}`);
      } else {
        // Fallback: mark as received directly (for testing without Stripe)
        await supabase
          .from('orders')
          .update({ status: 'received', updated_at: new Date().toISOString() })
          .eq('id', order.id);
        clearCart();
        router.replace(`/order/${order.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            {items.map((item) => (
              <View key={item.id} style={styles.summaryItem}>
                <View style={styles.summaryLeft}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryName}>{item.menuItemName}</Text>
                    {item.customizations.length > 0 && (
                      <Text style={styles.summaryCustom}>
                        {item.customizations.map((c) => c.option).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.summaryPrice}>${item.itemTotal.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pickup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <View style={styles.card}>
            <View style={styles.pickupRow}>
              <View style={styles.pickupIconWrap}>
                <Feather name="clock" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.pickupLabel}>ASAP</Text>
                <Text style={styles.pickupTime}>~10 minutes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.pickupRow}>
              <View style={[styles.pickupIconWrap, { backgroundColor: '#F0F0FF' }]}>
                <Feather name="credit-card" size={18} color="#000" />
              </View>
              <View>
                <Text style={styles.pickupLabel}>Stripe Checkout</Text>
                <Text style={styles.pickupTime}>Card, Apple Pay, Google Pay</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={[styles.card, { marginHorizontal: 0, marginTop: 8 }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (10%)</Text>
            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || items.length === 0}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="lock" size={16} color="#fff" />
              <Text style={styles.placeOrderText}>Pay ${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  summaryLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  qtyBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  summaryName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  summaryCustom: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pickupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupLabel: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  pickupTime: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  grandLabel: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  grandValue: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  placeOrderBtn: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
