import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getOrder, cancelOrder, requestReturn, downloadInvoice } from '../../services/order';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import {
    Package,
    Truck,
    CheckCircle,
    MapPin,
    Calendar,
    CreditCard,
    ArrowLeft,
    Copy,
    XCircle,
    Clock,
    Phone,
    ShoppingBag,
    Shield,
    RotateCcw,
    Download,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { getProductImageUrl } from '../ui/imageUtils';
import { NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils';
import { useToast } from '../ui/use-toast';
import OrderTimeline from '../order/OrderTimeline';
import PremiumLoader from '../ui/PremiumLoader';

const OrderDetails = () => {
    const { orderId } = useParams();
    const { toast } = useToast();

    const { data: order, isLoading, error, refetch } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrder(orderId),
        retry: 1
    });

    const [isCancelling, setIsCancelling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Order ID copied to clipboard",
        });
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        
        setIsCancelling(true);
        try {
            await cancelOrder(orderId, 'Cancelled by user');
            toast({ title: "Order Cancelled", description: "Your order has been cancelled successfully." });
            refetch();
        } catch (error) {
            toast({ title: "Cancellation Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setIsDownloading(true);
        try {
            await downloadInvoice(orderId);
            toast({ title: "Invoice Downloaded", description: "Your invoice PDF is ready." });
        } catch (error) {
            toast({ title: "Download Failed", description: "Could not generate invoice PDF", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleReturnRequest = async (type) => {
        const reason = window.prompt(`Please enter reason for ${type === 'RETURN' ? 'Return' : 'Replacement'}:`);
        if (!reason) return;

        try {
            await requestReturn(orderId, type, reason);
            toast({ title: "Request Submitted", description: `Your ${type.toLowerCase()} request has been sent for approval.` });
            refetch();
        } catch (error) {
            toast({ title: "Request Failed", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center bg-slate-50">
                <PremiumLoader size="default" text="Loading order details..." />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h2>
                    <p className="text-slate-500 mb-8">We couldn't find this order. Please check the order ID.</p>
                    <Link to="/orders">
                        <Button className="bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl px-6 transition-all duration-300">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { items, totalAmount, orderStatus, paymentStatus, addressSnapshot, createdAt } = order;
    const isCancelled = orderStatus === 'CANCELLED';

    // Calculate item subtotal
    const itemSubtotal = items?.reduce((sum, item) => sum + (item.priceSnapshot * item.quantity), 0) || 0;
    const shipping = totalAmount - itemSubtotal;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Header with Back Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <Link
                        to="/orders"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1E3A8A] transition-colors mb-4 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to My Orders
                    </Link>

                    <div className="flex flex-col gap-3">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                    Order Details
                                </h1>
                                <button
                                    onClick={() => copyToClipboard(order.orderId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-mono text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    #{order.orderId?.substring(0, 10)}
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                Placed on {format(new Date(createdAt), 'MMMM dd, yyyy')} at {format(new Date(createdAt), 'h:mm a')}
                            </p>
                        </div>


                        {/* Status Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Order Status */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : orderStatus === 'CANCELLED'
                                        ? 'bg-red-50 text-red-600 border border-red-200'
                                        : 'bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20'
                                }`}>
                                {orderStatus === 'DELIVERED' ? <CheckCircle className="h-3 w-3" /> :
                                    orderStatus === 'CANCELLED' ? <XCircle className="h-3 w-3" /> :
                                        <Truck className="h-3 w-3" />}
                                {orderStatus?.replace(/_/g, ' ')}
                            </span>

                            {/* Payment Status */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${paymentStatus === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : paymentStatus === 'FAILED'
                                        ? 'bg-red-50 text-red-600 border border-red-200'
                                        : 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20'
                                }`}>
                                <CreditCard className="h-3 w-3" />
                                {paymentStatus}
                            </span>

                            {/* Invoice Download Button */}
                            {paymentStatus === 'PAID' && (
                                <Button 
                                    onClick={handleDownloadInvoice}
                                    disabled={isDownloading}
                                    variant="outline"
                                    className="rounded-xl h-9 gap-1.5 bg-white border-slate-200 text-slate-700 hover:text-[#1E3A8A] font-bold text-xs"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {isDownloading ? 'Downloading...' : 'Invoice'}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Cancelled Banner */}
                {isCancelled && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-red-50 rounded-2xl border border-red-100 p-5 sm:p-6 mb-6 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800">Order Cancelled</h3>
                            <p className="text-sm text-red-600 mt-0.5">This order has been cancelled. If payment was made, a refund will be processed.</p>
                        </div>
                    </motion.div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Items & Timeline */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Order Items */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-[#F97316]" />
                                    Items ({items?.length || 0})
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {items?.map((item) => {
                                    const product = item.productId || {};
                                    const imageUrl = product.imageIds?.[0]
                                        ? getProductImageUrl(product.imageIds[0])
                                        : NO_IMAGE_PLACEHOLDER;

                                    return (
                                        <div key={item._id} className="p-4 sm:p-5 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                            <Link
                                                to={product.slug ? `/products/${product.slug}` : '#'}
                                                className="flex-shrink-0"
                                            >
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.nameSnapshot}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <Link to={product.slug ? `/products/${product.slug}` : '#'}>
                                                        <h3 className="font-semibold text-slate-900 hover:text-[#1E3A8A] transition-colors line-clamp-1 text-sm sm:text-base">
                                                            {item.nameSnapshot}
                                                        </h3>
                                                    </Link>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                        <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                                                        <span className="text-xs text-slate-400">₹{item.priceSnapshot?.toLocaleString()} / unit</span>
                                                    </div>
                                                    {item.variantAttributesSnapshot && Object.keys(item.variantAttributesSnapshot).length > 0 && (
                                                        <div className="flex gap-2 flex-wrap mt-2">
                                                            {Object.entries(item.variantAttributesSnapshot).map(([key, value]) => (
                                                                <span key={key} className="text-[10px] sm:text-xs bg-slate-50 px-2 py-0.5 rounded-md text-slate-500 border border-slate-100">
                                                                    <span className="font-bold text-slate-700">{key}:</span> {value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-base sm:text-lg font-bold text-[#1E3A8A]">
                                                        ₹{(item.priceSnapshot * item.quantity)?.toLocaleString()}
                                                    </p>
                                                    {product.slug && (
                                                        <Link to={`/products/${product.slug}`}>
                                                            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-[#1E3A8A] h-7 px-2 rounded-lg">
                                                                <RotateCcw className="h-3 w-3 mr-1" />
                                                                Buy Again
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total */}
                            <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Subtotal</span>
                                        <span className="text-slate-700">₹{itemSubtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Shipping</span>
                                        <span className={shipping === 0 ? 'text-emerald-600 font-medium' : 'text-slate-700'}>
                                            {shipping === 0 ? 'Free' : `₹${shipping?.toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                        <span className="font-semibold text-slate-900">Total Amount</span>
                                        <span className="text-xl font-bold text-[#1E3A8A]">₹{totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Order Timeline */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6"
                        >
                            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Clock className="h-4 w-4 text-[#1E3A8A]" />
                                Order Timeline
                            </h2>
                            <OrderTimeline history={order.statusHistory} currentStatus={orderStatus} />
                        </motion.div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="space-y-6">

                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6"
                        >
                            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4 text-[#F97316]" />
                                Shipping Address
                            </h2>
                            <div className="text-sm space-y-1.5">
                                <p className="font-semibold text-slate-900">{addressSnapshot?.name}</p>
                                <div className="text-slate-500 leading-relaxed">
                                    <p>{addressSnapshot?.addressLine1}</p>
                                    {addressSnapshot?.addressLine2 && <p>{addressSnapshot.addressLine2}</p>}
                                    <p>{addressSnapshot?.city}, {addressSnapshot?.state} - {addressSnapshot?.pincode}</p>
                                </div>
                                {addressSnapshot?.phone && (
                                    <p className="flex items-center gap-1.5 text-slate-700 font-medium pt-1.5">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        {addressSnapshot.phone}
                                    </p>
                                )}
                            </div>
                        </motion.div>

                        {/* Payment Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6"
                        >
                            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <CreditCard className="h-4 w-4 text-[#1E3A8A]" />
                                Payment Info
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Method</span>
                                    <span className="text-sm font-medium text-slate-900 capitalize">{order.paymentMethod || 'Online'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Status</span>
                                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${paymentStatus === 'PAID'
                                            ? 'text-emerald-700 bg-emerald-50'
                                            : paymentStatus === 'FAILED'
                                                ? 'text-red-600 bg-red-50'
                                                : 'text-[#F97316] bg-[#F97316]/10'
                                        }`}>
                                        {paymentStatus}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="font-semibold text-slate-900">Total Paid</span>
                                    <span className="text-lg font-bold text-[#1E3A8A]">₹{totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Help Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-[#1E3A8A] to-[#152a6a] rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-blue-900/10"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="h-4 w-4 text-white/80" />
                                <h3 className="font-bold text-sm">Need Help?</h3>
                            </div>
                            <p className="text-xs text-blue-100 leading-relaxed mb-4">
                                If you have any issues with your order, our support team is here to help you 24/7.
                            </p>
                            <div className="space-y-3">
                                <Link to="/contact">
                                    <Button
                                        variant="outline"
                                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#1E3A8A] rounded-xl text-sm font-bold transition-all duration-300"
                                    >
                                        Contact Support
                                    </Button>
                                </Link>

                                {/* Action Buttons */}
                                {['PLACED', 'CONFIRMED'].includes(orderStatus) && (
                                    <Button
                                        onClick={handleCancelOrder}
                                        disabled={isCancelling}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                                    </Button>
                                )}

                                {orderStatus === 'DELIVERED' && differenceInDays(new Date(), new Date(order.deliveredAt || order.updatedAt)) <= 7 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => handleReturnRequest('RETURN')}
                                            variant="outline"
                                            className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#1E3A8A] rounded-xl text-xs font-bold"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                            Return
                                        </Button>
                                        <Button
                                            onClick={() => handleReturnRequest('REPLACEMENT')}
                                            variant="outline"
                                            className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-[#1E3A8A] rounded-xl text-xs font-bold"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                            Replace
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
