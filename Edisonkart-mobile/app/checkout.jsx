import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import useCartStore from '../src/store/cartStore';
import { getProfile, addAddress } from '../src/services/user';
import { placeOrder } from '../src/services/order';
import { getProductImageUrl } from '../src/services/product';
import { applyCoupon, removeCoupon } from '../src/services/coupon';
import client from '../src/api/client';

const EMPTY_ADDR = { name: '', phone: '', street: '', city: '', state: '', pincode: '' };

export default function CheckoutScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const { items, total, fetchCart } = useCartStore();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [codEnabled, setCodEnabled] = useState(false);

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ ...EMPTY_ADDR });
  const [addrSaving, setAddrSaving] = useState(false);

  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayData, setRazorpayData] = useState(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const fetchProfileData = () => {
    getProfile()
      .then((res) => {
        const data = res?.data ?? res;
        const addrs = data?.addresses ?? [];
        setAddresses(addrs);
        if (addrs.length && !selectedAddressId) setSelectedAddressId(addrs[0]._id);
        if (addrs.length === 0) setShowAddrForm(true);
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    fetchCart();
    fetchProfileData();
    client.get('/settings/public').then(r => {
      const d = r.data?.data || r.data;
      if (d?.codEnabled) setCodEnabled(true);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleSaveAddress = async () => {
    const { name, phone, street, city, state, pincode } = addrForm;
    if (!street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      Alert.alert('Error', 'Please fill street, city, state and pincode.');
      return;
    }
    setAddrSaving(true);
    try {
      await addAddress({
        name: name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
      setShowAddrForm(false);
      setAddrForm({ ...EMPTY_ADDR });
      fetchProfileData();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save address.');
    } finally {
      setAddrSaving(false);
    }
  };

  const updateField = (field, value) => {
    setAddrForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await applyCoupon(couponCode.trim(), total);
      const data = result?.data ?? result;
      setCouponDiscount(data?.discount || 0);
      setCouponApplied(data?.code || couponCode.trim());
    } catch (e) {
      setCouponError(e?.message || 'Invalid coupon code');
      setCouponDiscount(0);
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const getRazorpayHTML = (key, orderId, amount) => `
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
var options = {
  key: '${key}',
  amount: ${amount * 100},
  currency: 'INR',
  name: 'EdisonKart',
  description: 'Order Payment',
  order_id: '${orderId}',
  theme: { color: '#F97316' },
  handler: function(res) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',data:res}));
  },
  modal: { ondismiss: function() { window.ReactNativeWebView.postMessage(JSON.stringify({type:'dismissed'})); } }
};
var rzp = new Razorpay(options);
rzp.on('payment.failed', function(res) {
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'failed',error:res.error}));
});
rzp.open();
</script>
</body>
</html>`;

  const handlePaymentMessage = async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      setShowPaymentWebView(false);
      setRazorpayData(null);

      if (msg.type === 'success') {
        try {
          await client.post('/orders/webhook', {
            razorpay_order_id: msg.data.razorpay_order_id,
            razorpay_payment_id: msg.data.razorpay_payment_id,
            razorpay_signature: msg.data.razorpay_signature,
          });
        } catch (_) {}
        await useCartStore.getState().clearCart();
        Alert.alert('Payment Successful', 'Your order has been placed and paid successfully.', [
          { text: 'OK', onPress: () => router.replace('/orders') },
        ]);
      } else if (msg.type === 'failed') {
        Alert.alert(
          'Payment Failed',
          msg.error?.description || 'Payment could not be completed. Please try again.'
        );
      } else if (msg.type === 'dismissed') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment. Your order is pending payment.');
      }
    } catch (_) {}
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select an address.');
      return;
    }
    setPlacing(true);
    try {
      if (paymentMethod === 'online') {
        const res = await placeOrder(
          { addressId: selectedAddressId, paymentMethod: 'razorpay' },
          token
        );
        const data = res?.data ?? res;
        setRazorpayData({
          orderId: data.razorpayOrderId,
          keyId: data.razorpayKeyId,
          amount: data.amount,
        });
        setShowPaymentWebView(true);
      } else {
        await placeOrder({ addressId: selectedAddressId, paymentMethod: 'cod' }, token);
        await useCartStore.getState().clearCart();
        Alert.alert('Order placed', 'Your COD order has been placed successfully.', [
          { text: 'OK', onPress: () => router.replace('/orders') },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some items before checkout.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn} activeOpacity={0.8}>
            <Text style={styles.emptyBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const shipping = 0;
  const grandTotal = total + shipping - couponDiscount;

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Step 1: Delivery Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          {addresses.map((addr) => {
            const selected = selectedAddressId === addr._id;
            return (
              <TouchableOpacity
                key={addr._id}
                style={[styles.addrCard, selected && styles.addrCardSelected]}
                onPress={() => setSelectedAddressId(addr._id)}
                activeOpacity={0.7}
              >
                <View style={styles.radioRow}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.addrInfo}>
                    {addr.name ? <Text style={styles.addrName}>{addr.name}</Text> : null}
                    <Text style={styles.addrText}>
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </Text>
                    {addr.phone ? <Text style={styles.addrPhone}>{addr.phone}</Text> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {showAddrForm ? (
            <View style={styles.addrForm}>
              <Text style={styles.formTitle}>
                {addresses.length === 0 ? 'Add a delivery address' : 'New Address'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={addrForm.name}
                onChangeText={(v) => updateField('name', v)}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={addrForm.phone}
                onChangeText={(v) => updateField('phone', v)}
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={styles.input}
                placeholder="Street"
                value={addrForm.street}
                onChangeText={(v) => updateField('street', v)}
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City"
                  value={addrForm.city}
                  onChangeText={(v) => updateField('city', v)}
                  placeholderTextColor="#94a3b8"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="State"
                  value={addrForm.state}
                  onChangeText={(v) => updateField('state', v)}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                value={addrForm.pincode}
                onChangeText={(v) => updateField('pincode', v)}
                keyboardType="number-pad"
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.formActions}>
                {addresses.length > 0 && (
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => setShowAddrForm(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.formCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.formSaveBtn, addrSaving && styles.disabledBtn]}
                  onPress={handleSaveAddress}
                  disabled={addrSaving}
                  activeOpacity={0.8}
                >
                  {addrSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.formSaveBtnText}>Save Address</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddrBtn}
              onPress={() => setShowAddrForm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.addAddrPlus}>+</Text>
              <Text style={styles.addAddrText}>Add New Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Order Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          {items.map((item, i) => {
            const p = item.productId ?? item.product ?? item;
            const imgId = p?.imageIds?.[0] ?? p?.images?.[0] ?? p?.image;
            const uri = imgId ? getProductImageUrl(imgId) : null;
            return (
              <View key={item._id || i} style={[styles.summaryItem, i < items.length - 1 && styles.summaryBorder]}>
                {uri ? (
                  <Image source={{ uri }} style={styles.summaryThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.summaryThumb, styles.thumbPlaceholder]}>
                    <Text style={styles.thumbPlaceholderIcon}>📦</Text>
                  </View>
                )}
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryName} numberOfLines={2}>
                    {p?.name ?? p?.title ?? item.title ?? 'Item'}
                  </Text>
                  <Text style={styles.summaryQty}>Qty: {item.quantity ?? 1}</Text>
                </View>
                <Text style={styles.summaryPrice}>
                  ₹{Math.round(item.priceSnapshot ?? p?.discountPrice ?? p?.price ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Step 3: Payment Method */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === 'online' && styles.paymentCardSelected]}
            onPress={() => setPaymentMethod('online')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, paymentMethod === 'online' && styles.radioSelected]}>
              {paymentMethod === 'online' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>💳  Online Payment</Text>
              <Text style={styles.paymentDesc}>UPI, Cards, Netbanking</Text>
            </View>
          </TouchableOpacity>

          {codEnabled && (
            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod('cod')}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, paymentMethod === 'cod' && styles.radioSelected]}>
                {paymentMethod === 'cod' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>💵  Cash on Delivery</Text>
                <Text style={styles.paymentDesc}>Pay when your order arrives</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{Math.round(total).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={[styles.priceValue, shipping === 0 && styles.freeShipping]}>
              {shipping > 0 ? `₹${shipping}` : 'Free'}
            </Text>
          </View>
          {couponApplied ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>🏷️ {couponApplied}</Text>
                <Text style={{ fontSize: 13, color: '#16a34a' }}>-₹{couponDiscount}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' }}
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={(v) => { setCouponCode(v.toUpperCase()); setCouponError(''); }}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={{ backgroundColor: couponLoading || !couponCode.trim() ? '#cbd5e1' : '#F97316', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' }}
                  onPress={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  activeOpacity={0.7}
                >
                  {couponLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{couponError}</Text> : null}
            </View>
          )}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Place Order Button */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, (placing || addresses.length === 0) && styles.disabledBtn]}
          onPress={handlePlaceOrder}
          disabled={placing || addresses.length === 0}
          activeOpacity={0.8}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay Payment WebView Modal */}
      <Modal
        visible={showPaymentWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentWebView(false);
          setRazorpayData(null);
        }}
      >
        <View style={styles.webviewContainer}>
          <View style={styles.webviewHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowPaymentWebView(false);
                setRazorpayData(null);
                Alert.alert('Payment Cancelled', 'You cancelled the payment. Your order is pending payment.');
              }}
              style={styles.webviewCloseBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.webviewCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.webviewTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {razorpayData ? (
            <WebView
              source={{ html: getRazorpayHTML(razorpayData.keyId, razorpayData.orderId, razorpayData.amount) }}
              onMessage={handlePaymentMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator size="large" color="#F97316" />
                  <Text style={styles.webviewLoadingText}>Loading payment...</Text>
                </View>
              )}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  emptyWrap: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  addrCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  addrCardSelected: { borderColor: '#F97316', backgroundColor: '#fff7ed' },
  radioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: '#F97316' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' },
  addrInfo: { flex: 1 },
  addrName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  addrText: { fontSize: 13, color: '#334155', lineHeight: 19 },
  addrPhone: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  addAddrBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#F97316',
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 6,
  },
  addAddrPlus: { fontSize: 18, color: '#F97316', fontWeight: '700' },
  addAddrText: { color: '#F97316', fontWeight: '600', fontSize: 14 },

  addrForm: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  formCancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  formCancelText: { color: '#64748b', fontWeight: '600' },
  formSaveBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
  },
  formSaveBtnText: { color: '#ffffff', fontWeight: '700' },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryBorder: { borderBottomWidth: 1, borderColor: '#f1f5f9' },
  summaryThumb: { width: 52, height: 52, borderRadius: 10 },
  thumbPlaceholder: { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  thumbPlaceholderIcon: { fontSize: 18 },
  summaryInfo: { flex: 1, marginHorizontal: 12 },
  summaryName: { fontSize: 14, color: '#334155', fontWeight: '500' },
  summaryQty: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  summaryPrice: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  paymentCardSelected: { borderColor: '#F97316', backgroundColor: '#fff7ed' },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  paymentDesc: { fontSize: 12, color: '#94a3b8', marginTop: 3 },

  priceCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: { fontSize: 14, color: '#64748b' },
  priceValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  freeShipping: { color: '#16a34a', fontWeight: '600' },
  priceDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#F97316' },

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  footerTotalValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  placeBtn: {
    flex: 1,
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },

  webviewContainer: { flex: 1, backgroundColor: '#ffffff' },
  webviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  webviewCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewCloseText: { fontSize: 18, color: '#334155', fontWeight: '600' },
  webviewTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webviewLoadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
});
