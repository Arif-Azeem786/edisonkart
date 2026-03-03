import { useState } from 'react'
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle
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
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../../services/category'
import { toast } from '../../ui/use-toast'

const AdminCategories = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({ name: '', isActive: true })

    const queryClient = useQueryClient()

    const { data: categories, isLoading } = useQuery({
        queryKey: ['adminCategories'],
        queryFn: getAdminCategories,
    })

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => updateCategory(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminCategories'])
            toast({
                title: "Success",
                description: "Category status updated",
            })
        },
        onError: (error) => {
            const message = typeof error === 'string' ? error : error?.message || "Failed to update status"
            toast({
                title: "Error",
                description: message,
                variant: "destructive"
            })
        }
    })

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminCategories'])
            setIsModalOpen(false)
            setFormData({ name: '', isActive: true })
            toast({
                title: "Success",
                description: "Category created successfully",
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminCategories'])
            setIsModalOpen(false)
            setEditingCategory(null)
            setFormData({ name: '', isActive: true })
            toast({
                title: "Success",
                description: "Category updated successfully",
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminCategories'])
            toast({
                title: "Success",
                description: "Category deleted successfully",
            })
        },
        onError: (error, categoryId) => {
            // The axios interceptor returns the data object or message string directly
            let message;
            if (typeof error === 'string') {
                message = error;
            } else {
                message = error?.message || error?.error || "Failed to delete category";
            }

            // If category has products, offer to deactivate instead
            if (message && message.toLowerCase().includes('existing products')) {
                const shouldDeactivate = window.confirm(
                    "This category cannot be deleted because it contains existing products.\n\nWould you like to deactivate it instead? Deactivated categories won't appear in the store."
                )
                if (shouldDeactivate) {
                    toggleStatusMutation.mutate({ id: categoryId, isActive: false })
                }
            } else {
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive"
                })
            }
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory._id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleEdit = (category) => {
        setEditingCategory(category)
        setFormData({ name: category.name, isActive: category.isActive })
        setIsModalOpen(true)
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            deleteMutation.mutate(id)
        }
    }

    const filteredCategories = categories?.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="space-y-8">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-syne text-[#1E3A8A] text-2xl">
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Category Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Electronics, Clothing"
                                required
                                className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 text-[#F97316] border-slate-300 rounded focus:ring-[#F97316]"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                                Active Status
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Categories</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Organize your products with categories
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCategory(null)
                        setFormData({ name: '', isActive: true })
                        setIsModalOpen(true)
                    }}
                    className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium px-6 h-12"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Search */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search categories..."
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
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">Category Name</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading categories..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20 text-slate-500">
                                    No categories found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                                    <TableCell className="py-4 pl-6 font-medium text-slate-900 text-lg">
                                        {category.name}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => toggleStatusMutation.mutate({ id: category._id, isActive: !category.isActive })}
                                            disabled={toggleStatusMutation.isPending}
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-all ${category.isActive
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                }`}
                                            title={category.isActive ? 'Click to deactivate' : 'Click to activate'}
                                        >
                                            {category.isActive ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-3 rounded-lg hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] border-slate-200 text-slate-500 transition-all gap-1.5"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium">Edit</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-3 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 border-slate-200 text-slate-500 transition-all gap-1.5"
                                                onClick={() => handleDelete(category._id)}
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

export default AdminCategories