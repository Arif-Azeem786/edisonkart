import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../src/store/authStore';
import { getDashboardStats } from '../../src/services/admin';

const STAT_ICONS = ['💰', '📦', '👥', '🛍️'];
const STAT_COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#F97316'];

export default function AdminDashboard() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats();
      setStats(res.data || res);
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), color: STAT_COLORS[0], icon: STAT_ICONS[0] },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, color: STAT_COLORS[1], icon: STAT_ICONS[1] },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, color: STAT_COLORS[2], icon: STAT_ICONS[2] },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, color: STAT_COLORS[3], icon: STAT_ICONS[3] },
  ];

  const menuItems = [
    { label: 'Products', route: '/(admin)/products', icon: '📦', roles: ['ADMIN', 'EMPLOYEE', 'VENDOR'] },
    { label: 'Categories', route: '/(admin)/categories', icon: '📂', roles: ['ADMIN', 'EMPLOYEE'] },
    { label: 'Orders', route: '/(admin)/orders', icon: '🛒', roles: ['ADMIN', 'EMPLOYEE', 'VENDOR'] },
    { label: 'Users', route: '/(admin)/users', icon: '👥', roles: ['ADMIN'] },
    { label: 'Contact Messages', route: '/(admin)/contacts', icon: '✉️', roles: ['ADMIN', 'EMPLOYEE'] },
    { label: 'Banners', route: '/(admin)/banners', icon: '🖼️', roles: ['ADMIN', 'EMPLOYEE'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(role));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
    >
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingLabel}>Welcome back,</Text>
        <Text style={styles.greetingRole}>{role}</Text>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((card, idx) => (
          <View key={idx} style={styles.statCard}>
            <View style={[styles.statAccent, { backgroundColor: card.color }]} />
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.menuCard}>
        {visibleMenuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuItem, idx < visibleMenuItems.length - 1 && styles.menuItemBorder]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.6}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  greetingLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  greetingRole: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 16,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 14,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  chevron: {
    fontSize: 26,
    color: '#94a3b8',
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 40,
  },
});
