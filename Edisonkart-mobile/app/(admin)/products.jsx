import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, RefreshControl, Modal, ScrollView, Switch } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getAdminProducts, deleteProduct, getProductImageUrl, createProduct, getCategories } from '../../src/services/product';

const EMPTY_FORM = {
  name: '', description: '', price: '', discountPrice: '', stock: '', categoryId: '', brand: '',
  isFlashSale: false, flashSaleEndTime: '',
  hasVariants: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedImages, setSelectedImages] = useState([]);

  // Variant state
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [variants, setVariants] = useState([]);

  const fetchProducts = async (pageNum = 1, searchQuery = search, append = false) => {
    try {
      if (pageNum === 1 && !append) setLoading(true);
      const res = await getAdminProducts({ page: pageNum, limit: 20, search: searchQuery });
      const data = res.data || res;
      const list = data.products || data || [];
      const total = data.totalPages || 1;
      if (append) setProducts((prev) => [...prev, ...list]);
      else setProducts(list);
      setHasMore(pageNum < total);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch products');
    } finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const cats = res?.categories ?? (Array.isArray(res) ? res : res?.data ?? []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch { setCategories([]); }
  };

  useEffect(() => { fetchProducts(1, search); fetchCategories(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchProducts(1, search), 500); return () => clearTimeout(t); }, [search]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchProducts(1, search); }, [search]);
  const loadMore = () => { if (!hasMore || loadingMore) return; setLoadingMore(true); fetchProducts(page + 1, search, true); };

  const handleDelete = (product) => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteProduct(product._id);
            setProducts((prev) => prev.filter((p) => p._id !== product._id));
        } catch (err) { Alert.alert('Error', err.message || 'Failed to delete'); }
      }},
    ]);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled && result.assets) setSelectedImages((prev) => [...prev, ...result.assets].slice(0, 10));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets) setSelectedImages((prev) => [...prev, ...result.assets].slice(0, 10));
  };

  // ── Variant helpers ──
  const addAttribute = () => {
    setVariantAttributes((prev) => [...prev, { name: '', values: [''] }]);
  };

  const updateAttrName = (idx, name) => {
    setVariantAttributes((prev) => prev.map((a, i) => i === idx ? { ...a, name } : a));
  };

  const addAttrValue = (idx) => {
    setVariantAttributes((prev) => prev.map((a, i) => i === idx ? { ...a, values: [...a.values, ''] } : a));
  };

  const updateAttrValue = (attrIdx, valIdx, value) => {
    setVariantAttributes((prev) => prev.map((a, i) => {
      if (i !== attrIdx) return a;
      const vals = [...a.values];
      vals[valIdx] = value;
      return { ...a, values: vals };
    }));
  };

  const removeAttrValue = (attrIdx, valIdx) => {
    setVariantAttributes((prev) => prev.map((a, i) => {
      if (i !== attrIdx) return a;
      return { ...a, values: a.values.filter((_, j) => j !== valIdx) };
    }));
  };

  const removeAttribute = (idx) => {
    setVariantAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  const generateVariants = () => {
    const validAttrs = variantAttributes.filter(a => a.name.trim() && a.values.some(v => v.trim()));
    if (validAttrs.length === 0) { setVariants([]); return; }

    const combos = validAttrs.reduce((acc, attr) => {
      const validVals = attr.values.filter(v => v.trim());
      if (acc.length === 0) return validVals.map(v => ({ [attr.name]: v }));
      const next = [];
      acc.forEach(combo => validVals.forEach(v => next.push({ ...combo, [attr.name]: v })));
      return next;
    }, []);

    setVariants(combos.map(attrs => ({
      attributes: attrs,
      price: form.price || '',
      discountPrice: form.discountPrice || '',
      stock: form.stock || '10',
    })));
  };

  const updateVariantField = (idx, field, value) => {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const handleCreateProduct = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Product name is required'); return; }
    if (!form.price || isNaN(form.price)) { Alert.alert('Error', 'Valid price is required'); return; }
    if (!form.categoryId) { Alert.alert('Error', 'Please select a category'); return; }
    if (form.discountPrice && Number(form.discountPrice) > Number(form.price)) {
      Alert.alert('Error', 'Discount price cannot be greater than regular price'); return;
    }

    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim() || form.name.trim());
      fd.append('price', String(Math.round(Number(form.price))));
      if (form.discountPrice) fd.append('discountPrice', String(Math.round(Number(form.discountPrice))));
      fd.append('stock', String(Number(form.stock) || 10));
      fd.append('categoryId', form.categoryId);
      if (form.brand.trim()) fd.append('brand', form.brand.trim());
      fd.append('isFlashSale', String(form.isFlashSale));
      if (form.isFlashSale && form.flashSaleEndTime) {
        fd.append('flashSaleEndTime', form.flashSaleEndTime);
      }

      if (form.hasVariants && variantAttributes.length > 0 && variants.length > 0) {
        fd.append('hasVariants', 'true');
        const cleanAttrs = variantAttributes
          .filter(a => a.name.trim() && a.values.some(v => v.trim()))
          .map(a => ({ name: a.name.trim(), values: a.values.filter(v => v.trim()) }));
        fd.append('variantAttributes', JSON.stringify(cleanAttrs));
        const cleanVariants = variants.map(v => ({
          attributes: v.attributes,
          price: Number(v.price) || Number(form.price),
          discountPrice: Number(v.discountPrice) || undefined,
          stock: Number(v.stock) || 0,
        }));
        fd.append('variants', JSON.stringify(cleanVariants));
      }

      selectedImages.forEach((img, i) => {
        fd.append('images', { uri: img.uri, type: img.mimeType || 'image/jpeg', name: img.fileName || `product-${i}.jpg` });
      });

      await createProduct(fd);
      Alert.alert('Success', 'Product created!');
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      setSelectedImages([]);
      setVariantAttributes([]);
      setVariants([]);
      fetchProducts(1, search);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to create product');
    } finally { setCreating(false); }
  };

  const getThumbUri = (product) => {
    const imgs = product.imageIds ?? product.images ?? [];
    if (imgs.length > 0) {
      const img = imgs[0];
      if (typeof img === 'string') return getProductImageUrl(img);
      if (img._id) return getProductImageUrl(img._id);
    }
    return null;
  };

  const renderProduct = ({ item }) => {
    const thumbUri = getThumbUri(item);
    const hasDiscount = item.discountPrice && item.discountPrice < item.price;
    const displayPrice = Math.round(hasDiscount ? item.discountPrice : item.price || 0);
    const originalPrice = Math.round(item.price || 0);
    const discountPct = hasDiscount ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    return (
      <View style={st.productCard}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={st.thumbnail} />
        ) : (
          <View style={[st.thumbnail, st.noImage]}><Text style={{ fontSize: 26 }}>📷</Text></View>
        )}
        <View style={st.productInfo}>
          <Text style={st.productName} numberOfLines={2}>{item.name}</Text>
          <View style={st.priceRow}>
            <Text style={st.productPrice}>₹{displayPrice.toLocaleString('en-IN')}</Text>
            {hasDiscount && (
              <Text style={st.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
            )}
            {discountPct > 0 && (
              <View style={st.discountPill}>
                <Text style={st.discountPillText}>{discountPct}% off</Text>
              </View>
            )}
          </View>
          <View style={st.productMeta}>
            <View style={st.stockPill}><Text style={st.stockText}>Stock: {item.stock ?? 0}</Text></View>
            {item.hasVariants && (
              <View style={st.variantPill}><Text style={st.variantPillText}>Variants</Text></View>
            )}
            <View style={[st.badge, item.isActive !== false ? st.activeBadge : st.inactiveBadge]}>
              <Text style={[st.badgeText, item.isActive !== false ? st.activeText : st.inactiveText]}>
                {item.isActive !== false ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} style={st.deleteBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <View style={st.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={st.container}>
      <View style={st.searchContainer}>
        <View style={st.searchInputWrap}>
          <Text style={{ fontSize: 16, marginRight: 10 }}>🔍</Text>
          <TextInput style={st.searchInput} placeholder="Search products..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={st.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: 20 }} color="#F97316" /> : null}
        ListEmptyComponent={
          <View style={st.empty}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 16, color: '#94a3b8', fontWeight: '500' }}>No products found</Text>
          </View>
        }
      />

      <TouchableOpacity style={st.fab} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
        <Text style={st.fabText}>+</Text>
      </TouchableOpacity>

      {/* ─── Create Product Modal ─── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={{ fontSize: 24, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              {/* Name */}
              <Text style={st.label}>Product Name *</Text>
              <TextInput style={st.input} placeholder="e.g. Wireless Headphones" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} placeholderTextColor="#94a3b8" />

              {/* Description */}
              <Text style={st.label}>Description</Text>
              <TextInput style={[st.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Product description..." value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} multiline placeholderTextColor="#94a3b8" />

              {/* Price + Discount Price */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Original Price (₹) *</Text>
                  <TextInput style={st.input} placeholder="999" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} keyboardType="numeric" placeholderTextColor="#94a3b8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Discount Price (₹)</Text>
                  <TextInput style={st.input} placeholder="799" value={form.discountPrice} onChangeText={(t) => setForm({ ...form, discountPrice: t })} keyboardType="numeric" placeholderTextColor="#94a3b8" />
                </View>
              </View>
              {form.price && form.discountPrice && Number(form.discountPrice) < Number(form.price) && (
                <View style={st.discountPreview}>
                  <Text style={st.discountPreviewText}>
                    Discount: {Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)}% off — Selling at ₹{Math.round(Number(form.discountPrice)).toLocaleString('en-IN')}{' '}
                    <Text style={{ textDecorationLine: 'line-through', color: '#94a3b8' }}>₹{Math.round(Number(form.price)).toLocaleString('en-IN')}</Text>
                  </Text>
                </View>
              )}

              {/* Stock + Brand */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Stock</Text>
                  <TextInput style={st.input} placeholder="10" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} keyboardType="numeric" placeholderTextColor="#94a3b8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.label}>Brand</Text>
                  <TextInput style={st.input} placeholder="Brand name" value={form.brand} onChangeText={(t) => setForm({ ...form, brand: t })} placeholderTextColor="#94a3b8" />
                </View>
              </View>

              {/* Category */}
              <Text style={st.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[st.catChip, form.categoryId === c._id && st.catChipActive]}
                    onPress={() => setForm({ ...form, categoryId: c._id })}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.catChipText, form.categoryId === c._id && st.catChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Flash Sale */}
              <View style={st.switchRow}>
                <Text style={st.label}>Flash Sale</Text>
                <Switch value={form.isFlashSale} onValueChange={(v) => setForm({ ...form, isFlashSale: v })} trackColor={{ true: '#F97316' }} thumbColor="#fff" />
              </View>
              {form.isFlashSale && (
                <View>
                  <Text style={st.label}>Flash Sale End (YYYY-MM-DD HH:MM)</Text>
                  <TextInput
                    style={st.input}
                    placeholder="2026-03-15 23:59"
                    value={form.flashSaleEndTime}
                    onChangeText={(t) => setForm({ ...form, flashSaleEndTime: t })}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              )}

              {/* ── Variants Section ── */}
              <View style={st.sectionDivider} />
              <View style={st.switchRow}>
                <View>
                  <Text style={st.label}>Product Variants</Text>
                  <Text style={st.hintText}>e.g. Size, Color</Text>
                </View>
                <Switch
                  value={form.hasVariants}
                  onValueChange={(v) => {
                    setForm({ ...form, hasVariants: v });
                    if (!v) { setVariantAttributes([]); setVariants([]); }
                  }}
                  trackColor={{ true: '#F97316' }}
                  thumbColor="#fff"
                />
              </View>

              {form.hasVariants && (
                <View style={st.variantsContainer}>
                  {/* Attributes */}
                  <Text style={st.subLabel}>Attributes</Text>
                  {variantAttributes.map((attr, attrIdx) => (
                    <View key={attrIdx} style={st.attrCard}>
                      <View style={st.attrHeader}>
                        <TextInput
                          style={[st.input, { flex: 1, marginBottom: 0 }]}
                          placeholder="Attribute name (e.g. Size)"
                          value={attr.name}
                          onChangeText={(t) => updateAttrName(attrIdx, t)}
                          placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity onPress={() => removeAttribute(attrIdx)} style={st.removeAttrBtn}>
                          <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={st.valuesLabel}>Values:</Text>
                      {attr.values.map((val, valIdx) => (
                        <View key={valIdx} style={st.valueRow}>
                          <TextInput
                            style={[st.input, { flex: 1, marginBottom: 0 }]}
                            placeholder={`Value ${valIdx + 1} (e.g. XL)`}
                            value={val}
                            onChangeText={(t) => updateAttrValue(attrIdx, valIdx, t)}
                            placeholderTextColor="#94a3b8"
                          />
                          {attr.values.length > 1 && (
                            <TouchableOpacity onPress={() => removeAttrValue(attrIdx, valIdx)} style={st.removeValBtn}>
                              <Text style={{ color: '#dc2626', fontSize: 14 }}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity onPress={() => addAttrValue(attrIdx)} style={st.addValBtn}>
                        <Text style={st.addValText}>+ Add Value</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity onPress={addAttribute} style={st.addAttrBtn}>
                    <Text style={st.addAttrText}>+ Add Attribute</Text>
                  </TouchableOpacity>

                  {variantAttributes.some(a => a.name.trim() && a.values.some(v => v.trim())) && (
                    <TouchableOpacity onPress={generateVariants} style={st.generateBtn}>
                      <Text style={st.generateBtnText}>Generate Variants</Text>
                    </TouchableOpacity>
                  )}

                  {/* Variant rows */}
                  {variants.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={st.subLabel}>Variant Pricing & Stock ({variants.length})</Text>
                      {variants.map((v, idx) => {
                        const label = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' / ');
                        return (
                          <View key={idx} style={st.variantRow}>
                            <Text style={st.variantLabel}>{label}</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <View style={{ flex: 1 }}>
                                <Text style={st.tinyLabel}>Price</Text>
                                <TextInput
                                  style={st.variantInput}
                                  value={v.price}
                                  onChangeText={(t) => updateVariantField(idx, 'price', t)}
                                  keyboardType="numeric"
                                  placeholder={form.price || '0'}
                                  placeholderTextColor="#94a3b8"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={st.tinyLabel}>Disc. Price</Text>
                                <TextInput
                                  style={st.variantInput}
                                  value={v.discountPrice}
                                  onChangeText={(t) => updateVariantField(idx, 'discountPrice', t)}
                                  keyboardType="numeric"
                                  placeholder={form.discountPrice || '—'}
                                  placeholderTextColor="#94a3b8"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={st.tinyLabel}>Stock</Text>
                                <TextInput
                                  style={st.variantInput}
                                  value={v.stock}
                                  onChangeText={(t) => updateVariantField(idx, 'stock', t)}
                                  keyboardType="numeric"
                                  placeholder="10"
                                  placeholderTextColor="#94a3b8"
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* ── Images ── */}
              <View style={st.sectionDivider} />
              <Text style={st.label}>Images</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity style={st.imgPickBtn} onPress={pickImages} activeOpacity={0.7}>
                  <Text style={{ fontSize: 20 }}>🖼️</Text>
                  <Text style={st.imgPickText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.imgPickBtn} onPress={takePhoto} activeOpacity={0.7}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                  <Text style={st.imgPickText}>Camera</Text>
                </TouchableOpacity>
              </View>
              {selectedImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                  {selectedImages.map((img, i) => (
                    <View key={i} style={{ position: 'relative' }}>
                      <Image source={{ uri: img.uri }} style={st.previewImg} />
                      <TouchableOpacity style={st.removeImgBtn} onPress={() => setSelectedImages((prev) => prev.filter((_, j) => j !== i))}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Create Button */}
              <TouchableOpacity
                style={[st.createBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreateProduct}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={st.createBtnText}>Create Product</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', alignItems: 'center' },
  thumbnail: { width: 68, height: 68, borderRadius: 12, backgroundColor: '#f1f5f9' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1, marginLeft: 14 },
  productName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#F97316' },
  originalPrice: { fontSize: 12, color: '#94a3b8', textDecorationLine: 'line-through' },
  discountPill: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  discountPillText: { fontSize: 10, fontWeight: '800', color: '#16a34a' },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  stockPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  stockText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  variantPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  variantPillText: { fontSize: 11, color: '#2563EB', fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  activeBadge: { backgroundColor: '#dcfce7' },
  inactiveBadge: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  activeText: { color: '#16a34a' },
  inactiveText: { color: '#dc2626' },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' },
  fabText: { fontSize: 30, color: '#fff', fontWeight: '400', lineHeight: 32 },
  empty: { alignItems: 'center', paddingTop: 80 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 16, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a', marginBottom: 14 },

  discountPreview: { backgroundColor: '#dcfce7', borderRadius: 10, padding: 10, marginBottom: 14 },
  discountPreviewText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  hintText: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  catChipActive: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  catChipTextActive: { color: '#F97316' },

  sectionDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 18 },
  subLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 10 },

  variantsContainer: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 8 },
  attrCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  attrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  removeAttrBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  valuesLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeValBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  addValBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EFF6FF' },
  addValText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  addAttrBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1E3A8A', marginBottom: 12 },
  addAttrText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  generateBtn: { backgroundColor: '#F97316', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 4 },
  generateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  variantRow: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  variantLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  tinyLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 },
  variantInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0f172a' },

  imgPickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  imgPickText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  previewImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f1f5f9' },
  removeImgBtn: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center' },
  createBtn: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
