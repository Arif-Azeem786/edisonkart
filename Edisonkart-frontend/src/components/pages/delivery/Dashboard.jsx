import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Package,
    CheckCircle,
    Clock,
    Truck,
    MapPin,
    Phone,
    User,
    Inbox,
    ArrowRight
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Link } from 'react-router-dom'
import { getDeliveryStats, getAssignedOrders } from '../../../services/delivery'
import useAuthStore from '../../../store/authStore'
import PremiumLoader from '../../ui/PremiumLoader'

const DeliveryDashboard = () => {
    const [stats, setStats] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { user } = useAuthStore()

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const [statsData, ordersData] = await Promise.all([
                getDeliveryStats(),
                getAssignedOrders()
            ])
            setStats(statsData)
            setOrders((ordersData || []).filter(o => o.orderStatus !== 'DELIVERED').slice(0, 5))
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Failed to load dashboard data'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const getStatusColor = (status) => {
        const colors = {
            PLACED: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
            CONFIRMED: 'bg-[#F97316]/10 text-[#F97316]',
            SHIPPED: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
            OUT_FOR_DELIVERY: 'bg-[#F97316]/10 text-[#F97316]',
            DELIVERED: 'bg-green-100 text-green-600',
            CANCELLED: 'bg-red-100 text-red-600',
        }
        return colors[status] || 'bg-slate-100 text-slate-600'
    }

    const getStatusLabel = (status) => {
        const map = {
            'PLACED': 'Placed',
            'CONFIRMED': 'Confirmed',
            'SHIPPED': 'Shipped',
            'OUT_FOR_DELIVERY': 'Out for Delivery',
            'DELIVERED': 'Delivered',
            'CANCELLED': 'Cancelled'
        }
        return map[status] || status
    }

    const statCards = stats ? [
        {
            title: 'Total Assigned',
            value: stats.totalAssigned || 0,
            icon: Package,
            bg: 'bg-[#1E3A8A]/10',
            text: 'text-[#1E3A8A]',
        },
        {
            title: 'Delivered Today',
            value: stats.deliveredToday || 0,
            icon: CheckCircle,
            bg: 'bg-green-100',
            text: 'text-green-600',
        },
        {
            title: 'Out for Delivery',
            value: stats.outForDelivery || 0,
            icon: Truck,
            bg: 'bg-[#F97316]/10',
            text: 'text-[#F97316]',
        },
        {
            title: 'Pending Pickup',
            value: stats.pendingCount || 0,
            icon: Clock,
            bg: 'bg-[#1E3A8A]/10',
            text: 'text-[#1E3A8A]',
        },
    ] : []

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading dashboard..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchData} className="gap-2">Retry</Button>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}


            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.text}`} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold mb-1 text-slate-900 font-syne">{stat.value}</h3>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}


            {/* Assigned Orders */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-200"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                    <h3 className="text-2xl font-bold font-syne text-[#1E3A8A]">Active Orders</h3>
                    <Link to="/delivery/orders">
                        <Button variant="outline" className="gap-2 border-[#1E3A8A]/20 text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-all rounded-full">
                            View All
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">No active orders</p>
                        <p className="text-sm">New orders assigned to you will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order._id || order.orderId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-slate-200 transition-all duration-300 group"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${getStatusColor(order.orderStatus)}`}>
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-[#1E3A8A]">{order.orderId}</span>
                                                <Badge variant="outline" className={`${getStatusColor(order.orderStatus)} text-xs`}>
                                                    {getStatusLabel(order.orderStatus)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                {order.userId && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5" />
                                                        {order.userId.name || 'Customer'}
                                                    </span>
                                                )}
                                                {order.addressSnapshot?.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {order.addressSnapshot.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">₹{order.totalAmount?.toLocaleString()}</p>
                                            <p className="text-sm text-slate-500">{order.items?.length || 0} items</p>
                                        </div>
                                        <Link to="/delivery/orders">
                                            <Button size="sm" className="rounded-full gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                Manage
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {order.addressSnapshot && (
                                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                                        <span>
                                            {[order.addressSnapshot.addressLine1, order.addressSnapshot.addressLine2, order.addressSnapshot.city, order.addressSnapshot.state, order.addressSnapshot.pincode]
                                                .filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default DeliveryDashboard