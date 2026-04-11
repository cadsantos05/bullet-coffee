import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../src/components/Header';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [notifOrders, setNotifOrders] = useState(profile?.notification_orders ?? true);
  const [notifPromos, setNotifPromos] = useState(profile?.notification_promos ?? true);

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  async function saveName() {
    try {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user?.id);
      setEditingName(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update name.');
    }
  }

  async function savePhone() {
    try {
      await supabase.from('profiles').update({ phone }).eq('id', user?.id);
      setEditingPhone(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update phone.');
    }
  }

  async function toggleNotifOrders(val: boolean) {
    setNotifOrders(val);
    await supabase.from('profiles').update({ notification_orders: val }).eq('id', user?.id);
  }

  async function toggleNotifPromos(val: boolean) {
    setNotifPromos(val);
    await supabase.from('profiles').update({ notification_promos: val }).eq('id', user?.id);
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Header showBack showCart={false} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Info</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
                <TouchableOpacity onPress={saveName}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editRow}
                onPress={() => setEditingName(true)}
              >
                <Text style={styles.fieldValue}>{profile?.full_name}</Text>
                <Ionicons name="pencil" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            {editingPhone ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                  keyboardType="phone-pad"
                />
                <TouchableOpacity onPress={savePhone}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editRow}
                onPress={() => setEditingPhone(true)}
              >
                <Text style={styles.fieldValue}>{profile?.phone || 'Add phone'}</Text>
                <Ionicons name="pencil" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.text} />
            <Text style={styles.linkText}>Order History</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/store-info')}
          >
            <Ionicons name="storefront-outline" size={20} color={colors.text} />
            <Text style={styles.linkText}>Store Info</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Order Updates</Text>
            <Switch
              value={notifOrders}
              onValueChange={toggleNotifOrders}
              trackColor={{ false: colors.border, true: colors.black }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Promotions</Text>
            <Switch
              value={notifPromos}
              onValueChange={toggleNotifPromos}
              trackColor={{ false: colors.border, true: colors.black }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

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
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    paddingVertical: 4,
    marginRight: 12,
  },
  saveText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.text,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '700',
  },
});
