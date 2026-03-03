import { motion } from 'framer-motion'
import {
    ShoppingBag,
    Package,
    ArrowRight,
    TrendingUp,
    Clock,
    CheckCircle2
} from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { useQuery } from '@tanstack/react-query'
import { getAdminProducts } from '../../../services/product' // Reusing but will be filtered by backend
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import PremiumLoader from '../../ui/PremiumLoader'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../ui/table"

const SellerDashboard = () => {
    // For now, we'll fetch products and derive some basic stats. 
    // In a real app, we'd have a specific getSellerDashboardStats API.
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['sellerProducts'],
        queryFn: () => getAdminProducts({ limit: 5 }),
    })

    const products = productsData?.products || []
    
    const stats = [
        {
            title: 'Active Listings',
            value: products.filter(p => p.isActive).length,
            icon: Package,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            trend: '+2 new this week'
        },
        {
            title: 'Out of Stock',
            value: products.filter(p => p.stock === 0).length,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            trend: 'Needs attention'
        },
        {
            title: 'Total Products',
            value: productsData?.pagination?.total || 0,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: 'Showing all'
        }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <PremiumLoader text="Loading seller stats..." />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 font-syne">Welcome back, Seller!</h1>
                <p className="text-slate-500 mt-1">Here's what's happening with your products today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-medium text-slate-400">{stat.trend}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions & Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Products */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-indigo-900 font-syne">My Recent Listings</h3>
                        <Link to="/seller/products">
                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                View All
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {products.length === 0 ? (
                            <p className="text-center py-8 text-slate-400">No products listed yet.</p>
                        ) : (
                            products.map((product) => (
                                <div key={product._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                        <img 
                                            src={product.imageIds?.[0] ? `${import.meta.env.VITE_API_URL}/products/image/${product.imageIds[0]}` : '/placeholder.png'} 
                                            alt="" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{product.name}</p>
                                        <p className="text-sm text-slate-500">₹{product.price.toLocaleString()} • {product.stock} in stock</p>
                                    </div>
                                    <Badge className={product.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                        {product.isActive ? 'Active' : 'Hidden'}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Seller Tips / Onboarding Overlay */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl text-white shadow-lg shadow-indigo-600/20 flex flex-col justify-between"
                >
                    <div>
                        <h3 className="text-2xl font-bold font-syne mb-2 text-white">Grow your Business</h3>
                        <p className="text-indigo-100 mb-6">Learn how to optimize your product listings and reach more customers on EdisonKart.</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-white/20 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-sm text-indigo-50">High-quality images increase conversion by 40%</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-1 rounded-full bg-white/20 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-sm text-indigo-50">Detailed descriptions help reduce returns</p>
                            </div>
                        </div>
                    </div>

                    <Link to="/seller/products" className="mt-8">
                        <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-6 rounded-2xl text-lg group">
                            Add First Product
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}

export default SellerDashboard
