import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getAssignedOrders } from '../../src/services/delivery';

export default function CompletedDeliveries() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(() => {
    return getAssignedOrders('delivered')
      .then((res) => {
        const data = res?.data ?? res?.orders ?? res ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No completed deliveries yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>#{item.orderNumber || item._id?.slice(-8)}</Text>
                <Text style={styles.date}>
                  {item.deliveredAt || item.updatedAt
                    ? new Date(item.deliveredAt || item.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </Text>
              </View>
              <View style={styles.deliveredBadge}>
                <Text style={styles.deliveredBadgeText}>Delivered</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottom}>
              <View style={styles.customerRow}>
                <Text style={styles.customerIcon}>👤</Text>
                <Text style={styles.customer}>
                  {item.shippingAddress?.name || item.user?.name || 'Customer'}
                </Text>
              </View>
              <Text style={styles.total}>₹{item.totalAmount ?? item.total ?? 0}</Text>
            </View>
          </View>
        )}
      />
    </View>
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
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  date: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },
  deliveredBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deliveredBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customerIcon: {
    fontSize: 14,
  },
  customer: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  total: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F97316',
  },
});
