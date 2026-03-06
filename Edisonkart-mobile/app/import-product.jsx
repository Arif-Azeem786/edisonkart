import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { importFromUrl } from '../src/services/importProduct';
import { getProductImageUrl } from '../src/services/product';
import { API_BASE_URL } from '../src/config';

export default function ImportProductScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Enter a product URL.');
      return;
    }
    setLoading(true);
    setProduct(null);
    try {
      const res = await importFromUrl(trimmed);
      const data = res?.data ?? res?.product ?? res;
      if (data && (data._id || data.slug || data.title || data.name)) {
        setProduct(data);
      } else {
        Alert.alert('Import issue', 'Product was processed but returned incomplete data. Please try again.');
      }
    } catch (e) {
      const msg = e?.message || 'Could not import. Check the URL.';
      const isTimeout = msg.toLowerCase().includes('timeout') || e?.code === 'ECONNABORTED';
      const isNetwork = msg.toLowerCase().includes('network');
      let title = 'Import Failed';
      if (isTimeout) title = 'Timed Out';
      else if (isNetwork) title = 'Connection Error';
      Alert.alert(title, msg);
    } finally {
      setLoading(false);
    }
  };

  const imgId = product?.imageIds?.[0];
  const imgPath = product?.images?.[0];
  let imageUri = null;
  if (imgId) {
    imageUri = getProductImageUrl(imgId);
  } else if (imgPath?.startsWith('/api')) {
    imageUri = `${API_BASE_URL.replace(/\/api$/, '')}${imgPath}`;
  } else if (imgPath?.startsWith('http')) {
    imageUri = imgPath;
  }
  const originalPrice = product?.originalPrice ?? product?.price ?? product?.mrp;
  const salePrice = Math.round(product?.edisonkartPrice ?? product?.discountPrice ?? product?.price ?? 0);
  const hasDiscount = originalPrice && originalPrice > salePrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroSection}>
        <View style={styles.iconWrap}>
          <Text style={styles.heroIcon}>🔗</Text>
        </View>
        <Text style={styles.title}>Import Product</Text>
        <Text style={styles.subtitle}>
          Paste a product URL from Amazon, Flipkart, Myntra, or any supported store.
        </Text>
      </View>

      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <Text style={styles.linkIcon}>🌐</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.example.com/product..."
            value={url}
            onChangeText={setUrl}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => setUrl('')} activeOpacity={0.7} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.importBtn, loading && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.importBtnText}>Importing...</Text>
            </View>
          ) : (
            <Text style={styles.importBtnText}>Import Product</Text>
          )}
        </TouchableOpacity>
      </View>

      {product && (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.successDot} />
            <Text style={styles.previewHeaderText}>Product Imported</Text>
          </View>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
          )}

          <Text style={styles.previewName}>{product.title || product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.previewPrice}>₹{salePrice.toLocaleString('en-IN')}</Text>
            {hasDiscount && (
              <Text style={styles.previewOriginal}>₹{Math.round(originalPrice).toLocaleString('en-IN')}</Text>
            )}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/product/${product.slug ?? product._id}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewBtnText}>View Product</Text>
            <Text style={styles.viewBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },

  heroSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 32 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  heroIcon: { fontSize: 30 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  inputCard: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  linkIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0f172a', paddingVertical: 14 },
  clearBtn: { padding: 6 },
  clearIcon: { fontSize: 14, color: '#94a3b8', fontWeight: '700' },
  importBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importBtnDisabled: { opacity: 0.7 },
  importBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  previewCard: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  previewHeaderText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  previewImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
  },
  previewName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
    lineHeight: 24,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  previewPrice: { fontSize: 22, fontWeight: '700', color: '#F97316' },
  previewOriginal: {
    fontSize: 15,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  viewBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  viewBtnArrow: { color: '#ffffff', fontSize: 18 },
});
