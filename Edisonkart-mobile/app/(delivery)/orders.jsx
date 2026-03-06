import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getAssignedOrders, updateDeliveryStatus } from '../../src/services/delivery';

const FILTERS = ['All', 'assigned', 'picked_up', 'in_transit'];
const FILTER_LABELS = { All: 'All', assigned: 'Assigned', picked_up: 'Picked Up', in_transit: 'In Transit' };

const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
};
const STATUS_ACTION = {
  assigned: 'Pick Up',
  picked_up: 'Start Transit',
  in_transit: 'Mark Delivered',
};
const STATUS_COLORS = {
  assigned: { bg: '#dbeafe', text: '#1d4ed8' },
  picked_up: { bg: '#fef3c7', text: '#b45309' },
  in_transit: { bg: '#ede9fe', text: '#6d28d9' },
  delivered: { bg: '#dcfce7', text: '#16a34a' },
};

export default function AssignedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(() => {
    const status = filter === 'All' ? undefined : filter;
    return getAssignedOrders(status)
      .then((res) => {
        const data = res?.data ?? res?.orders ?? res ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => setOrders([]));
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().finally(() => setRefreshing(false));
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, currentStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    setUpdating(orderId);
    try {
      await updateDeliveryStatus(orderId, next);
      await fetchOrders();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusStyle = (status) => STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#64748b' };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No orders found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = item.deliveryStatus ?? item.status ?? 'assigned';
          const sc = getStatusStyle(status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.orderNumber || item._id?.slice(-8)}</Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>{status.replace('_', ' ')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.address} numberOfLines={2}>
                  {item.shippingAddress?.street || item.shippingAddress?.city || 'No address'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📦</Text>
                <Text style={styles.items}>
                  {item.items?.length ?? item.orderItems?.length ?? 0} item(s)
                </Text>
              </View>

              {NEXT_STATUS[status] && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleStatusUpdate(item._id, status)}
                  disabled={updating === item._id}
                  activeOpacity={0.8}
                >
                  {updating === item._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>{STATUS_ACTION[status]}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
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
  filterContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  pillText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  address: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  items: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  actionBtn: {
    marginTop: 14,
    backgroundColor: '#F97316',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
