import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    CheckCircle,
    MapPin,
    Calendar,
    User,
    Phone,
    Package,
    Inbox,
    Clock,
    Truck
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { getAssignedOrders, getDeliveryStats } from '../../../services/delivery'
import PremiumLoader from '../../ui/PremiumLoader'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table"

const CompletedOrders = () => {
    const [orders, setOrders] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const [ordersData, statsData] = await Promise.all([
                getAssignedOrders('DELIVERED'),
                getDeliveryStats()
            ])
            setOrders(ordersData || [])
            setStats(statsData)
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Failed to load completed orders'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const formatTime = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    const formatAddress = (addr) => {
        if (!addr) return 'No address'
        return [addr.addressLine1, addr.city, addr.pincode].filter(Boolean).join(', ')
    }

    const statCards = stats ? [
        {
            title: 'Total Delivered',
            value: stats.totalDelivered || 0,
            icon: Package,
            bg: 'bg-green-100',
            text: 'text-green-600',
        },
        {
            title: 'Delivered Today',
            value: stats.deliveredToday || 0,
            icon: Calendar,
            bg: 'bg-[#F97316]/10',
            text: 'text-[#F97316]',
        },
        {
            title: 'Total Assigned',
            value: stats.totalAssigned || 0,
            icon: Truck,
            bg: 'bg-[#1E3A8A]/10',
            text: 'text-[#1E3A8A]',
        },
    ] : []

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading completed orders..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchData}>Retry</Button>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
           

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

            {/* Completed Orders Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold font-syne text-[#1E3A8A]">Delivery History</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-600 text-sm px-3 py-1">
                        {orders.length} Deliveries
                    </Badge>
                </div>

                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">No completed deliveries yet</p>
                        <p className="text-sm">Completed deliveries will appear here</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-semibold text-slate-500">Order ID</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Customer</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Delivery Address</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Amount</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Items</TableHead>
                                    <TableHead className="font-semibold text-slate-500 text-right">Delivered On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id || order.orderId} className="hover:bg-slate-50 transition-colors border-slate-50">
                                        <TableCell className="font-mono font-bold text-[#1E3A8A]">
                                            {order.orderId}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{order.userId?.name || 'Customer'}</span>
                                                {order.addressSnapshot?.phone && (
                                                    <span className="text-xs text-slate-500">{order.addressSnapshot.phone}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">{formatAddress(order.addressSnapshot)}</span>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            ₹{order.totalAmount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                                {order.items?.length || 0} items
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 text-right">
                                            <div className="flex flex-col items-end">
                                                <span>{formatDate(order.updatedAt)}</span>
                                                <span className="text-xs">{formatTime(order.updatedAt)}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {orders.length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Showing {orders.length} completed deliveries
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default CompletedOrders