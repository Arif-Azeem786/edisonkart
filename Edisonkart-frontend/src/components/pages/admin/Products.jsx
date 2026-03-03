import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Filter,
    MoreVertical,
    Package,
    AlertCircle,
    Tag,
    Layers,
    DollarSign,
    Box,
    ExternalLink
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
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const AdminProducts = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms delay
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [page, setPage] = useState(1)
    const limit = 10

    const queryClient = useQueryClient()

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['adminProducts', debouncedSearchTerm, categoryFilter, statusFilter, page], // Added page
        queryFn: () => {
            const params = {
                search: debouncedSearchTerm,
                page,
                limit
            };
            if (categoryFilter !== 'all') {
                params.category = categoryFilter;
            }
            if (statusFilter !== 'all') {
                params.isActive = statusFilter === 'active' ? 'true' : 'false';
            }
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
            queryClient.invalidateQueries(['adminProducts'])
            toast({
                title: "Success",
                description: "Product deleted successfully",
            })
        },
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => updateProduct(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminProducts'])
            toast({
                title: "Success",
                description: "Product status updated",
            })
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update status",
                variant: "destructive"
            })
        }
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
                    <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Products</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage your product inventory
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedProduct(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium px-6 h-12"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Product
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search products by name, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400"
                    />
                </div>

                <div className="h-10 w-px bg-slate-200 self-center hidden md:block mx-2"></div>

                <div className="flex gap-2 p-1">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] h-12 rounded-xl bg-slate-50 border-transparent hover:bg-slate-100 focus:ring-0 text-slate-600 font-medium">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] h-12 rounded-xl bg-slate-50 border-transparent hover:bg-slate-100 focus:ring-0 text-slate-600 font-medium">
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

            {/* Pagination Top */}
            <div className="flex justify-end">
                <Pagination 
                    page={productsData?.pagination?.page || 1}
                    pages={productsData?.pagination?.pages || 1}
                    onPageChange={setPage}
                />
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Product</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Category</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Price</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading products..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <Package className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-600">No products found</p>
                                        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow
                                    key={product._id}
                                    className="hover:bg-slate-50 transition-colors border-slate-50 group"
                                >
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                                                <img
                                                    src={product.imageIds?.[0]
                                                        ? `${import.meta.env.VITE_API_URL}/products/image/${product.imageIds[0]}`
                                                        : NO_IMAGE_PLACEHOLDER
                                                    }
                                                    alt={product.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[#1E3A8A] text-base group-hover:text-[#F97316] transition-colors">{product.name}</p>
                                                    {(product.isFlashSale === true || product.isFlashSale === 'true') && (
                                                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] h-5 px-1.5 animate-pulse border-none">
                                                            FLASH
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                                                    {((product.description || '').replace(/<[^>]*>/g, '').trim().slice(0, 40) || '') + (((product.description || '').replace(/<[^>]*>/g, '').trim().length > 40) ? '...' : '')}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-[#F97316]/5 text-[#F97316] border-[#F97316]/20 font-medium whitespace-nowrap w-fit">
                                            <Layers className="h-3 w-3" />
                                            {product.categoryId?.name || 'Uncategorized'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            {product.discountPrice ? (
                                                <>
                                                    <div className="flex items-center gap-1 font-bold text-[#F97316] text-lg">
                                                        <span className="text-[#F97316] text-sm font-normal">₹</span>
                                                        {product.discountPrice.toLocaleString()}
                                                    </div>
                                                    <span className="text-xs text-slate-400 line-through">₹{product.price.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1 font-bold text-slate-900 text-lg">
                                                    <span className="text-slate-400 text-sm font-normal">₹</span>
                                                    {product.price.toLocaleString()}
                                                </div>
                                            )}
                                            {(product.isFlashSale === true || product.isFlashSale === 'true') && (
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-1">
                                                    ⚡ Sale Active
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => toggleStatus(product)}
                                            disabled={updateStatusMutation.isPending}
                                            className="flex flex-col gap-1.5 cursor-pointer hover:opacity-80 transition-opacity text-left group/status"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full transition-colors ${product.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                <span className={`text-sm font-medium transition-colors ${product.isActive ? 'text-green-700' : 'text-slate-500'}`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 pl-4 group-hover/status:text-[#1E3A8A] transition-colors">
                                                <span className={`${product.stock > 0 ? 'text-slate-500' : 'text-red-500 font-medium'}`}>
                                                    {product.stock} in stock
                                                </span>
                                            </div>
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-lg hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] border-slate-200 text-slate-400 transition-all"
                                                onClick={() => {
                                                    setSelectedProduct(product)
                                                    setIsModalOpen(true)
                                                }}
                                                title="Edit Product"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 border-slate-200 text-slate-400 transition-all"
                                                onClick={() => handleDelete(product._id)}
                                                title="Delete Product"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 w-9 p-0 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-800 border-slate-200 text-slate-400 transition-all hidden sm:inline-flex"
                                                onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                                                title="View in Store"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Bottom */}
            <div className="flex justify-center py-4">
                <Pagination 
                    page={productsData?.pagination?.page || 1}
                    pages={productsData?.pagination?.pages || 1}
                    onPageChange={setPage}
                />
            </div>
        </div>
    )
}

export default AdminProducts