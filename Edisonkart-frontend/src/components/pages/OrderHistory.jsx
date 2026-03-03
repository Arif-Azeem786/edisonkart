import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Package,
    CheckCircle,
    Truck,
    XCircle,
    Clock,
    Calendar,
    ChevronRight,
    ShoppingBag,
    Search,
    MapPin
} from 'lucide-react'
import { Button } from '../ui/button'
import { getUserOrders } from '../../services/order'
import PremiumLoader from '../ui/PremiumLoader'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'

const statusConfig = {
    PLACED: {
        label: 'Order Placed',
        icon: Package,
        color: 'text-[#1E3A8A]',
        bg: 'bg-[#1E3A8A]/10',
        accent: 'border-[#1E3A8A]/20',
        dot: 'bg-[#1E3A8A]'
    },
    CONFIRMED: {
        label: 'Confirmed',
        icon: CheckCircle,
        color: 'text-[#F97316]',
        bg: 'bg-[#F97316]/10',
        accent: 'border-[#F97316]/20',
        dot: 'bg-[#F97316]'
    },
    SHIPPED: {
        label: 'Shipped',
        icon: Truck,
        color: 'text-[#1E3A8A]',
        bg: 'bg-[#1E3A8A]/10',
        accent: 'border-[#1E3A8A]/20',
        dot: 'bg-[#1E3A8A]'
    },
    OUT_FOR_DELIVERY: {
        label: 'Out for Delivery',
        icon: Truck,
        color: 'text-[#F97316]',
        bg: 'bg-[#F97316]/10',
        accent: 'border-[#F97316]/20',
        dot: 'bg-[#F97316]'
    },
    DELIVERED: {
        label: 'Delivered',
        icon: CheckCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        accent: 'border-emerald-200',
        dot: 'bg-emerald-500'
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        accent: 'border-red-200',
        dot: 'bg-red-500'
    }
}

const filterTabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'active', label: 'Active' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
]

const OrderHistory = () => {
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()

    const { data, isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: getUserOrders,
    })

    if (isLoading) {
        return (
            <div className="min-h-screen pt-32 flex items-center justify-center">
                <PremiumLoader size="default" text="Loading your orders..." />
            </div>
        )
    }

    const orders = data?.orders || []

    const filteredOrders = orders.filter(order => {
        // Status filter
        if (filter === 'active') {
            if (['DELIVERED', 'CANCELLED'].includes(order.orderStatus)) return false
        } else if (filter !== 'all') {
            if (order.orderStatus !== filter) return false
        }
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchesId = order.orderId?.toLowerCase().includes(term)
            const matchesItem = order.items?.some(item =>
                item.nameSnapshot?.toLowerCase().includes(term)
            )
            return matchesId || matchesItem
        }
        return true
    })

    // Get order stats
    const stats = {
        total: orders.length,
        active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length,
        delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                                My Orders
                            </h1>
                            <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
                                Track, manage and review your purchases
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3">
                            {[
                                { label: 'Total', value: stats.total, icon: ShoppingBag },
                                { label: 'Active', value: stats.active, icon: Clock },
                                { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
                            ].map(stat => (
                                <div key={stat.label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <stat.icon className="h-4 w-4 text-[#1E3A8A]" />
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-slate-900 leading-none">{stat.value}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Search & Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row gap-3"
                >
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID or product name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]/30 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-50 rounded-xl p-1 gap-0.5 flex-shrink-0">
                        {filterTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${filter === tab.key
                                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 sm:p-16 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Package className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">
                            {filter === 'all' && !searchTerm
                                ? "You haven't placed any orders yet. Start exploring our amazing collection!"
                                : searchTerm
                                    ? `No orders match "${searchTerm}"`
                                    : `You don't have any ${filter === 'active' ? 'active' : filter.toLowerCase()} orders.`
                            }
                        </p>
                        <Link to="/products">
                            <Button className="bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl px-8 py-3 font-semibold transition-all duration-300 shadow-lg shadow-[#1E3A8A]/15">
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Start Shopping
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.map((order, index) => {
                                const status = statusConfig[order.orderStatus] || statusConfig.PLACED
                                const StatusIcon = status.icon
                                const previewItems = order.items?.slice(0, 3) || []
                                const extraCount = (order.items?.length || 0) - 3

                                return (
                                    <motion.div
                                        key={order._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ delay: index * 0.04 }}
                                        onClick={() => navigate(`/orders/${order.orderId}`)}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer group overflow-hidden"
                                    >
                                        {/* Status Accent Bar */}
                                        <div className={`h-1 ${status.dot} opacity-80`} />

                                        <div className="p-4 sm:p-6">
                                            {/* Top Row: Status, Date, Order ID */}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${status.bg} ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-xs font-mono text-slate-400 ml-auto hidden sm:block">
                                                    #{order.orderId?.substring(0, 10)}
                                                </span>
                                            </div>

                                            {/* Product Preview Row */}
                                            <div className="flex items-center gap-4">
                                                {/* Product Images */}
                                                <div className="flex -space-x-3 flex-shrink-0">
                                                    {previewItems.map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-white overflow-hidden shadow-sm bg-slate-50 ring-1 ring-slate-100"
                                                            style={{ zIndex: previewItems.length - i }}
                                                        >
                                                            <img
                                                                src={item.productId?.imageIds?.[0]
                                                                    ? `${import.meta.env.VITE_API_URL}/products/image/${item.productId.imageIds[0]}`
                                                                    : NO_IMAGE_PLACEHOLDER
                                                                }
                                                                alt={item.nameSnapshot}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                    {extraCount > 0 && (
                                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                                                            +{extraCount}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {previewItems.map(i => i.nameSnapshot).join(', ')}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {order.items?.length} item{order.items?.length > 1 ? 's' : ''}
                                                        {order.addressSnapshot?.city && (
                                                            <span className="inline-flex items-center gap-0.5 ml-2">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                {order.addressSnapshot.city}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Price & Arrow */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-lg sm:text-xl font-bold text-slate-900">
                                                            ₹{order.totalAmount?.toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                            {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                                                        </p>
                                                    </div>
                                                    <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-50 items-center justify-center group-hover:bg-[#1E3A8A] group-hover:text-white transition-all duration-300">
                                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Results Count */}
                {filteredOrders.length > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs text-slate-400 mt-6"
                    >
                        Showing {filteredOrders.length} of {orders.length} orders
                    </motion.p>
                )}
            </div>
        </div>
    )
}

export default OrderHistory