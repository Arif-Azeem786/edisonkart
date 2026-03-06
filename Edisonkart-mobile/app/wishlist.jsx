import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import useCartStore from '../src/store/cartStore';
import { getWishlist, toggleWishlist } from '../src/services/wishlist';
import { getProductImageUrl } from '../src/services/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

export default function WishlistScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const fetchWishlist = useCallback(() => {
    setLoading(true);
    getWishlist()
      .then((res) => {
        const data = res?.products ?? res?.data ?? res?.items ?? res?.wishlist ?? res ?? [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await toggleWishlist(productId);
      fetchWishlist();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not remove from wishlist.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingId(productId);
    try {
      await addItem(productId, 1);
      Alert.alert('Added', 'Added to cart.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not add to cart.');
    } finally {
      setAddingId(null);
    }
  };

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
      <FlatList
        data={items}
        keyExtractor={(item) => (item.product?._id ?? item._id).toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>♡</Text>
            </View>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptyText}>
              Save items you love and come back to them anytime.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)/shop')}
              activeOpacity={0.8}
            >
              <Text style={styles.browseBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const p = item.productId ?? item.product ?? item;
          const productId = p?._id;
          const imgId = p?.imageIds?.[0] ?? p?.images?.[0];
          const uri = imgId ? getProductImageUrl(imgId) : null;
          const originalPrice = p?.price ?? p?.originalPrice ?? p?.mrp;
          const salePrice = Math.round(p?.discountPrice ?? p?.edisonkartPrice ?? p?.price ?? 0);
          const hasDiscount = originalPrice && Math.round(originalPrice) > salePrice;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${p?.slug ?? p?._id}`)}
              >
                <View style={styles.imageWrap}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImage, styles.imagePlaceholder]}>
                      <Text style={styles.placeholderText}>📷</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => handleRemove(productId)}
                    disabled={removingId === productId}
                    activeOpacity={0.7}
                  >
                    {removingId === productId ? (
                      <ActivityIndicator color="#dc2626" size="small" />
                    ) : (
                      <Text style={styles.heartIcon}>♥</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{p?.name ?? p?.title ?? 'Product'}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.cardPrice}>₹{salePrice.toLocaleString('en-IN')}</Text>
                    {hasDiscount ? (
                      <Text style={styles.originalPrice}>₹{Math.round(originalPrice).toLocaleString('en-IN')}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cartBtn, addingId === productId && styles.cartBtnDisabled]}
                onPress={() => handleAddToCart(productId)}
                disabled={addingId === productId}
                activeOpacity={0.8}
              >
                {addingId === productId ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.cartBtnText}>Add to Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  listContent: { padding: 16, paddingBottom: 24 },
  columnWrapper: { justifyContent: 'space-between', gap: CARD_GAP },

  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: CARD_GAP,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 28 },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  heartIcon: { fontSize: 18, color: '#dc2626' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 13, color: '#334155', fontWeight: '500', marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  originalPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  cartBtn: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#F97316',
    borderRadius: 10,
    alignItems: 'center',
  },
  cartBtnDisabled: { opacity: 0.6 },
  cartBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 36, color: '#fca5a5' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    fontSize: 14,
  },
  browseBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
