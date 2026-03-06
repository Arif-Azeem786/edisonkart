import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProducts, getProductImageUrl, getSearchSuggestions } from '../../src/services/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
];

const DEAL_COLORS = [
  { bg: '#1E3A8A', accent: '#F97316' },
  { bg: '#7C3AED', accent: '#FCD34D' },
  { bg: '#059669', accent: '#FDE68A' },
  { bg: '#DC2626', accent: '#FCA5A5' },
  { bg: '#0F172A', accent: '#F97316' },
];

const PAGE_SIZE = 20;

export default function ShopScreen() {
  const router = useRouter();
  const { category, search: searchParam, flashSale } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState(searchParam || '');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', minRating: '', brand: '' });
  const [draftFilters, setDraftFilters] = useState({ minPrice: '', maxPrice: '', minRating: '', brand: '' });
  const [dealProducts, setDealProducts] = useState([]);
  const [dealIdx, setDealIdx] = useState(0);

  const activeFilterCount =
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.brand ? 1 : 0);

  const openFilters = () => {
    setDraftFilters({ ...filters });
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setFilterVisible(false);
  };

  const clearFilters = () => {
    const cleared = { minPrice: '', maxPrice: '', minRating: '', brand: '' };
    setDraftFilters(cleared);
    setFilters(cleared);
    setFilterVisible(false);
  };

  const buildParams = (pageNum) => {
    const params = { limit: PAGE_SIZE, page: pageNum };
    if (category) params.category = category;
    if (flashSale === 'true') params.flashSale = true;
    if (search.trim()) params.search = search.trim();
    if (sort === 'price_asc') params.sort = 'price';
    else if (sort === 'price_desc') params.sort = '-price';
    else if (sort === 'popular') params.sort = '-rating';
    else params.sort = '-createdAt';
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating) params.minRating = filters.minRating;
    if (filters.brand) params.brand = filters.brand.trim();
    return params;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    setHasMore(true);
    getProducts(buildParams(1))
      .then((res) => {
        if (cancelled) return;
        const data = res?.products ?? (Array.isArray(res) ? res : res?.data ?? []);
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, search, sort, filters]);

  useEffect(() => {
    getProducts({ limit: 8, sort: 'discountPrice', order: 'asc' })
      .then((res) => {
        const data = res?.products ?? (Array.isArray(res) ? res : res?.data ?? []);
        const list = Array.isArray(data) ? data : [];
        setDealProducts(list.filter((p) => p.discountPrice && p.discountPrice < p.price));
      })
      .catch(() => setDealProducts([]));
  }, []);

  useEffect(() => {
    if (dealProducts.length < 2) return;
    const id = setInterval(() => setDealIdx((prev) => (prev + 1) % dealProducts.length), 4000);
    return () => clearInterval(id);
  }, [dealProducts.length]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    getProducts(buildParams(nextPage))
      .then((res) => {
        const data = res?.products ?? (Array.isArray(res) ? res : res?.data ?? []);
        const list = Array.isArray(data) ? data : [];
        setProducts((prev) => [...prev, ...list]);
        setPage(nextPage);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [page, loadingMore, hasMore, loading, category, search, sort, filters]);

  const handleSearchChange = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      getSearchSuggestions(text.trim())
        .then((res) => {
          const data = res?.suggestions ?? res?.data ?? res ?? [];
          setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    }, 400);
  };

  const applySuggestion = (text) => {
    const term = typeof text === 'string' ? text : text?.title ?? text?.name ?? '';
    setSearch(term);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const renderItem = ({ item: p }) => {
    const imgId = p.imageIds?.[0] || p.images?.[0];
    const uri = imgId ? getProductImageUrl(imgId) : null;
    const originalPrice = p.price ?? p.mrp ?? null;
    const salePrice = Math.round(p.discountPrice ?? p.edisonkartPrice ?? p.price ?? 0);
    const hasDiscount = originalPrice && originalPrice > salePrice;
    const discountPct = hasDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/product/${p.slug || p._id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardImageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.placeholder]}>
              <Text style={styles.placeholderIcon}>📦</Text>
            </View>
          )}
          {discountPct > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{discountPct}%</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{p.name || p.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.cardPrice}>₹{salePrice.toLocaleString('en-IN')}</Text>
            {hasDiscount && (
              <Text style={styles.cardOriginalPrice}>₹{Math.round(originalPrice).toLocaleString('en-IN')}</Text>
            )}
          </View>
          {p.rating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingText}>{p.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#F97316" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={handleSearchChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((s, i) => {
              const text = typeof s === 'string' ? s : s?.title ?? s?.name ?? '';
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionItem}
                  onPress={() => applySuggestion(s)}
                >
                  <Text style={styles.suggestionIcon}>🔍</Text>
                  <Text style={styles.suggestionText} numberOfLines={1}>{text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Category badge */}
      {category && (
        <View style={styles.categoryBadgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
            <TouchableOpacity onPress={() => router.setParams({ category: '' })}>
              <Text style={styles.categoryBadgeClose}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Today's Best Deals */}
      {dealProducts.length > 0 && (
        <View style={styles.dealSection}>
          <View style={styles.dealHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>🏷️</Text>
              <Text style={styles.dealHeading}>Today's Best Deals</Text>
            </View>
          </View>
          <View style={styles.dealBanner}>
            {dealProducts.map((dp, idx) => {
              if (idx !== dealIdx) return null;
              const color = DEAL_COLORS[idx % DEAL_COLORS.length];
              const discountPct = dp.price && dp.discountPrice ? Math.round(((dp.price - dp.discountPrice) / dp.price) * 100) : 0;
              const firstImg = dp.imageIds?.[0] ? getProductImageUrl(dp.imageIds[0]) : null;
              return (
                <TouchableOpacity
                  key={dp._id}
                  style={[styles.dealCard, { backgroundColor: color.bg }]}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/product/${dp.slug || dp._id}`)}
                >
                  <View style={styles.dealContent}>
                    <View style={styles.dealTextArea}>
                      <View style={[styles.dealBadge, { backgroundColor: color.accent }]}>
                        <Text style={styles.dealBadgeText}>-{discountPct}% OFF</Text>
                      </View>
                      <Text style={styles.dealProductName} numberOfLines={2}>{dp.name || dp.title}</Text>
                      <View style={styles.dealPriceRow}>
                        <Text style={styles.dealPrice}>₹{Math.round(dp.discountPrice).toLocaleString('en-IN')}</Text>
                        <Text style={styles.dealOriginalPrice}>₹{Math.round(dp.price).toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={[styles.dealShopBtn, { borderColor: color.accent }]}>
                        <Text style={[styles.dealShopBtnText, { color: color.accent }]}>Shop Now →</Text>
                      </View>
                    </View>
                    <View style={styles.dealImageArea}>
                      {firstImg ? (
                        <Image source={{ uri: firstImg }} style={styles.dealImage} resizeMode="contain" />
                      ) : (
                        <View style={styles.dealImagePlaceholder}>
                          <Text style={{ fontSize: 28, opacity: 0.3 }}>📦</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {dealProducts.length > 1 && (
              <View style={styles.dealDots}>
                {dealProducts.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setDealIdx(i)}>
                    <View style={[styles.dealDot, i === dealIdx && styles.dealDotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Sort pills + Filter button */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.sortPill, sort === opt.value && styles.sortPillActive]}
            onPress={() => setSort(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortPillText, sort === opt.value && styles.sortPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={openFilters}
          activeOpacity={0.7}
        >
          <Text style={styles.filterBtnIcon}>⚙</Text>
          <Text style={[styles.filterBtnText, activeFilterCount > 0 && styles.filterBtnTextActive]}>Filter</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <Text style={styles.headerCount}>
          {!loading && products.length > 0 ? `${products.length} products` : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          {renderHeader()}
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? `We couldn't find anything for "${search}". Try a different keyword.`
                  : 'No products available right now. Check back soon!'}
              </Text>
              {search.trim() && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => { setSearch(''); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyBtnText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceInputRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  value={draftFilters.minPrice}
                  onChangeText={(t) => setDraftFilters((f) => ({ ...f, minPrice: t.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.priceDash}>–</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  value={draftFilters.maxPrice}
                  onChangeText={(t) => setDraftFilters((f) => ({ ...f, maxPrice: t.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.filterDivider} />

              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.ratingOptions}>
                {['4', '3', '2', '1'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.ratingPill, draftFilters.minRating === r && styles.ratingPillActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, minRating: f.minRating === r ? '' : r }))}
                  >
                    <Text style={[styles.ratingPillText, draftFilters.minRating === r && styles.ratingPillTextActive]}>
                      {r}★ & up
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterDivider} />

              <Text style={styles.filterLabel}>Brand</Text>
              <TextInput
                style={styles.brandInput}
                placeholder="Enter brand name"
                value={draftFilters.brand}
                onChangeText={(t) => setDraftFilters((f) => ({ ...f, brand: t }))}
                placeholderTextColor="#94a3b8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearAllBtn} onPress={clearFilters}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '400',
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    padding: 4,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    maxHeight: 280,
    overflow: 'hidden',
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  suggestionIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },

  categoryBadgeRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
    textTransform: 'capitalize',
  },
  categoryBadgeClose: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },

  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  sortPillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  sortPillText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: '#ffffff',
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginLeft: 'auto',
    gap: 4,
  },
  filterBtnActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  filterBtnIcon: { fontSize: 14 },
  filterBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  filterBtnTextActive: { color: '#F97316' },
  filterBadge: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  filterBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  modalClose: { fontSize: 18, color: '#94a3b8', fontWeight: '600', padding: 4 },
  modalBody: { padding: 20 },
  filterLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInput: {
    flex: 1,
    height: 46,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  priceDash: { fontSize: 18, color: '#94a3b8', fontWeight: '600' },
  filterDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  ratingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ratingPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  ratingPillActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  ratingPillText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  ratingPillTextActive: { color: '#F97316' },
  brandInput: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearAllBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  clearAllText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  applyBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardImageWrap: {
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderIcon: {
    fontSize: 36,
    opacity: 0.4,
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 19,
    minHeight: 38,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
  },
  cardOriginalPrice: {
    fontSize: 13,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 3,
  },
  ratingStar: {
    fontSize: 13,
    color: '#F97316',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
  },

  empty: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Today's Best Deals */
  dealSection: { marginBottom: 4 },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dealHeading: { fontSize: 13, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.6 },
  dealBanner: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    minHeight: 160,
  },
  dealCard: { borderRadius: 14, overflow: 'hidden' },
  dealContent: { flexDirection: 'row', alignItems: 'center', padding: 14, minHeight: 160 },
  dealTextArea: { flex: 1, paddingRight: 6 },
  dealBadge: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 6 },
  dealBadgeText: { fontSize: 10, fontWeight: '900', color: '#0f172a', letterSpacing: 0.4 },
  dealProductName: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20, marginBottom: 5 },
  dealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  dealPrice: { fontSize: 20, fontWeight: '900', color: '#fff' },
  dealOriginalPrice: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },
  dealShopBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 5 },
  dealShopBtnText: { fontSize: 11, fontWeight: '700' },
  dealImageArea: { width: 110, height: 130, justifyContent: 'center', alignItems: 'center' },
  dealImage: { width: '100%', height: '100%' },
  dealImagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  dealDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, paddingVertical: 8 },
  dealDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  dealDotActive: { width: 16, backgroundColor: '#F97316' },
});
