import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getContacts, updateContactStatus, deleteContact } from '../../src/services/contact';

const STATUS_FILTERS = ['All', 'PENDING', 'REVIEWED', 'RESOLVED'];

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#b45309' },
  REVIEWED: { bg: '#dbeafe', text: '#1d4ed8' },
  RESOLVED: { bg: '#dcfce7', text: '#16a34a' },
};

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchContacts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await getContacts(params);
      const data = res.data || res;
      const list = data.contacts || data || [];
      const total = data.totalPages || 1;

      if (append) {
        setContacts((prev) => [...prev, ...list]);
      } else {
        setContacts(list);
      }
      setHasMore(pageNum < total);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContacts(1);
  }, [search, statusFilter]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchContacts(page + 1, true);
  };

  const handleStatusUpdate = async (contact, newStatus) => {
    try {
      await updateContactStatus(contact._id, newStatus);
      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleDelete = (contact) => {
    Alert.alert('Delete Contact', `Delete message from "${contact.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(contact._id);
            setContacts((prev) => prev.filter((c) => c._id !== contact._id));
            Alert.alert('Success', 'Contact deleted');
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete contact');
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

  const renderContact = ({ item }) => {
    const isExpanded = expandedId === item._id;
    const sc = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.contactCard}
        onPress={() => setExpandedId(isExpanded ? null : item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.senderRow}>
              <View style={styles.senderAvatar}>
                <Text style={styles.senderInitial}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.senderInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactEmail}>{item.email}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardSubHeader}>
          <Text style={styles.contactSubject} numberOfLines={isExpanded ? 0 : 1}>
            {item.subject || 'No subject'}
          </Text>
          <Text style={styles.contactDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageLabel}>Message</Text>
              <Text style={styles.messageText}>{item.message || 'No message'}</Text>
            </View>

            <View style={styles.statusActions}>
              <Text style={styles.updateLabel}>Set status:</Text>
              <View style={styles.statusBtns}>
                {['PENDING', 'REVIEWED', 'RESOLVED'].map((s) => {
                  const btnSc = getStatusStyle(s);
                  const isCurrent = item.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusActionBtn,
                        { backgroundColor: btnSc.bg },
                        isCurrent && styles.statusActionBtnCurrent,
                      ]}
                      onPress={() => !isCurrent && handleStatusUpdate(item, s)}
                      activeOpacity={isCurrent ? 1 : 0.7}
                    >
                      <Text style={[styles.statusActionText, { color: btnSc.text }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
              <Text style={styles.deleteIcon}>🗑️</Text>
              <Text style={styles.deleteText}>Delete Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIconEmoji}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          data={STATUS_FILTERS}
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
                {item}
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
          data={contacts}
          keyExtractor={(item) => item._id}
          renderItem={renderContact}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#F97316" /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✉️</Text>
              <Text style={styles.emptyText}>No contact messages found</Text>
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
  searchIconEmoji: {
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
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  senderInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  contactEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
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
  cardSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 52,
  },
  contactSubject: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginRight: 10,
  },
  contactDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  messageBubble: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  statusActions: {
    marginTop: 18,
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
  statusActionBtnCurrent: {
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  statusActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deleteBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  deleteIcon: {
    fontSize: 14,
  },
  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
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
