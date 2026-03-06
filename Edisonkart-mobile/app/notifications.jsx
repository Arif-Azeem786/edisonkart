import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../src/services/notification';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const typeIcon = (type) => {
  if (/order/.test(type)) return '📦';
  if (/price|flash|promo/.test(type)) return '🏷️';
  if (/refund/.test(type)) return '💳';
  if (/welcome/.test(type)) return '🎉';
  return '🔔';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback((pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    getNotifications({ page: pageNum, limit: 20 })
      .then((res) => {
        const data = res?.notifications ?? res?.data ?? res ?? [];
        const list = Array.isArray(data) ? data : [];
        setNotifications((prev) => (append ? [...prev, ...list] : list));
        const totalPages = res?.totalPages ?? (Math.ceil((res?.total ?? 0) / 20) || 1);
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      })
      .catch(() => {
        if (!append) setNotifications([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    fetchNotifications(page + 1, true);
  }, [page, loadingMore, hasMore, loading, fetchNotifications]);

  const handleMarkAllRead = useCallback(() => {
    setMarkingAllRead(true);
    markAllAsRead()
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
      })
      .finally(() => setMarkingAllRead(false));
  }, []);

  const handleNotificationPress = useCallback(
    (item) => {
      if (!item.read) {
        markAsRead(item._id).then(() => {
          setNotifications((prev) =>
            prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
          );
        });
      }
      if (item.link) {
        router.push(item.link);
      }
    },
    [router]
  );

  const handleDelete = useCallback((item, e) => {
    e?.stopPropagation?.();
    Alert.alert(
      'Delete notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNotification(item._id).then(() => {
              setNotifications((prev) => prev.filter((n) => n._id !== item._id));
            });
          },
        },
      ]
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    fetchNotifications(1);
  }, [isAuthenticated, fetchNotifications]);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={markingAllRead}
            activeOpacity={0.7}
          >
            {markingAllRead ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F97316']}
            tintColor="#F97316"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>🔔</Text>
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When you get order updates, promos, or other alerts, they'll show up here.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreBtn}>
              <ActivityIndicator color="#F97316" size="small" />
              <Text style={styles.loadMoreText}>Loading more...</Text>
            </View>
          ) : hasMore && notifications.length >= 20 ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.7}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.read ? styles.cardRead : styles.cardUnread]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{typeIcon(item.type)}</Text>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message || ''}
                  </Text>
                  <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={(e) => handleDelete(item, e)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  header: {
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  markAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  listContent: { paddingTop: 12, paddingBottom: 24, paddingHorizontal: 16 },

  card: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardUnread: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardRead: {
    backgroundColor: '#f1f5f9',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },

  loadMoreBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
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
});
