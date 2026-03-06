import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getDeliveryStats } from '../../src/services/delivery';

const STAT_ICONS = ['📋', '📤', '✅', '💰'];
const STAT_COLORS = ['#2563eb', '#f59e0b', '#16a34a', '#F97316'];

export default function DeliveryDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDeliveryStats()
      .then((res) => setStats(res?.data ?? res))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const cards = [
    { label: 'Assigned', value: stats?.assigned ?? 0, color: STAT_COLORS[0], icon: STAT_ICONS[0] },
    { label: 'Picked Up', value: stats?.pickedUp ?? 0, color: STAT_COLORS[1], icon: STAT_ICONS[1] },
    { label: 'Delivered', value: stats?.delivered ?? 0, color: STAT_COLORS[2], icon: STAT_ICONS[2] },
    { label: 'Total Earnings', value: `₹${stats?.totalEarnings ?? 0}`, color: STAT_COLORS[3], icon: STAT_ICONS[3] },
  ];

  const menuItems = [
    { label: 'Assigned Orders', route: '/(delivery)/orders', icon: '📦' },
    { label: 'Completed Deliveries', route: '/(delivery)/completed', icon: '✅' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Overview</Text>
      <View style={styles.grid}>
        {cards.map((c, idx) => (
          <View key={c.label} style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: c.color }]} />
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>{c.icon}</Text>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Quick Actions</Text>
      <View style={styles.menuCard}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.6}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '46%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: '2%',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statAccent: {
    height: 4,
    width: '100%',
  },
  statContent: {
    padding: 16,
    alignItems: 'flex-start',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuArrow: {
    fontSize: 26,
    color: '#94a3b8',
    fontWeight: '300',
  },
});
