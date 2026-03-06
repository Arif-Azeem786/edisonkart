import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import useCartStore from '../../src/store/cartStore';
import { getProductImageUrl } from '../../src/services/product';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, itemCount, isLoading, fetchCart, removeItem, updateItem } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>
            Looks like you haven't added anything to your cart yet.
          </Text>
          <TouchableOpacity
            style={styles.startShoppingBtn}
            onPress={() => router.push('/(tabs)/shop')}
            activeOpacity={0.85}
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const product = item.productId ?? item.product ?? item;
    const imgId = product?.imageIds?.[0] ?? product?.images?.[0];
    const uri = imgId ? getProductImageUrl(imgId) : null;
    const unitPrice = Math.round(item.priceSnapshot ?? product?.discountPrice ?? product?.price ?? 0);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemImageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImage, styles.placeholder]}>
              <Text style={styles.placeholderIcon}>📦</Text>
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {product?.name ?? product?.title ?? 'Product'}
          </Text>
          {item.variant && (
            <Text style={styles.itemVariant}>{item.variant}</Text>
          )}
          <Text style={styles.itemPrice}>₹{unitPrice.toLocaleString('en-IN')}</Text>

          <View style={styles.itemActions}>
            <View style={styles.quantityStepper}>
              <TouchableOpacity
                onPress={() => updateItem(item._id, Math.max(1, (item.quantity || 1) - 1))}
                style={styles.stepperBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepperCount}>
                <Text style={styles.stepperCountText}>{item.quantity ?? 1}</Text>
              </View>
              <TouchableOpacity
                onPress={() => updateItem(item._id, (item.quantity || 1) + 1)}
                style={styles.stepperBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => removeItem(item._id)}
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.removeIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Subtotal ({itemCount} items)</Text>
          <Text style={styles.footerTotal}>₹{Math.round(total ?? 0).toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutArrow}>→</Text>
        </TouchableOpacity>
      </View>
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

  emptyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  startShoppingBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  startShoppingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  list: {
    padding: 16,
    paddingBottom: 160,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  itemImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.4,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F97316',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  stepperCount: {
    paddingHorizontal: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  stepperCountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 16,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  footerLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  footerTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  checkoutBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
