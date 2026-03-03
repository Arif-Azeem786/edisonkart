import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    Layers,
    Tag,
    ExternalLink,
    AlertCircle
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
import { Badge } from '../../ui/badge'
import ProductModal from '../../admin/ProductModal'
import Pagination from '../../ui/Pagination'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminProducts, deleteProduct, updateProduct } from '../../../services/product'
import { getCategories } from '../../../services/category'
import { toast } from '../../ui/use-toast'
import { NO_IMAGE_PLACEHOLDER } from '../../ui/imageUtils'

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const SellerProducts = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 500)
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [page, setPage] = useState(1)
    const limit = 10

    const queryClient = useQueryClient()

    // The backend now automatically filters by vendorId for VENDOR role
    const { data: productsData, isLoading } = useQuery({
        queryKey: ['sellerProducts', debouncedSearchTerm, categoryFilter, statusFilter, page],
        queryFn: () => {
            const params = {
                search: debouncedSearchTerm,
                page,
                limit
            };
            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (statusFilter !== 'all') params.isActive = statusFilter === 'active' ? 'true' : 'false';
            return getAdminProducts(params);
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    })

    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries(['sellerProducts'])
            toast({ title: "Success", description: "Product deleted successfully" })
        },
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => updateProduct(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries(['sellerProducts'])
            toast({ title: "Success", description: "Product status updated" })
        },
    })

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(id)
        }
    }

    const toggleStatus = (product) => {
        updateStatusMutation.mutate({
            id: product._id,
            isActive: !product.isActive
        })
    }

    const products = productsData?.products || []

    return (
        <div className="space-y-8">
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedProduct(null)
                }}
                product={selectedProduct}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-indigo-900">My Products</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage your store's inventory and listings
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedProduct(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all font-medium px-6 h-12"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    List New Product
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search your products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base"
                    />
                </div>
                <div className="flex gap-2 p-1">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] h-12 rounded-xl bg-slate-50 border-transparent">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((c) => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] h-12 rounded-xl bg-slate-50 border-transparent">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Product</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Stock</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Price</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <PremiumLoader size="small" text="Loading your inventory..." />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Package className="h-12 w-12 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No products listed</p>
                                        <p className="text-sm">Start by adding your first product to EdisonKart</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                <img
                                                    src={product.imageIds?.[0] ? `${import.meta.env.VITE_API_URL}/products/image/${product.imageIds[0]}` : NO_IMAGE_PLACEHOLDER}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500">{product.categoryId?.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`font-semibold ${product.stock < 10 ? 'text-red-500' : 'text-slate-700'}`}>
                                                {product.stock} units
                                            </span>
                                            {product.stock < 10 && (
                                                <span className="text-[10px] font-bold text-red-400 uppercase">Low Stock</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-indigo-600">₹{product.price.toLocaleString()}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            onClick={() => toggleStatus(product)}
                                            className={`cursor-pointer transition-all ${product.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                        >
                                            {product.isActive ? 'Active' : 'Hidden'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600"
                                                onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-center pb-8">
                <Pagination page={productsData?.pagination?.page || 1} pages={productsData?.pagination?.pages || 1} onPageChange={setPage} />
            </div>
        </div>
    )
}

export default SellerProducts
