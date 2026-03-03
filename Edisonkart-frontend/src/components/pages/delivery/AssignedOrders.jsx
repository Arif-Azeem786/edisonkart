import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Package,
    Search,
    MapPin,
    Phone,
    Clock,
    CheckCircle,
    Truck,
    Inbox,
    ArrowRight,
    ShieldCheck
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog'
import { getAssignedOrders, updateDeliveryStatus } from '../../../services/delivery'
import { toast } from '../../ui/use-toast'
import PremiumLoader from '../../ui/PremiumLoader'

// ── Status flow constants ──────────────────────────────────────────────
const STATUS_FLOW = ['CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

const STATUS_CONFIG = {
    CONFIRMED: { label: 'Confirmed', icon: Clock, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', activeBg: 'bg-[#F97316]' },
    SHIPPED: { label: 'Shipped', icon: Package, color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/10', activeBg: 'bg-[#1E3A8A]' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', activeBg: 'bg-[#F97316]' },
    DELIVERED: { label: 'Delivered', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', activeBg: 'bg-green-600' },
}

const getNextStatus = (current) => {
    const flow = {
        'CONFIRMED': 'SHIPPED',
        'SHIPPED': 'OUT_FOR_DELIVERY',
        'OUT_FOR_DELIVERY': 'DELIVERED',
    }
    return flow[current] || null
}

const getNextStatusLabel = (current) => {
    const next = getNextStatus(current)
    return next ? STATUS_CONFIG[next]?.label : null
}

// ── Mini Stepper ───────────────────────────────────────────────────────
const MiniStepper = ({ currentStatus }) => {
    const currentIdx = STATUS_FLOW.indexOf(currentStatus)

    return (
        <div className="flex items-center gap-1 w-full">
            {STATUS_FLOW.map((status, idx) => {
                const config = STATUS_CONFIG[status]
                const isCompleted = idx < currentIdx
                const isActive = idx === currentIdx

                return (
                    <div key={status} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-0.5">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all text-[10px] font-bold ${
                                isCompleted
                                    ? `${config.activeBg} text-white`
                                    : isActive
                                        ? `${config.activeBg} text-white ring-2 ring-offset-1 ring-${config.activeBg}`
                                        : 'bg-slate-100 text-slate-400'
                            }`}>
                                {isCompleted ? <CheckCircle className="h-3 w-3" /> : idx + 1}
                            </div>
                            <span className={`text-[9px] font-semibold text-center whitespace-nowrap ${
                                isActive ? config.color : isCompleted ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                                {config.label}
                            </span>
                        </div>
                        {idx < STATUS_FLOW.length - 1 && (
                            <div className="flex-1 h-0.5 mx-0.5 mt-[-14px]">
                                <div className={`h-full rounded-full ${idx < currentIdx ? 'bg-green-400' : 'bg-slate-200'}`} />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────
const AssignedOrders = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all')
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingOrderId, setUpdatingOrderId] = useState(null)
    const [confirmAction, setConfirmAction] = useState(null) // { orderId, nextStatus, nextLabel }

    const fetchOrders = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getAssignedOrders()
            setOrders((data || []).filter(o => o.orderStatus !== 'DELIVERED'))
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Failed to load orders'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleStatusUpdate = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId)
        try {
            await updateDeliveryStatus(orderId, newStatus)
            toast({
                title: "Status Updated",
                description: `Order marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
            })
            await fetchOrders()
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Failed to update status'
            toast({
                title: "Update Failed",
                description: msg,
                variant: "destructive",
            })
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const requestStatusChange = (orderId, currentStatus) => {
        const nextStatus = getNextStatus(currentStatus)
        if (!nextStatus) return
        setConfirmAction({
            orderId,
            nextStatus,
            nextLabel: STATUS_CONFIG[nextStatus]?.label || nextStatus,
        })
    }

    const executeConfirmedAction = () => {
        if (!confirmAction) return
        handleStatusUpdate(confirmAction.orderId, confirmAction.nextStatus)
        setConfirmAction(null)
    }

    const formatAddress = (addr) => {
        if (!addr) return 'No address'
        return [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode]
            .filter(Boolean).join(', ')
    }

    const filteredOrders = orders.filter(order => {
        const customerName = order.userId?.name || ''
        const orderId = order.orderId || ''
        const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            orderId.toLowerCase().includes(searchTerm.toLowerCase())

        let matchesFilter = true
        if (filter === 'pending') matchesFilter = order.orderStatus === 'CONFIRMED'
        else if (filter === 'shipped') matchesFilter = order.orderStatus === 'SHIPPED'
        else if (filter === 'out_for_delivery') matchesFilter = order.orderStatus === 'OUT_FOR_DELIVERY'

        return matchesSearch && matchesFilter
    })

    const filterButtons = [
        { key: 'all', label: 'All', count: orders.length },
        { key: 'pending', label: 'Confirmed', count: orders.filter(o => o.orderStatus === 'CONFIRMED').length },
        { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.orderStatus === 'SHIPPED').length },
        { key: 'out_for_delivery', label: 'Out for Delivery', count: orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading orders..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchOrders}>Retry</Button>
            </div>
        )
    }

    return (
        <div>
            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[220px]">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by order ID or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] text-sm transition-all"
                            />
                        </div>
                    </div>
                    {/* Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {filterButtons.map(btn => (
                            <Button
                                key={btn.key}
                                variant={filter === btn.key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(btn.key)}
                                className={`rounded-full gap-1.5 ${filter === btn.key
                                    ? 'bg-[#1E3A8A] shadow-lg shadow-[#1E3A8A]/25'
                                    : 'border-slate-200 text-slate-500 hover:text-[#1E3A8A] hover:border-[#1E3A8A]/30'
                                    }`}
                            >
                                {btn.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === btn.key ? 'bg-white/20' : 'bg-slate-100'
                                    }`}>{btn.count}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Inbox className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">No orders found</p>
                        <p className="text-sm">
                            {filter !== 'all' ? 'Try changing the filter or search term' : 'No active orders assigned to you'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredOrders.map((order, index) => {
                        const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.CONFIRMED
                        const StatusIcon = config.icon
                        const nextStatus = getNextStatus(order.orderStatus)
                        const nextLabel = getNextStatusLabel(order.orderStatus)
                        const isUpdating = updatingOrderId === order.orderId

                        return (
                            <motion.div
                                key={order._id || order.orderId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300"
                            >
                                {/* Order Header */}
                                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${config.bg}`}>
                                            <StatusIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="font-mono font-bold text-[#1E3A8A]">{order.orderId}</span>
                                            <p className="text-sm text-slate-500">{order.userId?.name || 'Customer'}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`${config.bg} ${config.color} text-xs`}>
                                        {config.label}
                                    </Badge>
                                </div>

                                {/* Mini Progress Stepper */}
                                <div className="px-5 pt-4 pb-2">
                                    <MiniStepper currentStatus={order.orderStatus} />
                                </div>

                                {/* Order Details */}
                                <div className="p-5 pt-2 space-y-4">
                                    {/* Items */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                            Items ({order.items?.length || 0})
                                        </p>
                                        <div className="space-y-1.5">
                                            {(order.items || []).map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-slate-700">{item.nameSnapshot} x{item.quantity}</span>
                                                    <span className="font-medium text-slate-900">₹{item.priceSnapshot}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between font-bold">
                                            <span className="text-slate-700">Total</span>
                                            <span className="text-[#1E3A8A]">₹{order.totalAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-600">{formatAddress(order.addressSnapshot)}</span>
                                        </div>
                                        {order.addressSnapshot?.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <a href={`tel:${order.addressSnapshot.phone}`} className="text-[#1E3A8A] hover:underline font-medium">
                                                    {order.addressSnapshot.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Update Button */}
                                    {nextStatus && (
                                        <div className="pt-2">
                                            <Button
                                                className="w-full rounded-xl gap-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 shadow-lg shadow-[#1E3A8A]/20"
                                                onClick={() => requestStatusChange(order.orderId, order.orderStatus)}
                                                disabled={isUpdating}
                                            >
                                                {isUpdating ? (
                                                    <PremiumLoader size="small" text="" />
                                                ) : (
                                                    <>
                                                        <ArrowRight className="h-4 w-4" />
                                                        Mark as {nextLabel}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-[#1E3A8A]" />
                            Mark as {confirmAction?.nextLabel}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will update the order status to "{confirmAction?.nextLabel}". The customer will be notified of this change.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Go Back</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeConfirmedAction}
                            className="rounded-xl bg-[#1E3A8A] hover:bg-[#15306B] text-white"
                        >
                            Yes, Mark as {confirmAction?.nextLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AssignedOrders