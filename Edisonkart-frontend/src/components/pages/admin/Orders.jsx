import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Eye,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    Calendar,
    User,
    CreditCard,
    ArrowRight,
    AlertTriangle,
    ShieldCheck,
    MapPin,
    HelpCircle,
    RefreshCw,
    RotateCcw
} from 'lucide-react'
import PremiumLoader from '../../ui/PremiumLoader'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog'
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

import { Badge } from '../../ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../../services/order'
import { getUsers } from '../../../services/admin'
import { format } from 'date-fns'
import { toast } from '../../ui/use-toast'
import useAuthStore from '../../../store/authStore'

// ── Status flow constants ──────────────────────────────────────────────
const STATUS_FLOW = ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REPLACEMENT_REQUESTED', 'REPLACED']

const STATUS_CONFIG = {
    PLACED: {
        label: 'Placed',
        icon: Clock,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        activeBg: 'bg-slate-600',
        borderColor: 'border-slate-300',
    },
    CONFIRMED: {
        label: 'Confirmed',
        icon: CheckCircle,
        color: 'text-[#1E3A8A]',
        bg: 'bg-[#1E3A8A]/10',
        activeBg: 'bg-[#1E3A8A]',
        borderColor: 'border-[#1E3A8A]/30',
    },
    SHIPPED: {
        label: 'Shipped',
        icon: Package,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        activeBg: 'bg-amber-500',
        borderColor: 'border-amber-300',
    },
    OUT_FOR_DELIVERY: {
        label: 'Out for Delivery',
        icon: Truck,
        color: 'text-[#F97316]',
        bg: 'bg-[#F97316]/10',
        activeBg: 'bg-[#F97316]',
        borderColor: 'border-[#F97316]/30',
    },
    DELIVERED: {
        label: 'Delivered',
        icon: ShieldCheck,
        color: 'text-green-600',
        bg: 'bg-green-50',
        activeBg: 'bg-green-600',
        borderColor: 'border-green-300',
    },
    CANCELLED: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        activeBg: 'bg-red-500',
        borderColor: 'border-red-300',
    },
    RETURN_REQUESTED: {
        label: 'Return Requested',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        activeBg: 'bg-orange-500',
        borderColor: 'border-orange-300',
    },
    RETURNED: {
        label: 'Returned',
        icon: RotateCcw,
        color: 'text-slate-600',
        bg: 'bg-slate-100',
        activeBg: 'bg-slate-600',
        borderColor: 'border-slate-300',
    },
    REPLACEMENT_REQUESTED: {
        label: 'Replacement Requested',
        icon: HelpCircle, // Will need to import or use AlertTriangle
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        activeBg: 'bg-blue-500',
        borderColor: 'border-blue-300',
    },
    REPLACED: {
        label: 'Replaced',
        icon: RefreshCw,
        color: 'text-green-600',
        bg: 'bg-green-50',
        activeBg: 'bg-green-600',
        borderColor: 'border-green-300',
    },
}

const getNextStatus = (current) => {
    if (current === 'CANCELLED' || current === 'DELIVERED') return null
    const idx = STATUS_FLOW.indexOf(current)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
}

const getStatusIndex = (status) => {
    if (status === 'CANCELLED') return -1
    return STATUS_FLOW.indexOf(status)
}

// ── Order Stepper Component ────────────────────────────────────────────
const OrderStepper = ({ currentStatus }) => {
    const currentIdx = getStatusIndex(currentStatus)
    const isCancelled = currentStatus === 'CANCELLED'

    return (
        <div className="w-full">
            {isCancelled ? (
                <div className="flex items-center justify-center gap-3 py-4 px-6 bg-red-50 border border-red-200 rounded-xl">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-600">Order Cancelled</span>
                </div>
            ) : (
                <div className="flex items-center w-full">
                    {STATUS_FLOW.map((status, idx) => {
                        const config = STATUS_CONFIG[status]
                        const Icon = config.icon
                        const isCompleted = idx < currentIdx
                        const isActive = idx === currentIdx
                        const isPending = idx > currentIdx

                        return (
                            <div key={status} className="flex items-center flex-1 last:flex-none">
                                {/* Step circle */}
                                <div className="flex flex-col items-center gap-1.5 relative">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: isActive ? 1.1 : 1 }}
                                        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                                            isCompleted
                                                ? `${config.activeBg} text-white shadow-md`
                                                : isActive
                                                    ? `${config.activeBg} text-white ring-4 ring-offset-2 ${config.borderColor} shadow-lg`
                                                    : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <Icon className="h-4 w-4" />
                                        )}
                                    </motion.div>
                                    <span className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                                        isActive ? config.color : isCompleted ? 'text-slate-700' : 'text-slate-400'
                                    }`}>
                                        {config.label}
                                    </span>
                                </div>

                                {/* Connector line */}
                                {idx < STATUS_FLOW.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-1.5 mt-[-18px]">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                idx < currentIdx ? 'bg-green-400' : 'bg-slate-200'
                                            }`}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Status Timeline Component ──────────────────────────────────────────
const StatusTimeline = ({ history = [] }) => {
    const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    // Filter out adjacent duplicates (keep the latest one)
    const refined = sorted.filter((entry, i) => {
        const nextEntry = sorted[i + 1]
        return !nextEntry || entry.status !== nextEntry.status
    })

    if (refined.length === 0) return null

    return (
        <div className="space-y-0">
            {refined.map((entry, i) => {
                const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.PLACED
                const Icon = config.icon
                const isLatest = i === 0

                return (
                    <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center ${isLatest ? config.activeBg + ' text-white' : config.bg + ' ' + config.color} border ${config.borderColor}`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            {i < refined.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-0.5 min-h-[24px]" />}
                        </div>
                        <div className={`pb-6 ${isLatest ? '' : 'opacity-70'}`}>
                            <p className={`text-sm font-semibold ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>
                                {config.label}
                            </p>
                            <p className="text-xs text-slate-400">
                                {entry.timestamp ? format(new Date(entry.timestamp), 'MMM dd, yyyy · h:mm a') : ''}
                            </p>
                            {entry.comment && (
                                <p className="text-xs text-slate-500 mt-0.5">{entry.comment}</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────
const AdminOrders = () => {
    const { user } = useAuthStore()
    const isVendor = user?.role === 'VENDOR'

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [tempDeliveryBoyId, setTempDeliveryBoyId] = useState('')
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // Confirmation dialog state
    const [confirmAction, setConfirmAction] = useState(null) // { type: 'advance' | 'cancel', status, label }

    useEffect(() => {
        if (selectedOrder) {
            setTempDeliveryBoyId(selectedOrder.deliveryBoyId?._id || selectedOrder.deliveryBoyId || '')
        }
    }, [selectedOrder])

    const queryClient = useQueryClient()

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['adminOrders', statusFilter],
        queryFn: () => getOrders({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        refetchInterval: 5000, // Poll every 5s to reflect delivery updates instantly
    })

    const { data: deliveryBoys } = useQuery({
        queryKey: ['deliveryBoys'],
        queryFn: () => getUsers({ role: 'DELIVERY' }),
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status, deliveryBoyId, estimatedDeliveryDate }) =>
            updateOrderStatus(orderId, { status, deliveryBoyId, estimatedDeliveryDate }),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['adminOrders'])
            // Update the selected order in-place so the modal reflects the change
            if (data?.data) {
                setSelectedOrder(prev => ({ ...prev, ...data.data }))
            }
            toast({
                title: "Status Updated",
                description: `Order status changed successfully`,
            })
        },
        onError: (err) => {
            toast({
                title: "Update Failed",
                description: err?.response?.data?.message || err?.message || "Failed to update order status",
                variant: "destructive",
            })
        },
    })

    const handleAdvanceStatus = () => {
        if (!selectedOrder) return
        const nextStatus = getNextStatus(selectedOrder.orderStatus)
        if (!nextStatus) return

        // Require delivery partner before shipping
        if (nextStatus === 'SHIPPED') {
            const deliveryId = tempDeliveryBoyId || selectedOrder.deliveryBoyId?._id || selectedOrder.deliveryBoyId
            if (!deliveryId || deliveryId === 'unassigned') {
                toast({
                    title: "Delivery partner required",
                    description: "Please assign a delivery partner before marking as Shipped",
                    variant: "destructive",
                })
                return
            }
        }

        setConfirmAction({
            type: 'advance',
            status: nextStatus,
            label: STATUS_CONFIG[nextStatus].label,
        })
    }

    const handleCancelOrder = () => {
        if (!selectedOrder) return
        setConfirmAction({
            type: 'cancel',
            status: 'CANCELLED',
            label: 'Cancelled',
        })
    }

    const executeStatusChange = () => {
        if (!confirmAction || !selectedOrder) return
        const deliveryId = tempDeliveryBoyId || selectedOrder.deliveryBoyId?._id || selectedOrder.deliveryBoyId
        updateStatusMutation.mutate({
            orderId: selectedOrder.orderId || selectedOrder._id,
            status: confirmAction.status,
            deliveryBoyId: (confirmAction.status === 'SHIPPED' && deliveryId && deliveryId !== 'unassigned') ? deliveryId : undefined,
        })
        setConfirmAction(null)
    }

    const getStatusBadgeColor = (status) => {
        const config = STATUS_CONFIG[status]
        return config ? `${config.bg} ${config.color} ${config.borderColor}` : 'bg-slate-100 text-slate-700'
    }

    const getPaymentColor = (status) => {
        if (status === 'PAID') return 'bg-green-50 text-green-700 border-green-200'
        if (status === 'FAILED') return 'bg-red-50 text-red-700 border-red-200'
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }

    const orders = ordersData?.orders || []
    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const nextStatus = selectedOrder ? getNextStatus(selectedOrder.orderStatus) : null
    const canCancel = selectedOrder && !['DELIVERED', 'CANCELLED'].includes(selectedOrder.orderStatus)
    const needsDeliveryPartner = selectedOrder && selectedOrder.orderStatus === 'CONFIRMED' &&
        !selectedOrder.deliveryBoyId && !tempDeliveryBoyId

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Orders</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage and track customer orders efficiently
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 self-center hidden md:block mx-2"></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[220px] h-14 border-none bg-transparent focus:ring-0 text-base font-medium text-slate-700">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="PLACED">Placed</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Order ID</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Customer</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Date</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Total</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Payment</TableHead>
                            <TableHead className="py-5 pr-6 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading orders..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Package className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-600">No orders found</p>
                                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => {
                                const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED
                                const StatusIcon = config.icon
                                return (
                                    <TableRow
                                        key={order._id || order.orderId}
                                        className="hover:bg-slate-50 transition-colors border-slate-50 group cursor-pointer"
                                        onClick={() => {
                                            setSelectedOrder(order)
                                            setIsDetailsOpen(true)
                                        }}
                                    >
                                        <TableCell className="py-4 pl-6 font-medium text-slate-900">
                                            #{order.orderId}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{order.userId?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-slate-500">{order.userId?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-900 text-lg">
                                                ₹{order.totalAmount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {order.items?.length} items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1.5 py-1 px-3 ${getStatusBadgeColor(order.orderStatus)}`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1.5 py-1 px-3 ${getPaymentColor(order.paymentStatus)}`}>
                                                <CreditCard className="h-3 w-3" />
                                                {order.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-full hover:bg-white hover:text-[#1E3A8A] hover:shadow-md border border-transparent hover:border-slate-100 transition-all text-slate-400"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Order Details Dialog ── */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[90vh] bg-white p-0 gap-0 border-none shadow-2xl rounded-2xl flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 border-b border-slate-100 bg-white flex-shrink-0 z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-bold font-syne text-[#1E3A8A] flex items-center gap-3">
                                    Order #{selectedOrder?.orderId}
                                </DialogTitle>
                                <p className="text-slate-500 mt-1 flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    Placed on {selectedOrder && format(new Date(selectedOrder.createdAt), 'PPP p')}
                                </p>
                            </div>
                            <Badge variant="outline" className={`text-sm px-3 py-1 ${selectedOrder && getStatusBadgeColor(selectedOrder.orderStatus)}`}>
                                {selectedOrder && (STATUS_CONFIG[selectedOrder.orderStatus]?.label || selectedOrder.orderStatus)}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6">

                            {/* ── Visual Stepper ── */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-sm mb-5 text-slate-500 uppercase tracking-wider">Order Progress</h3>
                                <OrderStepper currentStatus={selectedOrder.orderStatus} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column: Details */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Order Items */}
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 text-slate-900 flex items-center gap-2">
                                            <Package className="h-5 w-5 text-[#F97316]" />
                                            Order Items
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedOrder.items?.filter(item => !isVendor || item.vendorId === user.userId || item.vendorId?._id === user.userId).map((item, i) => (
                                                <div key={i} className="flex gap-4 items-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                                                    <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt="" className="h-full w-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Package className="h-8 w-8 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{item.nameSnapshot}</p>
                                                        {item.variantAttributesSnapshot && Object.keys(item.variantAttributesSnapshot).length > 0 && (
                                                            <div className="flex gap-1.5 flex-wrap mt-1">
                                                                {Object.entries(item.variantAttributesSnapshot).map(([key, value]) => (
                                                                    <span key={key} className="text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                                                        <span className="font-bold text-slate-500">{key}:</span> {value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-sm text-slate-500 mt-1.5">Qty: {item.quantity} × ₹{item.priceSnapshot.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-[#1E3A8A]">₹{(item.priceSnapshot * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                                            <span className="font-medium text-slate-500">Total Amount</span>
                                            <span className="text-3xl font-bold text-[#1E3A8A] font-syne">₹{selectedOrder.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Customer & Shipping */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Customer Info */}
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <User className="h-5 w-5 text-[#1E3A8A]" />
                                                Customer Details
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Name</p>
                                                    <p className="font-medium text-slate-900">{selectedOrder.userId?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Email</p>
                                                    <p className="font-medium text-slate-900">{selectedOrder.userId?.email}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Phone</p>
                                                    <p className="font-medium text-slate-900">{selectedOrder.addressSnapshot?.phone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shipping Info */}
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-[#1E3A8A]" />
                                                Shipping Address
                                            </h3>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    {selectedOrder.addressSnapshot?.addressLine1}
                                                    {selectedOrder.addressSnapshot?.addressLine2 && <><br />{selectedOrder.addressSnapshot.addressLine2}</>}
                                                    <br />
                                                    {selectedOrder.addressSnapshot?.city}, {selectedOrder.addressSnapshot?.state}
                                                    <br />
                                                    PIN: <span className="font-mono font-medium text-slate-900">{selectedOrder.addressSnapshot?.pincode}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status History Timeline */}
                                    {selectedOrder.statusHistory?.length > 0 && (
                                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-[#F97316]" />
                                                Status History
                                            </h3>
                                            <StatusTimeline history={selectedOrder.statusHistory} />
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h3 className="font-bold text-lg mb-6 text-slate-900">Manage Order</h3>

                                        {/* Delivery Partner Assignment */}
                                        <div className="mb-6 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Delivery Partner
                                                </label>
                                                {selectedOrder.deliveryBoyId && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                                                        Assigned
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Warning if partner needed */}
                                            {needsDeliveryPartner && (
                                                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                    <p className="text-xs text-amber-700 font-medium">
                                                        Assign a delivery partner before shipping
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Select
                                                    value={tempDeliveryBoyId || "unassigned"}
                                                    onValueChange={setTempDeliveryBoyId}
                                                >
                                                    <SelectTrigger className="flex-1 h-11 bg-slate-50 border-slate-200 focus:ring-orange-500">
                                                        <SelectValue placeholder="Assign Delivery Partner" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned" className="text-slate-500">Select Partner</SelectItem>
                                                        {deliveryBoys?.users?.map(boy => (
                                                            <SelectItem key={boy._id} value={boy._id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                        {boy.name.charAt(0)}
                                                                    </div>
                                                                    <span>{boy.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    onClick={() => {
                                                        if (tempDeliveryBoyId && tempDeliveryBoyId !== "unassigned") {
                                                            updateStatusMutation.mutate({
                                                                orderId: selectedOrder.orderId || selectedOrder._id,
                                                                status: selectedOrder.orderStatus,
                                                                deliveryBoyId: tempDeliveryBoyId
                                                            })
                                                        }
                                                    }}
                                                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                                                    disabled={updateStatusMutation.isPending || !tempDeliveryBoyId || tempDeliveryBoyId === 'unassigned' || tempDeliveryBoyId === (selectedOrder.deliveryBoyId?._id || selectedOrder.deliveryBoyId)}
                                                >
                                                    Save
                                                </Button>
                                            </div>

                                            {selectedOrder.deliveryBoyId && (
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold border border-green-200">
                                                        {selectedOrder.deliveryBoyId.name?.charAt(0) || 'D'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {selectedOrder.deliveryBoyId.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {selectedOrder.deliveryBoyId.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-slate-100 mb-6"></div>

                                        {/* Status Actions */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Status</label>

                                            {/* Next step button */}
                                            {nextStatus && (
                                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                                    <Button
                                                        onClick={handleAdvanceStatus}
                                                        disabled={updateStatusMutation.isPending}
                                                        className="w-full h-12 rounded-xl gap-2 bg-[#1E3A8A] hover:bg-[#15306B] text-white shadow-lg shadow-[#1E3A8A]/20 text-sm font-semibold"
                                                    >
                                                        {updateStatusMutation.isPending ? (
                                                            <PremiumLoader size="small" text="" />
                                                        ) : (
                                                            <>
                                                                <ArrowRight className="h-4 w-4" />
                                                                Advance to {STATUS_CONFIG[nextStatus].label}
                                                            </>
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            )}

                                            {/* Delivered state */}
                                            {selectedOrder.orderStatus === 'DELIVERED' && (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                                                    <ShieldCheck className="h-5 w-5" />
                                                    <span className="text-sm font-semibold">Order Delivered Successfully</span>
                                                </div>
                                            )}

                                            {/* Cancelled state */}
                                            {selectedOrder.orderStatus === 'CANCELLED' && (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600">
                                                    <XCircle className="h-5 w-5" />
                                                    <span className="text-sm font-semibold">Order Cancelled</span>
                                                </div>
                                            )}

                                            {/* Cancel button */}
                                            {canCancel && (
                                                <Button
                                                    onClick={handleCancelOrder}
                                                    variant="outline"
                                                    disabled={updateStatusMutation.isPending}
                                                    className="w-full h-10 rounded-xl gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-sm"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Cancel Order
                                                </Button>
                                            )}

                                            {/* Estimated Delivery Date Management */}
                                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Delivery</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="date"
                                                        value={selectedOrder.estimatedDeliveryDate ? new Date(selectedOrder.estimatedDeliveryDate).toISOString().split('T')[0] : ''}
                                                        onChange={(e) => {
                                                            updateStatusMutation.mutate({
                                                                orderId: selectedOrder.orderId || selectedOrder._id,
                                                                status: selectedOrder.orderStatus,
                                                                estimatedDeliveryDate: e.target.value
                                                            })
                                                        }}
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1E3A8A]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Return/Replacement Specific Actions */}
                                            {['RETURN_REQUESTED', 'REPLACEMENT_REQUESTED'].includes(selectedOrder.orderStatus) && (
                                                <div className="pt-4 space-y-3">
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Request Reason</p>
                                                        <p className="text-sm text-blue-900 italic">"{selectedOrder.returnReason || 'No reason provided'}"</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                const nextStatus = selectedOrder.orderStatus === 'RETURN_REQUESTED' ? 'RETURNED' : 'REPLACED'
                                                                setConfirmAction({
                                                                    type: 'advance',
                                                                    status: nextStatus,
                                                                    label: `Approve & Mark as ${STATUS_CONFIG[nextStatus].label}`
                                                                })
                                                            }}
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                // Revert to DELIVERED if rejected
                                                                setConfirmAction({
                                                                    type: 'advance',
                                                                    status: 'DELIVERED',
                                                                    label: 'Reject Request (Reset to Delivered)'
                                                                })
                                                            }}
                                                            variant="outline"
                                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Confirmation Dialog ── */}
            <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {confirmAction?.type === 'cancel' ? (
                                <>
                                    <XCircle className="h-5 w-5 text-red-500" />
                                    Cancel this order?
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-5 w-5 text-[#1E3A8A]" />
                                    Advance to {confirmAction?.label}?
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.type === 'cancel'
                                ? 'This action cannot be undone. The customer will be notified that their order has been cancelled.'
                                : `Order #${selectedOrder?.orderId} will be updated to "${confirmAction?.label}". The customer will be able to see this status change.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Go Back</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeStatusChange}
                            className={`rounded-xl ${confirmAction?.type === 'cancel'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-[#1E3A8A] hover:bg-[#15306B] text-white'
                                }`}
                        >
                            {confirmAction?.type === 'cancel' ? 'Yes, Cancel Order' : `Yes, Mark as ${confirmAction?.label}`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default AdminOrders