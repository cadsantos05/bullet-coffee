import React, { useState, useEffect } from 'react';
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
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';
import { ORDER_STATUS_LABELS } from '../../src/lib/constants';
import type { Order, OrderItem, StoreInfo, OrderStatus } from '../../src/types';

const STATUS_STEPS: OrderStatus[] = ['received', 'preparing', 'ready', 'picked_up'];

const STATUS_COLORS: Record<string, string> = {
  received: colors.statusReceived,
  preparing: colors.statusPreparing,
  ready: colors.statusReady,
  picked_up: colors.statusPickedUp,
  cancelled: colors.statusCancelled,
};

export default function OrderTrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    fetchStore();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrder() {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (orderError) throw orderError;
      setOrder(orderData as Order);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;
      setOrderItems((itemsData as OrderItem[]) || []);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStore() {
    try {
      const { data, error } = await supabase.from('store_info').select('*').single();
      if (error) throw error;
      setStoreInfo(data as StoreInfo);
    } catch (err) {
      console.error('Error fetching store:', err);
    }
  }

  if (loading || !order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.black} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.orderNumber}>
          Order #{order.id.substring(0, 8).toUpperCase()}
        </Text>

        {isCancelled ? (
          <View style={[styles.statusCard, { backgroundColor: colors.error + '10' }]}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
            <Text style={[styles.statusCardText, { color: colors.error }]}>
              Order Cancelled
            </Text>
          </View>
        ) : (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              {STATUS_STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrentStep = index === currentStepIndex;
                return (
                  <React.Fragment key={step}>
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          isActive && styles.stepDotActive,
                          isCurrentStep && styles.stepDotCurrent,
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                        ]}
                      >
                        {ORDER_STATUS_LABELS[step]}
                      </Text>
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          index < currentStepIndex && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            {order.pickup_time && (
              <Text style={styles.estimatedTime}>
                Estimated ready: {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {orderItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemLeft}>
                <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                <View>
                  <Text style={styles.orderItemName}>{item.menu_item_name}</Text>
                  {item.customizations && item.customizations.length > 0 && (
                    <Text style={styles.orderItemCustom}>
                      {item.customizations.map((c) => c.option).join(', ')}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.orderItemPrice}>${item.item_total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>${order.tax.toFixed(2)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: colors.success }]}>
                -${order.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

        {storeInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.storeCard}>
              <Text style={styles.storeName}>{storeInfo.name}</Text>
              <Text style={styles.storeDetail}>{storeInfo.address}</Text>
              <Text style={styles.storeDetail}>{storeInfo.phone}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 20,
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusCardText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 70,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.border,
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: colors.black,
  },
  stepDotCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.black,
    backgroundColor: colors.white,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  stepLineActive: {
    backgroundColor: colors.black,
  },
  estimatedTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderItemLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  orderItemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    minWidth: 24,
  },
  orderItemName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  orderItemCustom: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  totals: {
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    color: colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  storeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  storeDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
});
