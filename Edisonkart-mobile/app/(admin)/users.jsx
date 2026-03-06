import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/authStore';
import { getUsers, createDeliveryBoy, createEmployee, createVendor } from '../../src/services/admin';

const ROLE_FILTERS = ['All', 'USER', 'ADMIN', 'EMPLOYEE', 'DELIVERY', 'VENDOR'];

const ROLE_COLORS = {
  ADMIN: { bg: '#fce7f3', text: '#be185d' },
  EMPLOYEE: { bg: '#dbeafe', text: '#1d4ed8' },
  DELIVERY: { bg: '#e0e7ff', text: '#4338ca' },
  VENDOR: { bg: '#fef3c7', text: '#b45309' },
  USER: { bg: '#f1f5f9', text: '#64748b' },
};

const CREATE_ROLES = ['DELIVERY', 'EMPLOYEE', 'VENDOR'];

export default function AdminUsers() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('DELIVERY');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role !== 'ADMIN') {
      router.replace('/(admin)');
    }
  }, [role]);

  const fetchUsers = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      const params = { page: pageNum, limit: 20 };
      if (search) params.search = search;
      if (roleFilter !== 'All') params.role = roleFilter;

      const res = await getUsers(params);
      const data = res.data || res;
      const list = data.users || data || [];
      const total = data.totalPages || 1;

      if (append) {
        setUsers((prev) => [...prev, ...list]);
      } else {
        setUsers(list);
      }
      setHasMore(pageNum < total);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (role === 'ADMIN') fetchUsers(1);
  }, [roleFilter]);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers(1);
  }, [search, roleFilter]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchUsers(page + 1, true);
  };

  const handleCreateStaff = async () => {
    const name = formName.trim();
    const email = formEmail.trim();
    const password = formPassword.trim();
    if (!name || !email || !password) {
      return Alert.alert('Validation', 'All fields are required');
    }
    if (password.length < 6) {
      return Alert.alert('Validation', 'Password must be at least 6 characters');
    }

    setSubmitting(true);
    try {
      const userData = { name, email, password };
      if (formRole === 'DELIVERY') await createDeliveryBoy(userData);
      else if (formRole === 'EMPLOYEE') await createEmployee(userData);
      else if (formRole === 'VENDOR') await createVendor(userData);

      Alert.alert('Success', `${formRole} account created`);
      setModalVisible(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      fetchUsers(1);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleStyle = (r) => ROLE_COLORS[r] || ROLE_COLORS.USER;

  const renderUser = ({ item }) => {
    const rc = getRoleStyle(item.role);
    return (
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {(item.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
              <Text style={[styles.roleBadgeText, { color: rc.text }]}>{item.role}</Text>
            </View>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (role !== 'ADMIN') return null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.createStaffBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.createStaffText}>+ Staff</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          data={ROLE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterPill, roleFilter === item && styles.filterPillActive]}
              onPress={() => setRoleFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, roleFilter === item && styles.filterTextActive]}>
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
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#F97316" /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Create Staff Account</Text>
              <Text style={styles.modalSubtitle}>Add a new team member</Text>

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {CREATE_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleSelectorBtn, formRole === r && styles.roleSelectorActive]}
                    onPress={() => setFormRole(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.roleSelectorText, formRole === r && styles.roleSelectorTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Name</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Full name"
                  placeholderTextColor="#94a3b8"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Email address"
                  placeholderTextColor="#94a3b8"
                  value={formEmail}
                  onChangeText={setFormEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#94a3b8"
                  value={formPassword}
                  onChangeText={setFormPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleCreateStaff}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create {formRole}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
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
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
  },
  createStaffBtn: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
  },
  createStaffText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  filterRow: {
    paddingVertical: 8,
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
    paddingTop: 4,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  roleSelectorActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  roleSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  roleSelectorTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
});
