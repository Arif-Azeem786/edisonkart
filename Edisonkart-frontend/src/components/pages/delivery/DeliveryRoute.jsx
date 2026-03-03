import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Navigation,
    MapPin,
    Clock,
    Package,
    Phone,
    CheckCircle,
    AlertCircle,
    Truck,
    Inbox,
    ArrowRight
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

const DeliveryRoute = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingOrderId, setUpdatingOrderId] = useState(null)
    const [confirmAction, setConfirmAction] = useState(null)

    const fetchOrders = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await getAssignedOrders()
            setOrders((data || []).filter(o => o.orderStatus !== 'DELIVERED'))
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.message || 'Failed to load route'
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

    const handleCompleteDelivery = async (orderId, currentStatus) => {
        const flow = {
            'CONFIRMED': 'SHIPPED',
            'SHIPPED': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'DELIVERED',
        }
        const nextStatus = flow[currentStatus]
        if (!nextStatus) return

        setUpdatingOrderId(orderId)
        try {
            await updateDeliveryStatus(orderId, nextStatus)
            toast({
                title: "Status Updated",
                description: `Order marked as ${getStatusLabel(nextStatus) || nextStatus}`,
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
        const flow = {
            'CONFIRMED': 'SHIPPED',
            'SHIPPED': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'DELIVERED',
        }
        const nextStatus = flow[currentStatus]
        if (!nextStatus) return
        setConfirmAction({
            orderId,
            currentStatus,
            nextLabel: getNextActionLabel(currentStatus),
        })
    }

    const executeConfirmedAction = () => {
        if (!confirmAction) return
        handleCompleteDelivery(confirmAction.orderId, confirmAction.currentStatus)
        setConfirmAction(null)
    }

    const getStatusColor = (status) => {
        const colors = {
            CONFIRMED: 'bg-[#F97316]/10 text-[#F97316]',
            SHIPPED: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
            OUT_FOR_DELIVERY: 'bg-[#F97316]/10 text-[#F97316]',
        }
        return colors[status] || 'bg-slate-100 text-slate-600'
    }

    const getStatusDotColor = (status) => {
        switch (status) {
            case 'OUT_FOR_DELIVERY': return 'bg-[#F97316]'
            case 'SHIPPED': return 'bg-[#1E3A8A]'
            case 'CONFIRMED': return 'bg-slate-400'
            default: return 'bg-slate-300'
        }
    }

    const getStatusLabel = (status) => {
        const map = {
            'CONFIRMED': 'Pending Pickup',
            'SHIPPED': 'Picked Up',
            'OUT_FOR_DELIVERY': 'Out for Delivery',
        }
        return map[status] || status
    }

    const getNextActionLabel = (status) => {
        const map = {
            'CONFIRMED': 'Mark as Shipped',
            'SHIPPED': 'Mark Out for Delivery',
            'OUT_FOR_DELIVERY': 'Mark as Delivered',
        }
        return map[status] || null
    }

    const formatAddress = (addr) => {
        if (!addr) return 'No address'
        return [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode]
            .filter(Boolean).join(', ')
    }

    const totalStops = orders.length
    const outForDelivery = orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length
    const shipped = orders.filter(o => o.orderStatus === 'SHIPPED').length
    const pending = orders.filter(o => o.orderStatus === 'CONFIRMED').length

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading route..." />
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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-syne">Delivery Route</h1>
                    <p className="text-slate-500 mt-1">Active deliveries for today</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm px-3 py-1">
                        <Package className="h-4 w-4 mr-1" />
                        {totalStops} Stops
                    </Badge>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-slate-600">All deliveries completed!</p>
                        <p className="text-sm">No active deliveries in your route</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Route List */}
                    <div className="lg:col-span-2 space-y-0">
                        {orders.map((order, index) => {
                            const isUpdating = updatingOrderId === order.orderId
                            const actionLabel = getNextActionLabel(order.orderStatus)
                            const isLast = index === orders.length - 1

                            return (
                                <motion.div
                                    key={order._id || order.orderId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative"
                                >
                                    {/* Timeline connector */}
                                    <div className="flex">
                                        {/* Timeline column */}
                                        <div className="flex flex-col items-center mr-5">
                                            <div className={`w-10 h-10 rounded-full ${getStatusDotColor(order.orderStatus)} text-white flex items-center justify-center font-bold text-sm shadow-lg z-10`}>
                                                {index + 1}
                                            </div>
                                            {!isLast && (
                                                <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 ${!isLast ? 'mb-4' : ''} p-5`}>
                                            {/* Order Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono font-bold text-[#1E3A8A]">{order.orderId}</span>
                                                        <Badge variant="outline" className={`${getStatusColor(order.orderStatus)} text-xs`}>
                                                            {getStatusLabel(order.orderStatus)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700">{order.userId?.name || 'Customer'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900">₹{order.totalAmount?.toLocaleString()}</p>
                                                    <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
                                                </div>
                                            </div>

                                            {/* Address & Contact */}
                                            <div className="space-y-2 mb-4">
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

                                            {/* Action Button */}
                                            {actionLabel && (
                                                <Button
                                                    onClick={() => requestStatusChange(order.orderId, order.orderStatus)}
                                                    disabled={isUpdating}
                                                    className="w-full rounded-xl gap-2 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 shadow-lg shadow-[#1E3A8A]/20"
                                                >
                                                    {isUpdating ? (
                                                        <PremiumLoader size="small" text="" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4" />
                                                            {actionLabel}
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Route Summary & Tips */}
                    <div className="space-y-6">
                        {/* Route Summary */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-lg text-[#1E3A8A] font-syne mb-4 flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-[#F97316]" />
                                Route Summary
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-500 text-sm">Total Stops</span>
                                    <span className="font-bold text-slate-900">{totalStops}</span>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-[#F97316] rounded-full" />
                                        <span className="text-slate-500 text-sm">Out for Delivery</span>
                                    </div>
                                    <span className="font-bold text-[#F97316]">{outForDelivery}</span>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-[#1E3A8A] rounded-full" />
                                        <span className="text-slate-500 text-sm">Shipped</span>
                                    </div>
                                    <span className="font-bold text-[#1E3A8A]">{shipped}</span>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-slate-400 rounded-full" />
                                        <span className="text-slate-500 text-sm">Pending Pickup</span>
                                    </div>
                                    <span className="font-bold text-slate-600">{pending}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Tips */}
                        <div className="bg-[#F97316]/5 border border-[#F97316]/20 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-[#F97316]/10 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-[#F97316]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-2">
                                        Delivery Tips
                                    </h4>
                                    <ul className="text-sm text-slate-600 space-y-1.5">
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#F97316] mt-1">•</span>
                                            Call customer 10 minutes before arrival
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#F97316] mt-1">•</span>
                                            Take photo proof of delivery
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#F97316] mt-1">•</span>
                                            Collect signature if required
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-[#F97316] mt-1">•</span>
                                            Verify items before handing over
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-[#1E3A8A]" />
                            {confirmAction?.nextLabel}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will update the delivery status. The customer will be notified of this change.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Go Back</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeConfirmedAction}
                            className="rounded-xl bg-[#1E3A8A] hover:bg-[#15306B] text-white"
                        >
                            Yes, Proceed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default DeliveryRoute