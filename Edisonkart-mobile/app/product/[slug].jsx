import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductBySlug, getProductImageUrl, getProducts } from '../../src/services/product';
import { toggleWishlist, getWishlist } from '../../src/services/wishlist';
import { getProductReviews, createReview } from '../../src/services/review';
import { getQuestions, askQuestion } from '../../src/services/qa';
import useCartStore from '../../src/store/cartStore';
import useAuthStore from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_VIEWED_KEY = 'ek_recently_viewed';
const MAX_RECENTLY_VIEWED = 10;

const getRecentlyViewed = async () => {
  try {
    const json = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

const saveToRecentlyViewed = async (product) => {
  try {
    const list = await getRecentlyViewed();
    const filtered = list.filter((p) => p._id !== product._id);
    const entry = {
      _id: product._id,
      title: product.name || product.title,
      slug: product.slug,
      edisonkartPrice: product.discountPrice ?? product.edisonkartPrice ?? product.price ?? 0,
      imageIds: (product.imageIds ?? product.images ?? []).slice(0, 1),
      rating: product.averageRating ?? product.rating,
    };
    const updated = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [showQA, setShowQA] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    getProductBySlug(slug)
      .then((res) => {
        const data = res?.data ?? res;
        setProduct(data);
        if (data?._id) {
          loadReviews(data._id);
          loadWishlistStatus(data._id);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Initialize variant attributes when product loads
  useEffect(() => {
    if (product?.hasVariants && product.variantAttributes?.length > 0) {
      const initial = {};
      product.variantAttributes.forEach((attr) => {
        initial[attr.name] = attr.values[0];
      });
      setSelectedAttributes(initial);
    }
  }, [product?.hasVariants]);

  // Resolve selected variant whenever attributes change
  useEffect(() => {
    if (product?.hasVariants && product.variants?.length > 0) {
      const variant = product.variants.find((v) => {
        const vAttrs = v.attributes instanceof Map ? Object.fromEntries(v.attributes) : (v.attributes || {});
        return Object.entries(selectedAttributes).every(([key, value]) => vAttrs[key] === value);
      });
      setSelectedVariant(variant || null);
      setActiveImageIndex(0);
      galleryRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedAttributes, product]);

  useEffect(() => {
    if (!product?._id) return;

    saveToRecentlyViewed(product);

    getRecentlyViewed().then(async (list) => {
      const others = list.filter((p) => p._id !== product._id);
      const results = await Promise.allSettled(
        others.map((p) => getProductBySlug(p.slug || p._id))
      );
      const valid = others.filter((_, i) => results[i].status === 'fulfilled' && results[i].value);
      setRecentlyViewed(valid);
      if (valid.length !== others.length) {
        const currentEntry = {
          _id: product._id,
          title: product.title || product.name,
          slug: product.slug,
          edisonkartPrice: product.edisonkartPrice ?? product.discountPrice ?? product.price ?? 0,
          imageIds: (product.imageIds ?? []).slice(0, 1),
          rating: product.rating,
        };
        await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([currentEntry, ...valid].slice(0, MAX_RECENTLY_VIEWED)));
      }
    });

    const catId = product.categoryId ?? product.category;
    if (catId) {
      getProducts({ category: catId, limit: 8 })
        .then((res) => {
          const items = res?.products ?? res?.data ?? res ?? [];
          const list = Array.isArray(items) ? items : [];
          setSimilarProducts(list.filter((p) => p._id !== product._id).slice(0, 8));
        })
        .catch(() => setSimilarProducts([]));
    }
  }, [product?._id]);

  const loadReviews = (productId) => {
    setReviewsLoading(true);
    getProductReviews(productId)
      .then((res) => {
        const data = res?.reviews ?? res?.data ?? res ?? [];
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  };

  const loadWishlistStatus = (productId) => {
    if (!isAuthenticated) return;
    getWishlist()
      .then((res) => {
        const items = res?.products ?? res?.items ?? res?.data ?? res ?? [];
        const list = Array.isArray(items) ? items : [];
        const found = list.some(
          (w) => (w._id ?? w.product?._id ?? w.product)?.toString() === productId?.toString()
        );
        setWishlisted(found);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (product?._id) {
      getQuestions(product._id).then(res => setQuestions(res?.data ?? res ?? [])).catch(() => {});
    }
  }, [product?._id]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please login to add to wishlist.');
      return;
    }
    if (!product?._id) return;
    try {
      await toggleWishlist(product._id);
      setWishlisted((prev) => !prev);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not update wishlist.');
    }
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name || product.title} on EdisonKart!\nhttps://edisonkart.com/product/${product.slug || product._id}`,
      });
    } catch (_) {}
  };

  const handleAddToCart = async () => {
    if (!product?._id) return;
    try {
      const variantId = selectedVariant?._id || undefined;
      await addItem(product._id, 1, variantId);
      Alert.alert('Added', 'Added to cart.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not add to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!product?._id) return;
    try {
      const variantId = selectedVariant?._id || undefined;
      await addItem(product._id, 1, variantId);
      router.push('/checkout');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not add to cart.');
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !product?._id) return;
    try {
      await askQuestion(product._id, newQuestion.trim());
      setNewQuestion('');
      const res = await getQuestions(product._id);
      setQuestions(res?.data ?? res ?? []);
    } catch {}
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please login to write a review.');
      return;
    }
    setSubmittingReview(true);
    try {
      await createReview({
        productId: product._id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      loadReviews(product._id);
      Alert.alert('Success', 'Review submitted!');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const onGalleryScroll = useCallback((e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }
  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>📦</Text>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorSub}>The product you're looking for doesn't exist.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const variantImageIds = selectedVariant?.imageIds?.length > 0 ? selectedVariant.imageIds : null;
  const imageIds = variantImageIds ?? product.imageIds ?? product.images ?? [];
  const totalImages = imageIds.length || 1;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;
  const variantStock = selectedVariant ? selectedVariant.stock : null;
  const inStock = (variantStock ?? product.stock ?? 1) > 0;
  const rawPrice = selectedVariant
    ? (selectedVariant.discountPrice ?? selectedVariant.price ?? product.discountPrice ?? product.price ?? 0)
    : (product.discountPrice ?? product.edisonkartPrice ?? product.price ?? 0);
  const currentPrice = Math.round(rawPrice);
  const rawOriginal = selectedVariant
    ? (selectedVariant.price ?? product.price ?? null)
    : (product.price ?? product.originalPrice ?? null);
  const originalPrice = rawOriginal ? Math.round(rawOriginal) : null;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Image Gallery ── */}
      <View style={styles.galleryWrap}>
        <FlatList
          ref={galleryRef}
          data={imageIds.length ? imageIds : [null]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onGalleryScroll}
          scrollEventThrottle={16}
          keyExtractor={(item, i) => (item || `placeholder-${i}`)}
          renderItem={({ item }) => (
            <View style={styles.gallerySlide}>
              {item ? (
                <Image
                  source={{ uri: getProductImageUrl(item) }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.galleryImage, styles.placeholder]}>
                  <Text style={styles.placeholderIcon}>📷</Text>
                </View>
              )}
            </View>
          )}
        />

        {/* Image counter overlay */}
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {activeImageIndex + 1}/{totalImages}
          </Text>
        </View>

        {/* Dot indicators */}
        {imageIds.length > 1 && (
          <View style={styles.dotsRow}>
            {imageIds.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeImageIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Floating action buttons */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.floatingBtn, wishlisted && styles.floatingBtnActive]}
            onPress={handleToggleWishlist}
            activeOpacity={0.7}
          >
            <Text style={[styles.heartIcon, wishlisted && styles.heartIconActive]}>
              {wishlisted ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare} activeOpacity={0.7}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Product Info Card ── */}
      <View style={styles.infoCard}>
        {/* Brand badge */}
        {product.brand && (
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>{product.brand}</Text>
          </View>
        )}

        {/* Product title */}
        <Text style={styles.title}>{product.name || product.title}</Text>

        {/* Rating row */}
        {(product.averageRating != null || product.rating != null || avgRating) && (
          <View style={styles.ratingRow}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text
                  key={s}
                  style={[
                    styles.ratingStar,
                    s <= Math.round(Number(avgRating ?? product.averageRating ?? product.rating))
                      ? styles.ratingStarFilled
                      : styles.ratingStarEmpty,
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
            <Text style={styles.ratingValue}>{avgRating ?? product.averageRating ?? product.rating}</Text>
            {reviews.length > 0 && (
              <Text style={styles.reviewCount}>({reviews.length} reviews)</Text>
            )}
          </View>
        )}

        {/* Price section */}
        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>₹{currentPrice.toLocaleString('en-IN')}</Text>
          {originalPrice && originalPrice > currentPrice && (
            <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
          )}
          {discountPercent && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% off</Text>
            </View>
          )}
        </View>

        {/* Variant Selectors */}
        {product.hasVariants && product.variantAttributes?.length > 0 && (
          <View style={styles.variantSection}>
            {product.variantAttributes.map((attr) => (
              <View key={attr.name} style={styles.variantGroup}>
                <Text style={styles.variantLabel}>
                  {attr.name}: <Text style={styles.variantValue}>{selectedAttributes[attr.name]}</Text>
                </Text>
                <View style={styles.variantOptions}>
                  {attr.values.map((value) => {
                    const isSelected = selectedAttributes[attr.name] === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.variantBtn, isSelected && styles.variantBtnSelected]}
                        onPress={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: value })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.variantBtnText, isSelected && styles.variantBtnTextSelected]}>
                          {value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stock status */}
        <View style={styles.stockRow}>
          <View style={[styles.stockPill, inStock ? styles.stockPillIn : styles.stockPillOut]}>
            <Text style={[styles.stockPillText, inStock ? styles.stockTextIn : styles.stockTextOut]}>
              {inStock ? '● In Stock' : '● Out of Stock'}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.addToCartBtn, !inStock && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={!inStock}
            activeOpacity={0.7}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buyNowBtn, !inStock && styles.disabledBtn]}
            onPress={handleBuyNow}
            disabled={!inStock}
            activeOpacity={0.7}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Description Card ── */}
      {product.description && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {typeof product.description === 'string'
              ? product.description.replace(/<[^>]*>/g, ' ').trim()
              : ''}
          </Text>
        </View>
      )}

      {/* ── Similar Products Section ── */}
      {similarProducts.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>✨ Similar Products</Text>
          <FlatList
            data={similarProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item }) => {
              const img = (item.imageIds ?? item.images ?? [])[0];
              const price = Math.round(item.discountPrice ?? item.edisonkartPrice ?? item.price ?? 0);
              const stars = Math.round(Number(item.averageRating ?? item.rating) || 0);
              return (
                <TouchableOpacity
                  style={styles.miniCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/product/${item.slug || item._id}`)}
                >
                  {img ? (
                    <Image
                      source={{ uri: getProductImageUrl(img) }}
                      style={styles.miniCardImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.miniCardImage, styles.miniCardPlaceholder]}>
                      <Text style={{ fontSize: 24, opacity: 0.3 }}>📷</Text>
                    </View>
                  )}
                  <View style={styles.miniCardBody}>
                    <Text style={styles.miniCardName} numberOfLines={2}>{item.name || item.title}</Text>
                    <View style={styles.miniStarsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Text key={s} style={{ fontSize: 10, color: s <= stars ? '#f59e0b' : '#e2e8f0' }}>★</Text>
                      ))}
                    </View>
                    <Text style={styles.miniCardPrice}>₹{price.toLocaleString('en-IN')}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Recently Viewed Section ── */}
      {recentlyViewed.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🕐 Recently Viewed</Text>
          <FlatList
            data={recentlyViewed}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.hListContent}
            renderItem={({ item }) => {
              const img = (item.imageIds ?? item.images ?? [])[0];
              const price = Math.round(item.edisonkartPrice ?? item.price ?? 0);
              return (
                <TouchableOpacity
                  style={styles.miniCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/product/${item.slug || item._id}`)}
                >
                  {img ? (
                    <Image
                      source={{ uri: getProductImageUrl(img) }}
                      style={styles.miniCardImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.miniCardImage, styles.miniCardPlaceholder]}>
                      <Text style={{ fontSize: 24, opacity: 0.3 }}>📷</Text>
                    </View>
                  )}
                  <View style={styles.miniCardBody}>
                    <Text style={styles.miniCardName} numberOfLines={2}>{item.title || item.name}</Text>
                    <Text style={styles.miniCardPrice}>₹{price.toLocaleString('en-IN')}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Reviews Section ── */}
      <View style={styles.sectionCard}>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}
            </Text>
            {avgRating && (
              <View style={styles.avgRatingRow}>
                <Text style={styles.avgRatingBig}>{avgRating}</Text>
                <Text style={styles.avgRatingStar}>★</Text>
                <Text style={styles.avgRatingLabel}>average</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.writeReviewBtn}
            onPress={() => setShowReviewForm(!showReviewForm)}
            activeOpacity={0.7}
          >
            <Text style={styles.writeReviewText}>
              {showReviewForm ? 'Cancel' : '✎ Write Review'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Review form */}
        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formLabel}>Your Rating</Text>
            <View style={styles.starSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} activeOpacity={0.6}>
                  <Text style={[styles.starBtn, star <= reviewRating && styles.starBtnActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, submittingReview && styles.disabledBtn]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
              activeOpacity={0.7}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitReviewText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Review list */}
        {reviewsLoading ? (
          <ActivityIndicator color="#F97316" style={{ marginTop: 20 }} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyReviews}>
            <Text style={styles.emptyReviewsIcon}>💬</Text>
            <Text style={styles.emptyReviewsText}>No reviews yet. Be the first!</Text>
          </View>
        ) : (
          reviews.map((review, i) => (
            <View key={review._id || i} style={styles.reviewCard}>
              <View style={styles.reviewCardTop}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(review.user?.name || review.userName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewerName}>
                    {review.user?.name || review.userName || 'User'}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.reviewStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Text
                    key={s}
                    style={[
                      styles.reviewStar,
                      s <= (review.rating || 0) && styles.reviewStarFilled,
                    ]}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewComment}>
                {review.comment || review.text || ''}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Q&A Section ── */}
      <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <TouchableOpacity onPress={() => setShowQA(!showQA)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>Q&A ({questions.length})</Text>
          <Text style={{ fontSize: 18, color: '#94a3b8' }}>{showQA ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showQA && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' }}
                placeholder="Ask a question..."
                value={newQuestion}
                onChangeText={setNewQuestion}
                maxLength={500}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                onPress={handleAskQuestion}
                disabled={!newQuestion.trim()}
                style={{ backgroundColor: newQuestion.trim() ? '#F97316' : '#cbd5e1', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Ask</Text>
              </TouchableOpacity>
            </View>

            {questions.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 }}>No questions yet. Be the first to ask!</Text>
            ) : (
              questions.map((q) => (
                <View key={q._id} style={{ borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 12, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Text style={{ fontWeight: '700', color: '#F97316', fontSize: 14 }}>Q:</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a' }}>{q.text}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {q.userId?.name || 'User'} • {new Date(q.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {(q.answers || []).map((a) => (
                    <View key={a._id} style={{ marginLeft: 20, marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderColor: '#F9731640' }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Text style={{ fontWeight: '700', color: '#16a34a', fontSize: 14 }}>A:</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: '#334155' }}>{a.text}</Text>
                          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {a.userId?.name || 'User'} {a.userId?.role === 'ADMIN' ? '(EdisonKart)' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 32 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  errorSub: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  goBackBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F97316',
  },
  goBackText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  /* Gallery */
  galleryWrap: { backgroundColor: '#ffffff', position: 'relative' },
  gallerySlide: { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: '#ffffff' },
  galleryImage: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 48, opacity: 0.4 },
  imageCounter: {
    position: 'absolute',
    bottom: 52,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 24,
  },
  imageCounterText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#F97316', width: 24, height: 8, borderRadius: 4 },
  topActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  floatingBtnActive: { backgroundColor: '#fff1f2' },
  heartIcon: { fontSize: 22, color: '#64748b' },
  heartIconActive: { color: '#dc2626' },
  shareIcon: { fontSize: 20, color: '#0f172a' },

  /* Info Card */
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    marginBottom: 10,
  },
  brandText: { color: '#F97316', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 10, lineHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 6 },
  starsRow: { flexDirection: 'row', gap: 2 },
  ratingStar: { fontSize: 16 },
  ratingStarFilled: { color: '#f59e0b' },
  ratingStarEmpty: { color: '#e2e8f0' },
  ratingValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  reviewCount: { fontSize: 14, color: '#64748b' },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  currentPrice: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 24,
  },
  discountText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },
  /* Variants */
  variantSection: { marginBottom: 16 },
  variantGroup: { marginBottom: 12 },
  variantLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  variantValue: { color: '#0f172a' },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  variantBtnSelected: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  variantBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  variantBtnTextSelected: { color: '#F97316' },

  stockRow: { marginBottom: 20 },
  stockPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
  },
  stockPillIn: { backgroundColor: '#dcfce7' },
  stockPillOut: { backgroundColor: '#fee2e2' },
  stockPillText: { fontSize: 13, fontWeight: '600' },
  stockTextIn: { color: '#16a34a' },
  stockTextOut: { color: '#dc2626' },
  actionRow: { flexDirection: 'row', gap: 12 },
  addToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: { color: '#F97316', fontWeight: '700', fontSize: 15 },
  buyNowBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.4 },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24, marginTop: 12 },

  /* Reviews */
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avgRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  avgRatingBig: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  avgRatingStar: { fontSize: 18, color: '#f59e0b' },
  avgRatingLabel: { fontSize: 13, color: '#94a3b8', marginLeft: 2 },
  writeReviewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  writeReviewText: { color: '#F97316', fontWeight: '700', fontSize: 13 },
  reviewForm: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 10 },
  starSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  starBtn: { fontSize: 32, color: '#e2e8f0' },
  starBtnActive: { color: '#f59e0b' },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 14,
    color: '#0f172a',
  },
  submitReviewBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitReviewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyReviews: { alignItems: 'center', paddingVertical: 32 },
  emptyReviewsIcon: { fontSize: 36, marginBottom: 8 },
  emptyReviewsText: { color: '#94a3b8', fontSize: 15 },
  reviewCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  reviewMeta: { flex: 1 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  reviewDate: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  reviewStarsRow: { flexDirection: 'row', marginBottom: 8, gap: 2 },
  reviewStar: { fontSize: 14, color: '#e2e8f0' },
  reviewStarFilled: { color: '#f59e0b' },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },

  /* Horizontal product lists */
  hListContent: { paddingTop: 14, gap: 12 },
  miniCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  miniCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8fafc',
  },
  miniCardPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardBody: {
    padding: 10,
  },
  miniCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: 4,
  },
  miniStarsRow: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 4,
  },
  miniCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316',
  },
});
