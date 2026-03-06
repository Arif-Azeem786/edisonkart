import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Trash2,
    Minus,
    Plus,
    ShoppingBag,
    ArrowRight,
    ArrowLeft,
    Truck,
    Shield,
    CheckCircle2,
    Tag,
    Loader2
} from 'lucide-react'
import { Button } from '../ui/button'
import useCartStore from '../../store/cartStore'
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import { useToast } from '../ui/use-toast'
import { applyCoupon, removeCoupon } from '../../services/coupon'

const Cart = () => {
    const navigate = useNavigate()
    const { items, total, itemCount, updateItem, removeItem, clearCart, isLoading } = useCartStore()
    const { toast } = useToast()

    const subtotal = total
    const shipping = 0

    const [couponCode, setCouponCode] = useState('')
    const [couponDiscount, setCouponDiscount] = useState(0)
    const [couponApplied, setCouponApplied] = useState(null)
    const [couponLoading, setCouponLoading] = useState(false)
    const [couponError, setCouponError] = useState('')

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setCouponLoading(true)
        setCouponError('')
        try {
            const result = await applyCoupon(couponCode.trim(), subtotal)
            const data = result?.data || result
            setCouponDiscount(data.discount || 0)
            setCouponApplied(data.code || couponCode.trim())
            toast({ title: "Coupon Applied!", description: `You saved ₹${data.discount}` })
        } catch (err) {
            setCouponError(err?.response?.data?.message || err?.message || 'Invalid coupon code')
            setCouponDiscount(0)
            setCouponApplied(null)
        } finally {
            setCouponLoading(false)
        }
    }

    const handleRemoveCoupon = () => {
        setCouponDiscount(0)
        setCouponApplied(null)
        setCouponCode('')
        setCouponError('')
    }

    const finalTotal = subtotal + shipping - couponDiscount

    const handleUpdateItem = async (itemId, quantity) => {
        try {
            await updateItem(itemId, quantity)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update item quantity",
                variant: "destructive"
            })
        }
    }

    const handleRemoveItem = async (itemId) => {
        try {
            await removeItem(itemId)
            toast({
                title: "Removed",
                description: "Item removed from cart"
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove item",
                variant: "destructive"
            })
        }
    }

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            try {
                await clearCart()
                toast({
                    title: "Cart cleared",
                    description: "All items have been removed from your cart"
                })
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to clear cart",
                    variant: "destructive"
                })
            }
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center pt-20 bg-background text-foreground">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md px-4"
                >
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-foreground">Your cart is empty</h2>
                    <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                        Looks like you haven't added anything to your cart yet.
                        Discover our new arrivals!
                    </p>
                    <Link to="/products">
                        <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                            Start Shopping
                        </Button>
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 sm:py-12 md:py-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">Shopping Cart</h1>
                        <p className="text-muted-foreground mt-2 text-lg">You have <span className="font-semibold text-foreground">{itemCount} items</span> in your cart</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleClearCart}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Cart
                        </Button>
                        <Link to="/products">
                            <Button variant="outline" className="border-border hover:bg-accent hover:text-accent-foreground">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Free shipping badge */}
                        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-4 text-green-700 border border-green-100">
                            <Truck className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">Free shipping on all orders!</p>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {items.map((item) => {
                                const product = item.productId
                                if (!product || typeof product === 'string') return null

                                const imageUrl = product.imageIds?.[0]
                                    ? getProductImageUrl(product.imageIds[0])
                                    : NO_IMAGE_PLACEHOLDER

                                return (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 relative"
                                    >
                                        {/* Product Image */}
                                        <Link to={`/product/${product._id}`} className="shrink-0">
                                            <div className="w-20 h-20 sm:w-28 md:w-32 sm:h-32 rounded-xl overflow-hidden bg-muted border border-border">
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <Link to={`/product/${product._id}`}>
                                                        <h3 className="font-semibold text-sm sm:text-lg text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
                                                            {product.name}
                                                        </h3>
                                                    </Link>
                                                    {item.variantId && product.variants && (
                                                        <div className="flex gap-2 flex-wrap mt-1">
                                                            {product.variants.find(v => v._id === item.variantId)?.attributes && 
                                                                Object.entries(product.variants.find(v => v._id === item.variantId).attributes).map(([key, value]) => (
                                                                    <span key={key} className="text-[10px] sm:text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground border border-border">
                                                                        <span className="font-semibold">{key}:</span> {value}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                    {product.category && !item.variantId && (
                                                        <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">
                                                            {product.category.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-base sm:text-lg font-bold text-foreground whitespace-nowrap">
                                                    ₹{Math.round(item.priceSnapshot * item.quantity).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-border gap-2">
                                                {/* Quantity Control */}
                                                <div className="flex items-center bg-muted/50 rounded-lg p-0.5 sm:p-1 border border-border">
                                                    <button
                                                        onClick={() => handleUpdateItem(item._id, Math.max(1, item.quantity - 1))}
                                                        disabled={isLoading || item.quantity <= 1}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground shadow-sm transition-all disabled:opacity-50"
                                                    >
                                                        <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </button>
                                                    <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-semibold text-foreground">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateItem(item._id, item.quantity + 1)}
                                                        disabled={isLoading}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground shadow-sm transition-all"
                                                    >
                                                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveItem(item._id)}
                                                    disabled={isLoading}
                                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5"
                                                    title="Remove Item"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="hidden sm:inline text-sm font-medium">Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-foreground">₹{Math.round(subtotal).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Shipping</span>
                                        <span className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-foreground'}`}>
                                            {shipping === 0 ? 'Free' : `₹${shipping}`}
                                        </span>
                                    </div>
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Coupon Discount</span>
                                            <span className="font-medium">-₹{couponDiscount}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Coupon Code */}
                                <div className="mb-6 pt-4 border-t border-border">
                                    {couponApplied ? (
                                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">{couponApplied}</span>
                                                <span className="text-sm text-green-600">-₹{couponDiscount}</span>
                                            </div>
                                            <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                                    className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                                                />
                                                <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="px-4">
                                                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                                                </Button>
                                            </div>
                                            {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 mb-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-foreground">Total</span>
                                        <span className="text-2xl font-bold text-primary">₹{Math.round(finalTotal).toLocaleString()}</span>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full text-base font-semibold py-6 rounded-xl shadow-lg shadow-primary/25"
                                    onClick={() => navigate('/checkout', { state: { couponCode: couponApplied, couponDiscount } })}
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>

                                {/* Trust badges */}
                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Secure checkout</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Money-back guarantee</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Sticky Mobile Checkout Bar */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-4 shadow-2xl flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold text-primary">₹{Math.round(finalTotal).toLocaleString()}</p>
                </div>
                <Button
                    size="lg"
                    className="flex-1 rounded-xl shadow-lg shadow-primary/25 h-12"
                    onClick={() => navigate('/checkout', { state: { couponCode: couponApplied, couponDiscount } })}
                >
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
export default Cart