import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getAdminOrders, updateOrderStatus } from '../../src/services/order';

const STATUSES = ['All', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#b45309' },
  PROCESSING: { bg: '#dbeafe', text: '#1d4ed8' },
  SHIPPED: { bg: '#e0e7ff', text: '#4338ca' },
  DELIVERED: { bg: '#dcfce7', text: '#16a34a' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  RETURNED: { bg: '#fce7f3', text: '#be185d' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await getAdminOrders(params);
      const data = res.data || res;
      const list = data.orders || data || [];
      const total = data.totalPages || 1;

      if (append) {
        setOrders((prev) => [...prev, ...list]);
      } else {
        setOrders(list);
      }
      setHasMore(pageNum < total);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1);
  }, [search, statusFilter]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchOrders(page + 1, true);
  };

  const handleStatusUpdate = (order, newStatus) => {
    Alert.alert('Update Status', `Change order status to ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: async () => {
          try {
            await updateOrderStatus(order._id, { status: newStatus });
            setOrders((prev) =>
              prev.map((o) => (o._id === order._id ? { ...o, status: newStatus } : o))
            );
            Alert.alert('Success', 'Order status updated');
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to update status');
          }
        },
      },
    ]);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusStyle = (status) => STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#64748b' };

  const nextStatuses = (current) => {
    const flow = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };
    return flow[current] || [];
  };

  const renderOrder = ({ item }) => {
    const isExpanded = expandedId === item._id;
    const sc = getStatusStyle(item.status);
    const customer = item.user || {};

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => setExpandedId(isExpanded ? null : item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>#{item.orderNumber || item._id?.slice(-8)}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderBody}>
          <View style={styles.customerRow}>
            <Text style={styles.customerIcon}>👤</Text>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name || 'N/A'}</Text>
              <Text style={styles.customerEmail}>{customer.email || ''}</Text>
            </View>
          </View>
          <Text style={styles.orderTotal}>₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <Text style={styles.itemsTitle}>Items ({item.items?.length || 0})</Text>
            {(item.items || []).map((oi, idx) => (
              <View key={idx} style={styles.orderItem}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {oi.product?.name || oi.name || 'Product'}
                </Text>
                <Text style={styles.orderItemQty}>
                  x{oi.quantity} — ₹{Number(oi.price || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}

            {nextStatuses(item.status).length > 0 && (
              <View style={styles.statusActions}>
                <Text style={styles.updateLabel}>Update status:</Text>
                <View style={styles.statusBtns}>
                  {nextStatuses(item.status).map((s) => {
                    const btnSc = getStatusStyle(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusActionBtn, { backgroundColor: btnSc.bg }]}
                        onPress={() => handleStatusUpdate(item, s)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.statusActionText, { color: btnSc.text }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order # or customer..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          data={STATUSES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterPill, statusFilter === item && styles.filterPillActive]}
              onPress={() => setStatusFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, statusFilter === item && styles.filterTextActive]}>
                {item === 'All' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#F97316" /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
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
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  filterRow: {
    paddingBottom: 4,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  customerIcon: {
    fontSize: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  customerEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F97316',
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 4,
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    paddingLeft: 8,
  },
  orderItemQty: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '600',
    paddingRight: 8,
  },
  statusActions: {
    marginTop: 14,
  },
  updateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
  },
  statusBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerLoader: {
    paddingVertical: 20,
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
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
