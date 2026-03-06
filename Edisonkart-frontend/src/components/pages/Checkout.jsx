import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
    MapPin,
    CreditCard,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Plus,
    Truck,
    Shield
} from 'lucide-react'
import { Button } from '../ui/button'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { placeOrder } from '../../services/order'
import { getProductImageUrl } from '../ui/imageUtils'
import { openRazorpayCheckout } from '../../utils/razorpayUtils.js'
import { useToast } from '../ui/use-toast'
import { getPublicSettings } from '../../services/settings'


const steps = [
    { id: 'shipping', label: 'Shipping', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'confirmation', label: 'Confirmation', icon: CheckCircle },
]

const Checkout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { items: cartItems, total: cartTotal, clearCart, fetchCart } = useCartStore()
    const { user, token } = useAuthStore()
    const { toast } = useToast()
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [isPlacing, setIsPlacing] = useState(false)
    const [orderResult, setOrderResult] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('online')
    const [codEnabled, setCodEnabled] = useState(false)

    useEffect(() => {
        getPublicSettings().then(s => {
            if (s?.codEnabled) setCodEnabled(true);
        }).catch(() => {});
    }, []);

    // Buy Now mode — product passed via navigation state
    const buyNowData = location.state?.buyNow || null
    const couponFromCart = location.state?.couponCode || null
    const couponDiscountFromCart = Number(location.state?.couponDiscount) || 0

    const addresses = user?.addresses || []
    const addressesLoading = false

    useEffect(() => {
        if (!buyNowData) {
            fetchCart()
        }
    }, [fetchCart, buyNowData])

    // Build items and totals depending on mode
    const items = buyNowData
        ? [{
            _id: 'buynow',
            productId: buyNowData.productId || buyNowData.product,
            quantity: buyNowData.quantity,
            priceSnapshot: buyNowData.priceSnapshot ?? buyNowData.price,
            variantId: buyNowData.variantId,
            variantAttributes: buyNowData.selectedAttributes
        }]
        : cartItems

    const subtotal = items.reduce((sum, item) => {
        const linePrice = Number(item?.priceSnapshot) * Number(item?.quantity);
        return sum + (Number.isFinite(linePrice) ? linePrice : 0);
    }, 0);
    const shipping = 0
    const couponDiscount = couponFromCart ? couponDiscountFromCart : 0
    const finalTotal = Math.max(0, subtotal + shipping - couponDiscount)



    const handlePlaceOrder = async () => {
        if (!selectedAddress) return
        if (!token) {
            toast({
                title: "Login required",
                description: "Please sign in to place your order.",
                variant: "destructive",
            })
            return
        }
        setIsPlacing(true)
        try {
            const orderData = {
                addressId: selectedAddress._id,
                paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay',
            }

            // If Buy Now, send the product info directly
            if (buyNowData) {
                orderData.buyNowItem = {
                    productId: buyNowData.productId || buyNowData.product,
                    variantId: buyNowData.variantId,
                    quantity: buyNowData.quantity,
                }
            }

            const result = await placeOrder(orderData, token)

            // Handle auth failure (backend may return 200 with success: false)
            if (result && result.success === false) {
                const msg = result.message || 'Please sign in again to place your order.'
                toast({
                    title: 'Session issue',
                    description: msg,
                    variant: 'destructive',
                })
                return
            }

            // Backend wraps in { success, message, data }; payload is data or result
            const payload = result?.data ?? result

            // Expecting backend to return razorpayOrderId and razorpayKeyId
            if (paymentMethod === 'cod') {
                toast({
                    title: "Order Placed!",
                    description: "Your COD order has been placed successfully.",
                });
                setOrderResult(payload);
                setCurrentStep(2);
                clearCart();
            } else if (payload?.razorpayOrderId && payload?.razorpayKeyId) {
                await openRazorpayCheckout({
                    key: payload.razorpayKeyId,
                    orderId: payload.razorpayOrderId,
                    amount: payload.amount,
                    customerName: user?.name,
                    customerEmail: user?.email,
                    customerPhone: selectedAddress?.phone,
                    onSuccess: async (paymentResponse) => {
                        try {
                            // Send verification payload to backend
                            await fetch(`/api/orders/webhook`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: paymentResponse.razorpay_order_id,
                                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                    razorpay_signature: paymentResponse.razorpay_signature
                                })
                            });

                            toast({
                                title: "Payment Successful",
                                description: "Your order has been placed successfully.",
                            });

                            setOrderResult(payload);
                            setCurrentStep(2);
                            clearCart();
                        } catch (verifyError) {
                            const errorMessage =
                                verifyError?.response?.data?.message ||
                                verifyError?.message ||
                                "Payment completed, but verification failed. Please contact support.";
                            toast({
                                title: "Payment Verification Issue",
                                description: errorMessage,
                                variant: "destructive",
                            });
                        }
                    },
                    onFailure: (err) => {
                        toast({
                            title: "Payment Cancelled",
                            description: err?.message || "You cancelled the payment.",
                            variant: "destructive",
                        });
                    }
                });
            } else {
                toast({
                    title: "Payment Error",
                    description: "Could not initiate payment. Please try again.",
                    variant: "destructive",
                })
            }

            setOrderResult(payload ?? result)
            // setCurrentStep(2) // Don't verify immediately, wait for return
            // clearCart() // Don't clear until confirmed? Or clear if redirecting? 
            // Usually clear on success page.
        } catch (error) {
            const msg =
                (typeof error === 'object' && error?.message) ||
                (typeof error === 'string' ? error : null) ||
                'Something went wrong. Please try again.';
            const isAuthError =
                /401|login|log in|authentication|token expired|invalid token/i.test(msg);
            toast({
                title: isAuthError ? 'Session issue' : 'Order Failed',
                description: isAuthError ? 'Please sign in again to place your order.' : msg,
                variant: 'destructive',
            });
        } finally {
            setIsPlacing(false)
        }
    }

    const stepVariants = {
        enter: { opacity: 0, x: 30 },
        center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
        exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">Checkout</h1>
                    <p className="text-muted-foreground text-lg">Complete your order securely</p>
                </div>

                {/* Steps */}
                <div className="flex items-center justify-center mb-10 sm:mb-16 max-w-2xl mx-auto">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex items-center w-full last:w-auto">
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${i === currentStep
                                    ? 'bg-primary text-primary-foreground border-background shadow-lg shadow-primary/25 scale-110'
                                    : i < currentStep
                                        ? 'bg-primary text-primary-foreground border-background'
                                        : 'bg-muted text-muted-foreground border-background'
                                    }`}>
                                    {i < currentStep ? (
                                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                    ) : (
                                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </div>
                                <span className={`absolute -bottom-8 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 hidden sm:block ${i === currentStep ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="flex-1 h-0.5 sm:h-1 mx-2 sm:mx-4 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full bg-primary transition-all duration-500 ease-out ${i < currentStep ? 'w-full' : 'w-0'
                                        }`} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {/* ─── STEP 1: Shipping ─── */}
                            {currentStep === 0 && (
                                <motion.div
                                    key="shipping"
                                    variants={stepVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 md:p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-foreground">Shipping Address</h2>
                                            <Link to="/profile">
                                                <Button variant="outline" size="sm" className="rounded-full gap-2">
                                                    <Plus className="h-4 w-4" />
                                                    Add New
                                                </Button>
                                            </Link>
                                        </div>

                                        {addressesLoading ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[...Array(2)].map((_, i) => (
                                                    <div key={i} className="h-32 skeleton-shine rounded-xl" />
                                                ))}
                                            </div>
                                        ) : !addresses || addresses.length === 0 ? (
                                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                                                <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                                <p className="text-muted-foreground mb-6">No saved addresses found</p>
                                                <Link to="/profile">
                                                    <Button className="rounded-full">Add Address</Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {addresses.map((addr) => (
                                                    <motion.div
                                                        key={addr._id}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => setSelectedAddress(addr)}
                                                        className={`cursor-pointer p-4 sm:p-5 rounded-xl border-2 transition-all relative overflow-hidden ${selectedAddress?._id === addr._id
                                                            ? 'border-primary bg-primary/5 shadow-md'
                                                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddress?._id === addr._id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                                    {selectedAddress?._id === addr._id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                </div>
                                                                <span className="font-semibold text-sm sm:text-base text-foreground">{addr.name}</span>
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 bg-background rounded-md border border-border text-muted-foreground">
                                                                {addr.type || 'Home'}
                                                            </span>
                                                        </div>
                                                        <div className="pl-6 space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
                                                            <p className="line-clamp-1">{addr.addressLine1}</p>
                                                            <p className="line-clamp-1">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                            <p className="pt-1.5 flex items-center gap-2">
                                                                <span className="w-1 h-1 bg-current rounded-full" />
                                                                {addr.phone}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-8">
                                        <Button
                                            onClick={() => setCurrentStep(1)}
                                            disabled={!selectedAddress}
                                            size="lg"
                                            className="rounded-full px-8 shadow-lg shadow-primary/25 font-semibold text-lg"
                                        >
                                            Continue to Payment
                                            <ArrowRight className="h-5 w-5 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── STEP 2: Payment ─── */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="payment"
                                    variants={stepVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 md:p-8">
                                        <h2 className="text-2xl font-bold text-foreground mb-6">Payment Method</h2>

                                        <div className="space-y-3 mb-8">
                                            <button
                                                onClick={() => setPaymentMethod('online')}
                                                className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground/40'}`}>
                                                    {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5 text-primary" />
                                                        <span className="font-semibold text-foreground">Online Payment</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">UPI, Cards, Netbanking via Razorpay</p>
                                                </div>
                                                <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            </button>

                                            {codEnabled && (
                                                <button
                                                    onClick={() => setPaymentMethod('cod')}
                                                    className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 transition-all text-left ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                                                >
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground/40'}`}>
                                                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="h-5 w-5 text-orange-500" />
                                                            <span className="font-semibold text-foreground">Cash on Delivery</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">Pay when your order arrives</p>
                                                    </div>
                                                </button>
                                            )}
                                        </div>

                                        {selectedAddress && (
                                            <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Shipping to</span>
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium text-foreground">{selectedAddress.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                                                        </p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="text-primary hover:text-primary/80">
                                                        Change
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-8">
                                        <Button
                                            onClick={() => setCurrentStep(0)}
                                            variant="ghost"
                                            size="lg"
                                            className="rounded-full hover:bg-muted"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handlePlaceOrder}
                                            disabled={isPlacing}
                                            size="lg"
                                            className="rounded-full px-8 shadow-lg shadow-primary/25 font-semibold text-lg min-w-[200px]"
                                        >
                                            {isPlacing ? (
                                                <div className="flex items-center gap-2">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1 }}
                                                        className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                    Processing...
                                                </div>
                                            ) : (
                                                <>
                                                    Place Order
                                                    <ArrowRight className="h-5 w-5 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── STEP 3: Confirmation ─── */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="confirmation"
                                    variants={stepVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                >
                                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-8 md:p-12 text-center max-w-2xl mx-auto">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                                        >
                                            <CheckCircle className="h-12 w-12 text-green-600" />
                                        </motion.div>
                                        <h2 className="text-3xl font-bold text-foreground mb-4">Order Placed Successfully!</h2>
                                        <p className="text-muted-foreground mb-8 text-lg">
                                            Thank you for your purchase. We've sent a confirmation email to your inbox.
                                        </p>

                                        {orderResult?.orderId && (
                                            <div className="bg-muted/50 py-3 px-6 rounded-lg inline-block mb-8">
                                                <p className="text-sm text-muted-foreground">Order ID: <span className="font-mono font-medium text-foreground ml-2">{orderResult.orderId}</span></p>
                                            </div>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <Link to="/orders">
                                                <Button size="lg" className="rounded-full w-full sm:w-auto">
                                                    View My Orders
                                                </Button>
                                            </Link>
                                            <Link to="/products">
                                                <Button variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
                                                    Continue Shopping
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    {currentStep < 2 && (
                        <div className="lg:col-span-4">
                            <div className="sticky top-24">
                                <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden text-card-foreground">
                                    <div className="p-6 border-b border-border/50">
                                        <h2 className="text-xl font-bold">Order Summary</h2>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {items.map((item) => {
                                                const product = item.productId || item.product;
                                                // Skip if product data is missing
                                                if (!product) return null;

                                                const imageUrl = product.imageIds?.[0]
                                                    ? getProductImageUrl(product.imageIds[0])
                                                    : null
                                                return (
                                                    <div key={item._id} className="flex gap-4">
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                                                            {imageUrl && (
                                                                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base font-medium text-foreground leading-snug">{product.name}</p>
                                                            {/* Variant Info */}
                                                            {item.variantAttributes ? (
                                                                <div className="flex gap-1 flex-wrap mt-1">
                                                                    {Object.entries(item.variantAttributes).map(([key, value]) => (
                                                                        <span key={key} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                                                                            {key}: {value}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (item.variantId && product.variants && (
                                                                <div className="flex gap-1 flex-wrap mt-1">
                                                                    {product.variants.find(v => v._id === item.variantId)?.attributes && 
                                                                        Object.entries(product.variants.find(v => v._id === item.variantId).attributes).map(([key, value]) => (
                                                                            <span key={key} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                                                                                {key}: {value}
                                                                            </span>
                                                                        ))
                                                                    }
                                                                </div>
                                                            ))}
                                                            <p className="text-sm font-semibold text-muted-foreground mt-1">Qty: {item.quantity}</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-foreground">₹{Math.round(
  Number(item.priceSnapshot || item.price || 0) * Number(item.quantity || 1)
).toLocaleString()}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="border-t border-border/50 pt-5 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-medium text-foreground">₹{Math.round(subtotal || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span className="font-medium text-green-600">Free</span>
                                            </div>
                                            {couponDiscount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Coupon ({couponFromCart})</span>
                                                    <span className="font-medium text-green-600">-₹{Math.round(couponDiscount).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-border pt-5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-base font-semibold text-foreground">Total</span>
                                                <span className="text-2xl font-bold text-primary">₹{Math.round(finalTotal || 0).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 text-right">Includes all taxes</p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Shield className="h-3.5 w-3.5" />
                                        <span>Transactions are 100% Safe and Secure</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Checkout