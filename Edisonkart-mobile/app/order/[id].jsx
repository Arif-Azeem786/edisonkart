import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getOrder, cancelOrder, requestReturn } from '../../src/services/order';
import { getProductImageUrl } from '../../src/services/product';
import { getPaymentStatus, retryPayment } from '../../src/services/payment';

const TIMELINE_STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];
const STATUS_MAP = {
  Pending: 0,
  Placed: 0,
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: -1,
  Returned: -2,
};

function PulsingDot({ color }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={tl.pulseWrap}>
      <Animated.View
        style={[tl.pulseRing, { backgroundColor: color + '30', transform: [{ scale: anim }] }]}
      />
      <View style={[tl.dot, { backgroundColor: color }]} />
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [retryingPayment, setRetryingPayment] = useState(false);

  const fetchOrder = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getOrder(id).then((res) => res?.data ?? res),
      getPaymentStatus(id).catch(() => null),
    ])
      .then(([orderData, paymentData]) => {
        setOrder(orderData);
        setPaymentInfo(paymentData);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  const handleRetryPayment = async () => {
    setRetryingPayment(true);
    try {
      const result = await retryPayment(id);
      if (result?.paymentUrl) {
        Alert.alert('Redirecting', 'Opening payment gateway...');
      } else {
        Alert.alert('Success', 'Payment retry initiated successfully.');
      }
      fetchOrder();
    } catch (e) {
      Alert.alert('Payment Failed', e?.message || 'Could not retry payment. Please try again.');
    } finally {
      setRetryingPayment(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    try {
      await cancelOrder(id, cancelReason.trim());
      Alert.alert('Cancelled', 'Your order has been cancelled.');
      setShowCancelForm(false);
      setCancelReason('');
      fetchOrder();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for return.');
      return;
    }
    setReturning(true);
    try {
      await requestReturn(id, 'return', returnReason.trim());
      Alert.alert('Return Requested', 'Your return request has been submitted.');
      setShowReturnForm(false);
      setReturnReason('');
      fetchOrder();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not request return.');
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorTitle}>Order not found</Text>
          <Text style={styles.errorText}>We couldn't find this order. It may have been removed.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const items = order.items ?? order.orderItems ?? [];
  const status = order.status || 'Pending';
  const statusIndex = STATUS_MAP[status] ?? 0;
  const canCancel = status === 'Pending' || status === 'Processing';
  const canReturn = status === 'Delivered';
  const subtotal = items.reduce((sum, item) => sum + ((item.priceSnapshot ?? item.price ?? 0) * (item.quantity ?? 1)), 0);
  const totalAmount = order.totalAmount ?? order.total ?? 0;
  const shipping = totalAmount - subtotal;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Order Info Card */}
      <View style={styles.card}>
        <View style={styles.orderInfoRow}>
          <View>
            <Text style={styles.label}>Order Number</Text>
            <Text style={styles.orderNum}>#{order.orderId || order.orderNumber || order._id}</Text>
          </View>
          <View style={styles.orderInfoRight}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.dateText}>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </View>
        {order.paymentMethod && (
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        {statusIndex === -1 ? (
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledIcon}>✕</Text>
            <Text style={styles.cancelledText}>Order Cancelled</Text>
          </View>
        ) : statusIndex === -2 ? (
          <View style={styles.returnedBadge}>
            <Text style={styles.returnedIcon}>↩</Text>
            <Text style={styles.returnedText}>Order Returned</Text>
          </View>
        ) : (
          <View style={tl.container}>
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = i < statusIndex;
              const isCurrent = i === statusIndex;
              const isLast = i === TIMELINE_STEPS.length - 1;
              return (
                <View key={step} style={tl.step}>
                  <View style={tl.nodeCol}>
                    {isCurrent ? (
                      <PulsingDot color="#F97316" />
                    ) : (
                      <View
                        style={[
                          tl.node,
                          isCompleted && tl.nodeCompleted,
                          !isCompleted && !isCurrent && tl.nodeInactive,
                        ]}
                      >
                        {isCompleted && <Text style={tl.check}>✓</Text>}
                      </View>
                    )}
                    {!isLast && (
                      <View style={[tl.line, (isCompleted) && tl.lineCompleted]} />
                    )}
                  </View>
                  <View style={tl.labelWrap}>
                    <Text
                      style={[
                        tl.label,
                        isCompleted && tl.labelCompleted,
                        isCurrent && tl.labelCurrent,
                      ]}
                    >
                      {step}
                    </Text>
                    {isCurrent && <Text style={tl.currentTag}>Current</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Items List */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items ({items.length})</Text>
        {items.map((item, i) => {
          const p = item.productId ?? item.product ?? item;
          const imgId = p?.imageIds?.[0] ?? p?.images?.[0];
          const uri = imgId ? getProductImageUrl(imgId) : null;
          return (
            <View key={item._id || i} style={[styles.itemRow, i < items.length - 1 && styles.itemBorder]}>
              {uri ? (
                <Image source={{ uri }} style={styles.itemThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                  <Text style={styles.placeholderIcon}>📦</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.nameSnapshot ?? p?.name ?? p?.title ?? 'Item'}
                </Text>
                <Text style={styles.itemQty}>Qty: {item.quantity ?? 1}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{Math.round(item.priceSnapshot ?? item.price ?? 0).toLocaleString('en-IN')}</Text>
            </View>
          );
        })}
      </View>

      {/* Price Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Price Summary</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>₹{Math.round(subtotal).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Shipping</Text>
          <Text style={styles.priceValue}>{shipping > 0 ? `₹${Math.round(shipping).toLocaleString('en-IN')}` : 'Free'}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{Math.round(totalAmount).toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Shipping Address */}
      {(order.addressSnapshot || order.shippingAddress) && (() => {
        const addr = order.addressSnapshot || order.shippingAddress;
        const line = addr.addressLine1 || addr.street || '';
        const line2 = addr.addressLine2 ? `, ${addr.addressLine2}` : '';
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            {addr.name && <Text style={styles.addressName}>{addr.name}</Text>}
            <View style={styles.addressContent}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText}>
                {line}{line2}, {addr.city}, {addr.state} - {addr.pincode}
              </Text>
            </View>
            {addr.phone && <Text style={styles.addressPhone}>📞 {addr.phone}</Text>}
          </View>
        );
      })()}

      {/* Payment Status */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Status</Text>
        <View style={styles.paymentStatusRow}>
          <Text style={styles.paymentStatusLabel}>Method</Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'online' ? 'Online Payment' : (order.paymentMethod || '—')}
            </Text>
          </View>
        </View>
        <View style={styles.paymentStatusRow}>
          <Text style={styles.paymentStatusLabel}>Status</Text>
          {(() => {
            const ps = paymentInfo?.status ?? order.paymentStatus ?? 'PENDING';
            const upper = ps.toUpperCase();
            const badgeStyle =
              upper === 'PAID' ? styles.psBadgePaid :
              upper === 'FAILED' ? styles.psBadgeFailed :
              styles.psBadgePending;
            const textStyle =
              upper === 'PAID' ? styles.psBadgePaidText :
              upper === 'FAILED' ? styles.psBadgeFailedText :
              styles.psBadgePendingText;
            return (
              <View style={badgeStyle}>
                <Text style={textStyle}>{upper}</Text>
              </View>
            );
          })()}
        </View>
        {paymentInfo?.transactionId && (
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatusLabel}>Transaction ID</Text>
            <Text style={styles.transactionId}>{paymentInfo.transactionId}</Text>
          </View>
        )}
        {paymentInfo?.paidAt && (
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatusLabel}>Paid On</Text>
            <Text style={styles.transactionId}>
              {new Date(paymentInfo.paidAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        {(paymentInfo?.status ?? order.paymentStatus ?? '').toUpperCase() === 'FAILED' && (
          <TouchableOpacity
            style={[styles.retryBtn, retryingPayment && styles.disabledBtn]}
            onPress={handleRetryPayment}
            disabled={retryingPayment}
            activeOpacity={0.8}
          >
            {retryingPayment ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.retryBtnText}>Retry Payment</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Order */}
      {canCancel && (
        <View style={styles.card}>
          {showCancelForm ? (
            <View>
              <Text style={styles.actionFormTitle}>Reason for cancellation</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Tell us why you want to cancel..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setShowCancelForm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerBtn, cancelling && styles.disabledBtn]}
                  onPress={handleCancel}
                  disabled={cancelling}
                  activeOpacity={0.8}
                >
                  {cancelling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.dangerBtnText}>Confirm Cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dangerOutlineBtn}
              onPress={() => setShowCancelForm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerOutlineIcon}>✕</Text>
              <Text style={styles.dangerOutlineText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Request Return */}
      {canReturn && (
        <View style={styles.card}>
          {showReturnForm ? (
            <View>
              <Text style={styles.actionFormTitle}>Reason for return</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Tell us why you want to return..."
                value={returnReason}
                onChangeText={setReturnReason}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setShowReturnForm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerBtn, returning && styles.disabledBtn]}
                  onPress={handleReturn}
                  disabled={returning}
                  activeOpacity={0.8}
                >
                  {returning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.dangerBtnText}>Submit Return</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dangerOutlineBtn}
              onPress={() => setShowReturnForm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerOutlineIcon}>↩</Text>
              <Text style={styles.dangerOutlineText}>Request Return</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const tl = StyleSheet.create({
  container: { marginTop: 8, paddingLeft: 4 },
  step: { flexDirection: 'row', minHeight: 64 },
  nodeCol: { alignItems: 'center', width: 32 },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCompleted: { backgroundColor: '#16a34a' },
  nodeInactive: { backgroundColor: '#e2e8f0' },
  check: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  lineCompleted: { backgroundColor: '#16a34a' },
  pulseWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  labelWrap: { marginLeft: 14, paddingBottom: 20, justifyContent: 'center' },
  label: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  labelCompleted: { color: '#16a34a', fontWeight: '600' },
  labelCurrent: { color: '#F97316', fontWeight: '700' },
  currentTag: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },

  errorWrap: { alignItems: 'center', padding: 32 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  backBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  backBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },

  orderInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderInfoRight: { alignItems: 'flex-end' },
  orderNum: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  dateText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  paymentLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  paymentBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  paymentBadgeText: { fontSize: 13, color: '#334155', fontWeight: '600' },

  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  cancelledIcon: { fontSize: 14, color: '#dc2626', fontWeight: '700' },
  cancelledText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  returnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  returnedIcon: { fontSize: 16, color: '#F97316' },
  returnedText: { color: '#F97316', fontWeight: '700', fontSize: 14 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemBorder: { borderBottomWidth: 1, borderColor: '#f1f5f9' },
  itemThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f1f5f9' },
  itemThumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 20 },
  itemInfo: { flex: 1, marginHorizontal: 14 },
  itemTitle: { fontSize: 14, color: '#334155', fontWeight: '500', marginBottom: 4 },
  itemQty: { fontSize: 12, color: '#94a3b8' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: { fontSize: 14, color: '#64748b' },
  priceValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  priceDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#F97316' },

  addressName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  addressContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressIcon: { fontSize: 16, marginTop: 2 },
  addressText: { fontSize: 14, color: '#334155', lineHeight: 22, flex: 1 },
  addressPhone: { fontSize: 13, color: '#64748b', marginTop: 6, marginLeft: 26 },

  actionFormTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  formCancelBtn: { paddingVertical: 12, paddingHorizontal: 18 },
  formCancelText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  dangerBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  dangerOutlineBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerOutlineIcon: { fontSize: 14, color: '#dc2626', fontWeight: '700' },
  dangerOutlineText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.6 },

  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentStatusLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  psBadgePaid: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  psBadgePaidText: { fontSize: 13, color: '#16a34a', fontWeight: '700' },
  psBadgePending: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  psBadgePendingText: { fontSize: 13, color: '#d97706', fontWeight: '700' },
  psBadgeFailed: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  psBadgeFailedText: { fontSize: 13, color: '#dc2626', fontWeight: '700' },
  transactionId: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  retryBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  retryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
