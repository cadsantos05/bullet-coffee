import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/context/AuthContext';
import { useQuery } from '../../src/hooks/useSupabase';
import { colors } from '../../src/theme/colors';
import type { RewardTier, Reward, RewardPointsLedger } from '../../src/types';

export default function RewardsScreen() {
  const { profile, user } = useAuth();
  const { data: tiers } = useQuery<RewardTier>('reward_tiers', {
    orderBy: 'min_points',
    ascending: true,
  });
  const { data: rewards } = useQuery<Reward>('rewards', {
    filter: { column: 'active', value: true },
  });
  const { data: ledger, loading: ledgerLoading } = useQuery<RewardPointsLedger>(
    'reward_points_ledger',
    {
      filter: { column: 'user_id', value: user?.id },
      orderBy: 'created_at',
      ascending: false,
    }
  );

  const currentPoints = profile?.reward_points ?? 0;
  const currentTier = tiers.find((t) => t.id === profile?.reward_tier_id);
  const nextTier = tiers.find((t) => t.min_points > currentPoints);
  const progress = nextTier
    ? Math.min(currentPoints / nextTier.min_points, 1)
    : 1;

  function handleRedeem(reward: Reward) {
    if (currentPoints < reward.points_cost) {
      Alert.alert('Not enough points', `You need ${reward.points_cost - currentPoints} more points.`);
      return;
    }
    Alert.alert('Redeem Reward', `Redeem ${reward.name} for ${reward.points_cost} points?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Redeem', onPress: () => Alert.alert('Coming Soon', 'Redemption will be available soon.') },
    ]);
  }

  return (
    <View style={styles.container}>
      <Header showCart={false} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{currentPoints}</Text>
          {currentTier && (
            <View style={styles.tierBadge}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.tierName}>{currentTier.name}</Text>
            </View>
          )}
        </View>

        {nextTier && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {nextTier.min_points - currentPoints} points to {nextTier.name}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          {rewards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No rewards available</Text>
            </View>
          ) : (
            rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  {reward.description && (
                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                  )}
                  <Text style={styles.rewardCost}>{reward.points_cost} points</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.redeemBtn,
                    currentPoints < reward.points_cost && styles.redeemBtnDisabled,
                  ]}
                  onPress={() => handleRedeem(reward)}
                >
                  <Text
                    style={[
                      styles.redeemBtnText,
                      currentPoints < reward.points_cost && styles.redeemBtnTextDisabled,
                    ]}
                  >
                    Redeem
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points History</Text>
          {ledger.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No points activity yet</Text>
            </View>
          ) : (
            ledger.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyReason}>{entry.reason}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyPoints,
                    { color: entry.points >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {entry.points >= 0 ? '+' : ''}
                  {entry.points}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pointsCard: {
    backgroundColor: colors.black,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  pointsLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  pointsValue: {
    color: colors.white,
    fontSize: 48,
    fontWeight: '900',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierName: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.black,
    borderRadius: 4,
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
  rewardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  rewardInfo: {
    flex: 1,
    marginRight: 12,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rewardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rewardCost: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  redeemBtn: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemBtnDisabled: {
    backgroundColor: colors.border,
  },
  redeemBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  redeemBtnTextDisabled: {
    color: colors.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyReason: {
    fontSize: 14,
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
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
