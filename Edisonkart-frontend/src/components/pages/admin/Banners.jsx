import { useState } from 'react'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Image as ImageIcon,
    ArrowUpDown,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../../services/banner'
import { getProductImage } from '../../../services/product'
import { toast } from '../../ui/use-toast'

const LINK_TYPES = [
    { value: 'category', label: 'Category' },
    { value: 'product', label: 'Product' },
    { value: 'url', label: 'URL' },
    { value: 'flash-sale', label: 'Flash Sale' },
]

const initialFormState = {
    title: '',
    subtitle: '',
    image: null,
    backgroundColor: '#1E3A8A',
    linkType: 'category',
    linkValue: '',
    isActive: true,
    sortOrder: 0,
}

const AdminBanners = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState(null)
    const [formData, setFormData] = useState(initialFormState)
    const [imagePreview, setImagePreview] = useState(null)

    const queryClient = useQueryClient()

    const { data: banners, isLoading } = useQuery({
        queryKey: ['adminBanners'],
        queryFn: getAllBanners,
    })

    const createMutation = useMutation({
        mutationFn: createBanner,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminBanners'])
            closeModal()
            toast({ title: 'Success', description: 'Banner created successfully' })
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: typeof error === 'string' ? error : error?.message || 'Failed to create banner',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateBanner(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminBanners'])
            closeModal()
            toast({ title: 'Success', description: 'Banner updated successfully' })
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: typeof error === 'string' ? error : error?.message || 'Failed to update banner',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteBanner,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminBanners'])
            toast({ title: 'Success', description: 'Banner deleted successfully' })
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: typeof error === 'string' ? error : error?.message || 'Failed to delete banner',
                variant: 'destructive',
            })
        },
    })

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => {
            const fd = new FormData()
            fd.append('isActive', isActive)
            return updateBanner(id, fd)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminBanners'])
            toast({ title: 'Success', description: 'Banner status updated' })
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: typeof error === 'string' ? error : error?.message || 'Failed to update status',
                variant: 'destructive',
            })
        },
    })

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingBanner(null)
        setFormData(initialFormState)
        setImagePreview(null)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData({ ...formData, image: file })
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const fd = new FormData()
        fd.append('title', formData.title)
        fd.append('subtitle', formData.subtitle)
        fd.append('backgroundColor', formData.backgroundColor)
        fd.append('linkType', formData.linkType)
        fd.append('linkValue', formData.linkValue)
        fd.append('isActive', formData.isActive)
        fd.append('sortOrder', formData.sortOrder)
        if (formData.image) {
            fd.append('image', formData.image)
        }

        if (editingBanner) {
            updateMutation.mutate({ id: editingBanner._id, data: fd })
        } else {
            createMutation.mutate(fd)
        }
    }

    const handleEdit = (banner) => {
        setEditingBanner(banner)
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            image: null,
            backgroundColor: banner.backgroundColor || '#1E3A8A',
            linkType: banner.linkType || 'category',
            linkValue: banner.linkValue || '',
            isActive: banner.isActive ?? true,
            sortOrder: banner.sortOrder ?? 0,
        })
        setImagePreview(banner.image ? getProductImage(banner.image) : null)
        setIsModalOpen(true)
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            deleteMutation.mutate(id)
        }
    }

    const filteredBanners = banners?.filter(b =>
        (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const isSaving = createMutation.isPending || updateMutation.isPending

    return (
        <div className="space-y-8">
            <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-syne text-[#1E3A8A] text-2xl">
                            {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Banner title"
                                required
                                className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Subtitle</label>
                            <Input
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                placeholder="Banner subtitle"
                                className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Banner Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#F97316]/10 file:text-[#F97316] hover:file:bg-[#F97316]/20 cursor-pointer"
                            />
                            {imagePreview && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Background Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.backgroundColor}
                                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                        className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer p-1"
                                    />
                                    <Input
                                        value={formData.backgroundColor}
                                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                        placeholder="#1E3A8A"
                                        className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20 flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Sort Order</label>
                                <Input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Link Type</label>
                                <select
                                    value={formData.linkType}
                                    onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
                                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/20 focus:outline-none"
                                >
                                    {LINK_TYPES.map(lt => (
                                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Link Value</label>
                                <Input
                                    value={formData.linkValue}
                                    onChange={(e) => setFormData({ ...formData, linkValue: e.target.value })}
                                    placeholder={formData.linkType === 'url' ? 'https://...' : 'ID or slug'}
                                    className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="bannerIsActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 text-[#F97316] border-slate-300 rounded focus:ring-[#F97316]"
                            />
                            <label htmlFor="bannerIsActive" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                                Active Status
                            </label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" disabled={isSaving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                                {isSaving ? 'Saving...' : (editingBanner ? 'Update' : 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Banners</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage homepage banners and promotions
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingBanner(null)
                        setFormData(initialFormState)
                        setImagePreview(null)
                        setIsModalOpen(true)
                    }}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium px-6 h-12"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Banner
                </Button>
            </div>

            {/* Search */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search banners..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Image</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Title</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600 hidden md:table-cell">Subtitle</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600 hidden lg:table-cell">Link Type</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600 hidden sm:table-cell">
                                <div className="flex items-center gap-1">
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                    Order
                                </div>
                            </TableHead>
                            <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading banners..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredBanners.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                                    No banners found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBanners.map((banner) => (
                                <TableRow key={banner._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                                    <TableCell className="py-3 pl-6">
                                        {banner.image ? (
                                            <img
                                                src={getProductImage(banner.image)}
                                                alt={banner.title}
                                                className="h-12 w-20 object-cover rounded-lg border border-slate-200"
                                            />
                                        ) : (
                                            <div className="h-12 w-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 text-slate-300" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 font-medium text-slate-900">
                                        {banner.title}
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-500 hidden md:table-cell max-w-[200px] truncate">
                                        {banner.subtitle || '—'}
                                    </TableCell>
                                    <TableCell className="py-4 hidden lg:table-cell">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                                            {banner.linkType || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => toggleStatusMutation.mutate({ id: banner._id, isActive: !banner.isActive })}
                                            disabled={toggleStatusMutation.isPending}
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-all ${banner.isActive
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                }`}
                                            title={banner.isActive ? 'Click to deactivate' : 'Click to activate'}
                                        >
                                            {banner.isActive ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {banner.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 hidden sm:table-cell">
                                        {banner.sortOrder ?? 0}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-3 rounded-lg hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] border-slate-200 text-slate-500 transition-all gap-1.5"
                                                onClick={() => handleEdit(banner)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Edit</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-3 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 border-slate-200 text-slate-500 transition-all gap-1.5"
                                                onClick={() => handleDelete(banner._id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Delete</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default AdminBanners
