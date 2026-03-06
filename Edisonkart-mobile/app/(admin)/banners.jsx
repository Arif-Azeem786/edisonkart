import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, ScrollView, Switch,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../src/services/banner';

const LINK_TYPES = ['none', 'category', 'product', 'url'];

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    title: '',
    subtitle: '',
    backgroundColor: '#F97316',
    linkType: 'none',
    linkValue: '',
    sortOrder: '0',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchBanners = async () => {
    try {
      const res = await getAllBanners();
      const list = res.banners || res || [];
      setBanners(Array.isArray(list) ? list : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch banners');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBanners();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('subtitle', form.subtitle.trim());
      formData.append('backgroundColor', form.backgroundColor.trim() || '#F97316');
      formData.append('linkType', form.linkType);
      formData.append('linkValue', form.linkValue.trim());
      formData.append('sortOrder', String(Number(form.sortOrder) || 0));
      await createBanner(formData);
      setForm(emptyForm);
      setShowForm(false);
      Alert.alert('Success', 'Banner created');
      fetchBanners();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const formData = new FormData();
      formData.append('isActive', String(!banner.isActive));
      await updateBanner(banner._id, formData);
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b)),
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update banner');
    }
  };

  const handleDelete = (banner) => {
    Alert.alert('Delete Banner', `Are you sure you want to delete "${banner.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBanner(banner._id);
            setBanners((prev) => prev.filter((b) => b._id !== banner._id));
            Alert.alert('Success', 'Banner deleted');
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete banner');
          }
        },
      },
    ]);
  };

  const renderBanner = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.colorStrip, { backgroundColor: item.backgroundColor || '#F97316' }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.subtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            ) : null}
          </View>
          <Switch
            value={item.isActive !== false}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
            thumbColor={item.isActive !== false ? '#16a34a' : '#94a3b8'}
          />
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>Order: {item.sortOrder ?? 0}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>Link: {item.linkType || 'none'}</Text>
          </View>
          <View style={[styles.badge, item.isActive !== false ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.badgeText, item.isActive !== false ? styles.activeText : styles.inactiveText]}>
              {item.isActive !== false ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn} activeOpacity={0.7}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
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
      <FlatList
        data={banners}
        keyExtractor={(item) => item._id}
        renderItem={renderBanner}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🖼️</Text>
            <Text style={styles.emptyText}>No banners found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Banner</Text>

              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Banner title"
                placeholderTextColor="#94a3b8"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />

              <Text style={styles.fieldLabel}>Subtitle</Text>
              <TextInput
                style={styles.input}
                placeholder="Banner subtitle"
                placeholderTextColor="#94a3b8"
                value={form.subtitle}
                onChangeText={(v) => setForm((f) => ({ ...f, subtitle: v }))}
              />

              <Text style={styles.fieldLabel}>Background Color</Text>
              <TextInput
                style={styles.input}
                placeholder="#F97316"
                placeholderTextColor="#94a3b8"
                value={form.backgroundColor}
                onChangeText={(v) => setForm((f) => ({ ...f, backgroundColor: v }))}
              />

              <Text style={styles.fieldLabel}>Link Type</Text>
              <View style={styles.linkTypeRow}>
                {LINK_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.linkTypeChip, form.linkType === t && styles.linkTypeChipActive]}
                    onPress={() => setForm((f) => ({ ...f, linkType: t }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linkTypeChipText, form.linkType === t && styles.linkTypeChipTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.linkType !== 'none' && (
                <>
                  <Text style={styles.fieldLabel}>Link Value</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Category ID, Product ID, or URL"
                    placeholderTextColor="#94a3b8"
                    value={form.linkValue}
                    onChangeText={(v) => setForm((f) => ({ ...f, linkValue: v }))}
                  />
                </>
              )}

              <Text style={styles.fieldLabel}>Sort Order</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={form.sortOrder}
                onChangeText={(v) => setForm((f) => ({ ...f, sortOrder: v }))}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowForm(false); setForm(emptyForm); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleCreate}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
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
    backgroundColor: '#f8fafc',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  colorStrip: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleArea: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  badge: {
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
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
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
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '400',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  linkTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  linkTypeChipActive: {
    backgroundColor: '#F97316',
  },
  linkTypeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  linkTypeChipTextActive: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
