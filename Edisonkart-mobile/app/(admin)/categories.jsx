import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../src/services/category';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await getAdminCategories();
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return Alert.alert('Validation', 'Category name is required');
    setCreating(true);
    try {
      const res = await createCategory({ name });
      const created = res.data || res;
      setCategories((prev) => [created, ...prev]);
      setNewName('');
      Alert.alert('Success', 'Category created');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { isActive: !cat.isActive });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update category');
    }
  };

  const handleDelete = (cat) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(cat._id);
            setCategories((prev) => prev.filter((c) => c._id !== cat._id));
            Alert.alert('Success', 'Category deleted');
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete category');
          }
        },
      },
    ]);
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderCategory = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.catIconWrap}>
          <Text style={styles.catIcon}>📂</Text>
        </View>
        <View style={styles.catInfo}>
          <Text style={styles.catName}>{item.name}</Text>
          <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, item.isActive ? styles.activeText : styles.inactiveText]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => handleToggleActive(item)}
          style={[styles.toggleBtn, { backgroundColor: item.isActive ? '#eff6ff' : '#f0fdf4' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: item.isActive ? '#2563eb' : '#16a34a' }]}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn} activeOpacity={0.7}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.createRow}>
        <View style={styles.createInputWrap}>
          <TextInput
            style={styles.createInput}
            placeholder="New category name..."
            placeholderTextColor="#94a3b8"
            value={newName}
            onChangeText={setNewName}
          />
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating} activeOpacity={0.8}>
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderCategory}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        }
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
  createRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  createInputWrap: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  createInput: {
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  createBtn: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catIcon: {
    fontSize: 20,
  },
  catInfo: {
    flex: 1,
    gap: 6,
  },
  catName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeText: {
    color: '#16a34a',
  },
  inactiveText: {
    color: '#dc2626',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
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
