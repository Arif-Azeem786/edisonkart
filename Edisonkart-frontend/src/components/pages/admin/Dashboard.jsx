import { motion } from 'framer-motion'
import {
    DollarSign,
    ShoppingBag,
    Users,
    Package,
    ArrowRight
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '../../../services/admin'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import PremiumLoader from '../../ui/PremiumLoader'
import useAuthStore from '../../../store/authStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table"

const Dashboard = () => {
    const { user } = useAuthStore()
    const isVendor = user?.role === 'VENDOR'

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: getDashboardStats,
        refetchInterval: 30000 // Refresh every 30 seconds
    })

    const stats = dashboardData?.stats || {
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0
    }

    const recentOrders = dashboardData?.recentOrders || []

    const allStatCards = [
        {
            title: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500',
            bg: 'bg-green-500/10',
            text: 'text-green-600',
            hideForVendor: false
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingBag,
            color: 'bg-[#1E3A8A]',
            bg: 'bg-[#1E3A8A]/10',
            text: 'text-[#1E3A8A]',
            hideForVendor: false
        },
        {
            title: 'Total Customers',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: 'bg-[#1E3A8A]',
            bg: 'bg-[#1E3A8A]/10',
            text: 'text-[#1E3A8A]',
            hideForVendor: true
        },
        {
            title: 'Products in Stock',
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            color: 'bg-[#F97316]',
            bg: 'bg-[#F97316]/10',
            text: 'text-[#F97316]',
            hideForVendor: false
        },
    ]

    const statCards = allStatCards.filter(card => !isVendor || !card.hideForVendor)

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading dashboard stats..." />
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 mt-1">Overview of your store performance</p>
            </div>

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isVendor ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 mb-8`}>
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

            {/* Recent Orders */}
            <motion.div
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold font-syne text-[#1E3A8A]">Recent Orders</h3>
                    <Link to="/admin/orders">
                        <Button variant="outline" className="gap-2 border-[#1E3A8A]/20 text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-all rounded-full">
                            View All Orders
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No orders found
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="font-semibold text-slate-500">Order ID</TableHead>
                                        <TableHead className="font-semibold text-slate-500">Customer</TableHead>
                                        <TableHead className="font-semibold text-slate-500">Amount</TableHead>
                                        <TableHead className="font-semibold text-slate-500">Status</TableHead>
                                        <TableHead className="font-semibold text-slate-500 text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.map((order) => (
                                        <TableRow key={order._id} className="hover:bg-slate-50 transition-colors border-slate-50">
                                            <TableCell className="font-medium text-[#1E3A8A]">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{order.userId?.name || 'Guest'}</span>
                                                    <span className="text-xs text-slate-500">{order.userId?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900">
                                                ₹{order.totalAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(order.orderStatus)}>
                                                    {order.orderStatus.replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500 text-right">
                                                {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default Dashboard