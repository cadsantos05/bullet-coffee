import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/context/AuthContext';
import { useQuery } from '../../src/hooks/useSupabase';
import { colors } from '../../src/theme/colors';
import { ORDER_STATUS_LABELS } from '../../src/lib/constants';
import type { Order, OrderStatus } from '../../src/types';

const STATUS_COLORS: Record<string, string> = {
  pending_payment: colors.info,
  received: colors.statusReceived,
  preparing: colors.statusPreparing,
  ready: colors.statusReady,
  picked_up: colors.statusPickedUp,
  cancelled: colors.statusCancelled,
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const {
    data: orders,
    loading,
    refetch,
  } = useQuery<Order>('orders', {
    filter: { column: 'user_id', value: user?.id },
    orderBy: 'created_at',
    ascending: false,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const activeOrders = orders.filter((o) =>
    ['received', 'preparing', 'ready', 'pending_payment'].includes(o.status)
  );
  const pastOrders = orders.filter((o) =>
    ['picked_up', 'cancelled'].includes(o.status)
  );

  function renderOrderCard(order: Order) {
    const statusColor = STATUS_COLORS[order.status] || colors.textMuted;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${order.id}`)}
      >
        <View style={styles.orderTop}>
          <Text style={styles.orderNumber}>#{order.id.substring(0, 8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </Text>
          </View>
        </View>
        <View style={styles.orderBottom}>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Header showCart={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.black} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header showCart={false} />
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active</Text>
                {activeOrders.map((order) => (
                  <React.Fragment key={order.id}>{renderOrderCard(order)}</React.Fragment>
                ))}
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Orders</Text>
              {pastOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No past orders yet</Text>
                </View>
              ) : (
                pastOrders.map((order) => (
                  <React.Fragment key={order.id}>{renderOrderCard(order)}</React.Fragment>
                ))
              )}
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
