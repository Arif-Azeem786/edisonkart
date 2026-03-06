import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getProducts, getCategories, getProductImageUrl, getSearchSuggestions } from '../../src/services/product';
import { getBanners } from '../../src/services/banner';

const { width: SW } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_W = (SW - 16 * 2 - CARD_GAP) / 2;
const BANNER_W = SW - 32;

const CATEGORY_ICONS = {
  electronics: '📱', fashion: '👗', home: '🏠', beauty: '✨',
  sports: '⚽', books: '📚', toys: '🧸', grocery: '🛒',
  health: '💊', automotive: '🚗', kitchen: '🍳', garden: '🌱',
  'imported-products': '🌐', imported: '🌐',
};
function getCatIcon(slug) {
  if (!slug) return '📦';
  const l = slug.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) { if (l.includes(k)) return v; }
  return '📦';
}

function useCountdown(endTime) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!endTime) return;
    const target = new Date(endTime);
    if (isNaN(target)) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setText('ENDED'); return; }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setText(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return text;
}

const DEAL_COLORS = [
  { bg: '#1E3A8A', accent: '#F97316' },
  { bg: '#7C3AED', accent: '#FCD34D' },
  { bg: '#059669', accent: '#FDE68A' },
  { bg: '#DC2626', accent: '#FCA5A5' },
  { bg: '#0F172A', accent: '#F97316' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [flashProducts, setFlashProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef(null);

  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerRef = useRef(null);
  const [dealIdx, setDealIdx] = useState(0);

  const earliestFlashEnd = flashProducts
    .map(p => p.flashSaleEndTime)
    .filter(Boolean)
    .sort()[0];
  const countdown = useCountdown(earliestFlashEnd);

  const load = async () => {
    try {
      const [prodsRes, catsRes, flashRes, bannersRes, dealsRes] = await Promise.all([
        getProducts({ limit: 12, sort: 'createdAt', order: 'desc' }),
        getCategories(),
        getProducts({ isFlashSale: 'true', limit: 10 }),
        getBanners().catch(() => []),
        getProducts({ limit: 8, sort: 'discountPrice', order: 'asc' }),
      ]);
      const extract = (r) => r?.products ?? (Array.isArray(r) ? r : r?.data ?? []);
      setProducts(Array.isArray(extract(prodsRes)) ? extract(prodsRes) : []);
      setFlashProducts(Array.isArray(extract(flashRes)) ? extract(flashRes) : []);
      const rawDeals = Array.isArray(extract(dealsRes)) ? extract(dealsRes) : [];
      setDealProducts(rawDeals.filter(p => p.discountPrice && p.discountPrice < p.price));
      const cats = catsRes?.categories ?? (Array.isArray(catsRes) ? catsRes : catsRes?.data ?? []);
      setCategories(Array.isArray(cats) ? cats : []);
      const bList = bannersRes?.data ?? (Array.isArray(bannersRes) ? bannersRes : []);
      setBanners(Array.isArray(bList) ? bList : []);
    } catch (_) {
      setProducts([]); setCategories([]); setFlashProducts([]); setBanners([]); setDealProducts([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  // Auto-scroll banners
  const allBanners = banners.length > 0 ? banners : null;
  useEffect(() => {
    if (!allBanners || allBanners.length < 2) return;
    const id = setInterval(() => {
      setBannerIdx(prev => {
        const next = (prev + 1) % allBanners.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [allBanners?.length]);

  useEffect(() => {
    if (dealProducts.length < 2) return;
    const id = setInterval(() => setDealIdx(prev => (prev + 1) % dealProducts.length), 4000);
    return () => clearInterval(id);
  }, [dealProducts.length]);

  // Search suggestions
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setShowSuggestions(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions(text);
        setSuggestions(res?.data ?? (Array.isArray(res) ? res : []));
      } catch { setSuggestions([]); }
    }, 350);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    router.push({ pathname: '/(tabs)/shop', params: { search: searchQuery.trim() } });
    setSearchQuery('');
  };

  const handleCameraSearch = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      router.push('/(tabs)/shop');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      router.push('/(tabs)/shop');
    }
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={s.container}>
      {/* ─── STICKY HEADER ─── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Image source={require('../../assets/logo.png')} style={s.headerLogo} resizeMode="contain" />
          <TouchableOpacity onPress={() => router.push('/chat')} activeOpacity={0.7} style={s.headerIcon}>
            <Text style={{ fontSize: 20 }}>💬</Text>
          </TouchableOpacity>
        </View>
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search products, brands..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                <Text style={{ fontSize: 16, color: '#94a3b8', marginRight: 4 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={s.cameraBtn}
            activeOpacity={0.7}
            onPress={handleCameraSearch}
          >
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── SUGGESTIONS DROPDOWN ─── */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={s.suggestionsOverlay}>
          <ScrollView style={s.suggestionsBox} keyboardShouldPersistTaps="handled">
            {suggestions.slice(0, 6).map((item) => (
              <TouchableOpacity
                key={item._id}
                style={s.suggestionItem}
                onPress={() => {
                  setShowSuggestions(false);
                  setSearchQuery('');
                  router.push(`/product/${item.slug || item._id}`);
                }}
              >
                {item.imageIds?.[0] && (
                  <Image source={{ uri: getProductImageUrl(item.imageIds[0]) }} style={s.suggestionImg} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestionText} numberOfLines={1}>{item.name || item.title}</Text>
                  {item.brand && <Text style={s.suggestionBrand}>{item.brand}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowSuggestions(false)}
      >
        {/* ─── BANNER CAROUSEL ─── */}
        {allBanners && allBanners.length > 0 && (
          <View style={s.bannerSection}>
            <FlatList
              ref={bannerRef}
              data={allBanners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(b) => b._id}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SW - 32));
                setBannerIdx(idx);
              }}
              contentContainerStyle={{ gap: 0 }}
              snapToInterval={SW - 32}
              decelerationRate="fast"
              renderItem={({ item }) => {
                const imgId = item.imageId;
                return (
                  <TouchableOpacity
                    style={[s.bannerCard, { backgroundColor: item.backgroundColor || '#1E3A8A' }]}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (item.linkType === 'product') router.push(`/product/${item.linkValue}`);
                      else if (item.linkType === 'category') router.push({ pathname: '/(tabs)/shop', params: { category: item.linkValue } });
                      else if (item.linkType === 'flash-sale') router.push({ pathname: '/(tabs)/shop', params: { flashSale: 'true' } });
                    }}
                  >
                    {imgId ? (
                      <Image source={{ uri: getProductImageUrl(imgId) }} style={s.bannerImage} resizeMode="cover" />
                    ) : (
                      <View style={s.bannerTextOnly}>
                        <Text style={s.bannerTitle}>{item.title}</Text>
                        {item.subtitle && <Text style={s.bannerSubtitle}>{item.subtitle}</Text>}
                      </View>
                    )}
                    {imgId && (
                      <View style={s.bannerOverlay}>
                        <Text style={s.bannerTitle}>{item.title}</Text>
                        {item.subtitle && <Text style={s.bannerSubtitle}>{item.subtitle}</Text>}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            {allBanners.length > 1 && (
              <View style={s.bannerDots}>
                {allBanners.map((_, i) => (
                  <View key={i} style={[s.bannerDot, i === bannerIdx && s.bannerDotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── CATEGORIES ─── */}
        {categories.length > 0 && (
          <View style={s.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
              {categories.slice(0, 10).map((c) => (
                <TouchableOpacity
                  key={c._id || c.slug}
                  style={s.catItem}
                  onPress={() => router.push({ pathname: '/(tabs)/shop', params: { category: c.slug } })}
                  activeOpacity={0.7}
                >
                  <View style={s.catCircle}>
                    <Text style={s.catIcon}>{getCatIcon(c.slug || c.name)}</Text>
                  </View>
                  <Text style={s.catName} numberOfLines={1}>{c.name || c.slug}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── TODAY'S BEST DEALS ─── */}
        {dealProducts.length > 0 && (
          <View style={s.dealSection}>
            <View style={s.dealHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>🏷️</Text>
                <Text style={s.dealHeading}>Today's Best Deals</Text>
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/shop', params: { sort: 'discountPrice', order: 'asc' } })}>
                <Text style={s.dealViewAll}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={s.dealBanner}>
              {dealProducts.map((product, idx) => {
                const color = DEAL_COLORS[idx % DEAL_COLORS.length];
                const discountPct = Math.round(((product.price - product.discountPrice) / product.price) * 100);
                const firstImg = product.imageIds?.[0] ? getProductImageUrl(product.imageIds[0]) : null;
                const isActive = idx === dealIdx;

                if (!isActive) return null;

                return (
                  <TouchableOpacity
                    key={product._id}
                    style={[s.dealCard, { backgroundColor: color.bg }]}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/product/${product.slug || product._id}`)}
                  >
                    <View style={s.dealContent}>
                      <View style={s.dealTextArea}>
                        <View style={[s.dealBadge, { backgroundColor: color.accent }]}>
                          <Text style={s.dealBadgeText}>-{discountPct}% OFF</Text>
                        </View>
                        <Text style={s.dealProductName} numberOfLines={2}>{product.name}</Text>
                        <View style={s.dealPriceRow}>
                          <Text style={s.dealPrice}>₹{Math.round(product.discountPrice).toLocaleString('en-IN')}</Text>
                          <Text style={s.dealOriginalPrice}>₹{Math.round(product.price).toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={[s.dealShopBtn, { borderColor: color.accent }]}>
                          <Text style={[s.dealShopBtnText, { color: color.accent }]}>Shop Now →</Text>
                        </View>
                      </View>
                      <View style={s.dealImageArea}>
                        {firstImg ? (
                          <Image source={{ uri: firstImg }} style={s.dealImage} resizeMode="contain" />
                        ) : (
                          <View style={s.dealImagePlaceholder}>
                            <Text style={{ fontSize: 32, opacity: 0.3 }}>📦</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {dealProducts.length > 1 && (
                <View style={s.dealDots}>
                  {dealProducts.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setDealIdx(i)}>
                      <View style={[s.dealDot, i === dealIdx && s.dealDotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── FLASH SALE ─── */}
        {flashProducts.length > 0 && countdown !== 'ENDED' && (
          <View style={s.flashSection}>
            <View style={s.flashHeader}>
              <View style={s.flashLeft}>
                <Text style={s.flashBolt}>⚡</Text>
                <View>
                  <Text style={s.flashTitle}>Flash Sale</Text>
                  <Text style={s.flashSub}>Limited time deals!</Text>
                </View>
              </View>
              {countdown ? (
                <View style={s.countdownRow}>
                  {countdown.split(':').map((unit, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={s.countdownBox}>
                        <Text style={s.countdownText}>{unit}</Text>
                      </View>
                      {i < 2 && <Text style={s.countdownSep}>:</Text>}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <FlatList
              data={flashProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p._id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item: p }) => {
                const img = p.imageIds?.[0];
                const salePrice = Math.round(p.discountPrice ?? p.price ?? 0);
                const origPrice = Math.round(p.price ?? 0);
                const off = origPrice > salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0;
                return (
                  <TouchableOpacity
                    style={s.flashCard}
                    onPress={() => router.push(`/product/${p.slug || p._id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={s.flashImgWrap}>
                      {img ? (
                        <Image source={{ uri: getProductImageUrl(img) }} style={s.flashImg} resizeMode="contain" />
                      ) : (
                        <View style={[s.flashImg, s.placeholderBg]}><Text style={{ fontSize: 28, opacity: 0.3 }}>📦</Text></View>
                      )}
                      {off > 0 && (
                        <View style={s.flashBadge}><Text style={s.flashBadgeText}>{off}% OFF</Text></View>
                      )}
                    </View>
                    <Text style={s.flashName} numberOfLines={2}>{p.name || p.title}</Text>
                    <View style={s.flashPriceRow}>
                      <Text style={s.flashPrice}>₹{salePrice.toLocaleString('en-IN')}</Text>
                      {origPrice > salePrice && (
                        <Text style={s.flashOldPrice}>₹{origPrice.toLocaleString('en-IN')}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={s.flashViewAll}
              onPress={() => router.push({ pathname: '/(tabs)/shop', params: { flashSale: 'true' } })}
              activeOpacity={0.7}
            >
              <Text style={s.flashViewAllText}>View All Flash Deals →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── FEATURED PRODUCTS ─── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Trending Now</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} activeOpacity={0.7}>
              <Text style={s.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.grid}>
            {products.slice(0, 8).map((p) => {
              const imgId = p.imageIds?.[0] || p.images?.[0];
              const uri = imgId ? getProductImageUrl(imgId) : null;
              const salePrice = Math.round(p.discountPrice ?? p.edisonkartPrice ?? p.price ?? 0);
              const origPrice = Math.round(p.price ?? 0);
              const hasDiscount = origPrice > salePrice;
              const off = hasDiscount ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0;
              return (
                <TouchableOpacity
                  key={p._id}
                  style={s.card}
                  onPress={() => router.push(`/product/${p.slug || p._id}`)}
                  activeOpacity={0.85}
                >
                  <View style={s.cardImgWrap}>
                    {uri ? (
                      <Image source={{ uri }} style={s.cardImg} resizeMode="cover" />
                    ) : (
                      <View style={[s.cardImg, s.placeholderBg]}><Text style={{ fontSize: 32, opacity: 0.3 }}>📦</Text></View>
                    )}
                    {off > 0 && (
                      <View style={s.cardBadge}><Text style={s.cardBadgeText}>{off}%</Text></View>
                    )}
                  </View>
                  <View style={s.cardBody}>
                    <Text style={s.cardTitle} numberOfLines={2}>{p.name || p.title}</Text>
                    <View style={s.priceRow}>
                      <Text style={s.cardPrice}>₹{salePrice.toLocaleString('en-IN')}</Text>
                      {hasDiscount && (
                        <Text style={s.cardOldPrice}>₹{origPrice.toLocaleString('en-IN')}</Text>
                      )}
                    </View>
                    {(p.averageRating > 0 || p.rating > 0) && (
                      <View style={s.ratingRow}>
                        <View style={s.ratingPill}>
                          <Text style={s.ratingStarSmall}>★</Text>
                          <Text style={s.ratingNum}>{(p.averageRating || p.rating || 0).toFixed(1)}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── IMPORT CTA ─── */}
        <TouchableOpacity style={s.importCard} onPress={() => router.push('/import-product')} activeOpacity={0.85}>
          <View style={s.importIconWrap}><Text style={{ fontSize: 22 }}>🔗</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.importTitle}>Import from Link</Text>
            <Text style={s.importDesc}>Paste any product link to add it to EdisonKart</Text>
          </View>
          <Text style={{ fontSize: 20, color: '#F97316', fontWeight: '700' }}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },

  /* Header */
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLogo: { width: 140, height: 32 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 },
  cameraBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Suggestions */
  suggestionsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 130 : 114,
    left: 16,
    right: 66,
    zIndex: 999,
  },
  suggestionsBox: {
    maxHeight: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  suggestionImg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f8fafc' },
  suggestionText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  suggestionBrand: { fontSize: 12, color: '#64748b', marginTop: 1 },

  /* Banners */
  bannerSection: { paddingTop: 12, paddingHorizontal: 16 },
  bannerCard: {
    width: SW - 32,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerTextOnly: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  bannerDotActive: { backgroundColor: '#F97316', width: 20 },

  /* Categories */
  section: { paddingHorizontal: 16, paddingTop: 20 },
  catRow: { gap: 14, paddingRight: 16, paddingVertical: 4 },
  catItem: { alignItems: 'center', width: 68 },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  catIcon: { fontSize: 24 },
  catName: { marginTop: 6, fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },

  /* Flash Sale */
  flashSection: {
    marginTop: 20,
    backgroundColor: '#1E3A8A',
    paddingVertical: 16,
    borderRadius: 0,
  },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  flashLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flashBolt: { fontSize: 24 },
  flashTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  flashSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  countdownText: { color: '#fff', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countdownSep: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '800', marginHorizontal: 2 },
  flashCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  flashImgWrap: { aspectRatio: 1, backgroundColor: '#f8fafc', position: 'relative' },
  flashImg: { width: '100%', height: '100%' },
  flashBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  flashName: { fontSize: 12, fontWeight: '600', color: '#0f172a', padding: 8, paddingBottom: 4, lineHeight: 16 },
  flashPriceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, gap: 4 },
  flashPrice: { fontSize: 14, fontWeight: '800', color: '#16a34a' },
  flashOldPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  flashViewAll: { alignItems: 'center', marginTop: 12 },
  flashViewAllText: { color: '#fff', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },

  /* Featured Grid */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#F97316' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  card: {
    width: CARD_W,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardImgWrap: { aspectRatio: 1, backgroundColor: '#f8fafc', position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  placeholderBg: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  cardBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  cardBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a', lineHeight: 17, minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  cardOldPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  ratingRow: { marginTop: 4 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    gap: 2,
  },
  ratingStarSmall: { fontSize: 10, color: '#fff' },
  ratingNum: { fontSize: 11, fontWeight: '700', color: '#fff' },

  /* Import CTA */
  importCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  importIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  importDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },

  /* Today's Best Deals */
  dealSection: { marginTop: 8, paddingBottom: 4 },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dealHeading: { fontSize: 14, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.8 },
  dealViewAll: { fontSize: 12, fontWeight: '700', color: '#1E3A8A' },
  dealBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 180,
  },
  dealCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 180,
  },
  dealTextArea: {
    flex: 1,
    paddingRight: 8,
  },
  dealBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  dealBadgeText: { fontSize: 11, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  dealProductName: { fontSize: 16, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 6 },
  dealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  dealPrice: { fontSize: 24, fontWeight: '900', color: '#fff' },
  dealOriginalPrice: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },
  dealShopBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dealShopBtnText: { fontSize: 12, fontWeight: '700' },
  dealImageArea: {
    width: 130,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealImage: { width: '100%', height: '100%' },
  dealImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dealDotActive: {
    width: 18,
    backgroundColor: '#F97316',
  },
});
