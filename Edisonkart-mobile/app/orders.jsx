import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { getUserOrders } from '../src/services/order';

const STATUS_FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Shipped: '#8b5cf6',
  Delivered: '#16a34a',
  Cancelled: '#dc2626',
};

export default function OrdersScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = (pageNum, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    getUserOrders(pageNum)
      .then((res) => {
        const data = res?.orders ?? res?.data ?? res ?? [];
        const list = Array.isArray(data) ? data : [];
        setOrders((prev) => (append ? [...prev, ...list] : list));
        setHasMore(list.length >= 10);
        setPage(pageNum);
      })
      .catch(() => {
        if (!append) setOrders([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    fetchOrders(1);
  }, [isAuthenticated]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    fetchOrders(page + 1, true);
  }, [page, loadingMore, hasMore, loading]);

  const filteredOrders =
    statusFilter === 'All'
      ? orders
      : orders.filter(
          (o) => (o.status || 'Pending').toLowerCase() === statusFilter.toLowerCase()
        );

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setStatusFilter(status)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          loadingMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} activeOpacity={0.7}>
              <ActivityIndicator color="#F97316" size="small" />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </TouchableOpacity>
          ) : hasMore && filteredOrders.length >= 10 ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.7}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {statusFilter === 'All' ? 'No orders yet' : `No ${statusFilter.toLowerCase()} orders`}
            </Text>
            <Text style={styles.emptyText}>
              {statusFilter === 'All'
                ? 'Your orders will appear here once you place one.'
                : 'Try a different filter to see your orders.'}
            </Text>
            {statusFilter === 'All' && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/shop')}
                style={styles.shopBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.shopBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const status = item.status || 'Pending';
          const color = STATUS_COLORS[status] || '#64748b';
          const itemCount = (item.items ?? item.orderItems ?? []).length;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/order/${item.orderId || item._id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.orderId}>
                    #{item.orderId || item.orderNumber || item._id?.slice(-8)}
                  </Text>
                  <Text style={styles.orderDate}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={[styles.statusText, { color }]}>{status}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardBottom}>
                <View style={styles.cardBottomLeft}>
                  <Text style={styles.orderTotal}>
                    ₹{Math.round(item.totalAmount ?? item.total ?? 0).toLocaleString('en-IN')}
                  </Text>
                  {itemCount > 0 && (
                    <Text style={styles.itemCount}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  filterRow: { flexGrow: 0, backgroundColor: '#ffffff' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 4,
  },
  filterPillActive: { backgroundColor: '#F97316' },
  filterPillText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  filterPillTextActive: { color: '#ffffff' },

  listContent: { paddingTop: 8, paddingBottom: 24 },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, marginRight: 12 },
  orderId: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#94a3b8' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderTotal: { fontSize: 17, fontWeight: '700', color: '#F97316' },
  itemCount: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  chevron: { fontSize: 24, color: '#cbd5e1', fontWeight: '300' },

  loadMoreBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: '#F97316' },

  empty: { padding: 48, alignItems: 'center', marginTop: 32 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: {
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  shopBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  shopBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
