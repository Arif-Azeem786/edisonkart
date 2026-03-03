import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Search,
    Eye,
    Package,
    Calendar,
    Clock,
    CreditCard,
    ArrowRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../../../services/order'
import { format } from 'date-fns'
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
import { Badge } from '../../ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select'

const STATUS_CONFIG = {
    PLACED: { label: 'Placed', color: 'bg-slate-100 text-slate-600' },
    CONFIRMED: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700' },
    SHIPPED: { label: 'Shipped', color: 'bg-amber-100 text-amber-700' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
    DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

const SellerOrders = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['sellerOrders', statusFilter],
        queryFn: () => getOrders({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    })

    const orders = ordersData?.orders || []
    const filteredOrders = orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-indigo-900">Manage Orders</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Track and process orders containing your products
                    </p>
                </div>
            </div>

            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by Order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px] h-14 border-none bg-transparent">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="PLACED">Placed</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow>
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Order ID</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Date</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Total Items</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 pr-6 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <PremiumLoader size="small" text="Loading orders..." />
                                </TableCell>
                            </TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Package className="h-12 w-12 mb-4 opacity-20" />
                                        <p>No orders found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => {
                                const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                                return (
                                    <TableRow key={order._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                                        <TableCell className="py-4 pl-6 font-bold text-slate-900">
                                            #{order.orderId}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-700">
                                                {order.items?.length} items
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={config.color}>
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
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
        </div>
    )
}

export default SellerOrders
