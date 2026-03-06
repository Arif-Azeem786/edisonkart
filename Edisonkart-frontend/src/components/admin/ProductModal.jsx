import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Plus, Trash2, Video, Layers } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories } from '../../services/category'
import { createProduct, updateProduct } from '../../services/product'
import { toast } from '../ui/use-toast'

const ProductModal = ({ isOpen, onClose, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        brand: '',
        categoryId: '',
        price: '',
        discountPrice: '',
        stock: '',
        isActive: true,
        isFlashSale: false,
        flashSaleEndTime: '',
    })
    const [images, setImages] = useState([])
    const [imagePreviews, setImagePreviews] = useState([])
    const [videos, setVideos] = useState([])
    const [videoPreviews, setVideoPreviews] = useState([])
    const [variantImages, setVariantImages] = useState({})

    const queryClient = useQueryClient()

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    })

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                brand: product.brand || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                price: product.price || '',
                discountPrice: product.discountPrice || '',
                stock: product.stock || '',
                isActive: product.isActive !== undefined ? product.isActive : true,
                isFlashSale: product.isFlashSale || false,
                flashSaleEndTime: product.flashSaleEndTime ? new Date(product.flashSaleEndTime).toISOString().slice(0, 16) : '',
                hasVariants: product.hasVariants || false,
                variantAttributes: product.variantAttributes || [],
                variants: product.variants || []
            })
            // Load existing images if any
            if (product.imageIds) {
                setImagePreviews(product.imageIds.map(id =>
                    `${import.meta.env.VITE_API_URL || ''}/products/image/${id}`
                ))
            }
            if (product.videoIds) {
                setVideoPreviews(product.videoIds.map(id =>
                    `${import.meta.env.VITE_API_URL || ''}/products/video/${id}`
                ))
            }
            setVariantImages({})
        } else {
            setFormData({
                name: '',
                description: '',
                brand: '',
                categoryId: '',
                price: '',
                discountPrice: '',
                stock: '',
                isActive: true,
                isFlashSale: false,
                flashSaleEndTime: '',
                hasVariants: false,
                variantAttributes: [],
                variants: []
            })
            setImages([])
            setImagePreviews([])
            setVideos([])
            setVideoPreviews([])
            setVariantImages({})
        }
    }, [product])

    const handleVariantImageChange = async (vIdx, e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        const current = variantImages[vIdx] || []
        const existingIds = (formData.variants?.[vIdx]?.imageIds || []).length
        if (current.length + files.length + existingIds > 5) {
            toast({
                variant: "destructive",
                title: "Too many images",
                description: "You can upload up to 5 images per variant.",
            })
            return
        }
        setVariantImages(prev => ({
            ...prev,
            [vIdx]: [...(prev[vIdx] || []), ...files]
        }))
        e.target.value = ''
    }

    const removeVariantImage = (vIdx, type, index) => {
        if (type === 'existing') {
            const vars = [...(formData.variants || [])]
            if (!vars[vIdx]?.imageIds) return
            vars[vIdx] = {
                ...vars[vIdx],
                imageIds: vars[vIdx].imageIds.filter((_, i) => i !== index)
            }
            setFormData({ ...formData, variants: vars })
        } else {
            setVariantImages(prev => {
                const arr = [...(prev[vIdx] || [])]
                arr.splice(index, 1)
                return { ...prev, [vIdx]: arr }
            })
        }
    }

    const createMutation = useMutation({
        mutationFn: (data) => {
            const formData = new FormData()
            Object.keys(data).forEach(key => {
                if (key !== 'images') {
                    if (Array.isArray(data[key]) || typeof data[key] === 'object') {
                        formData.append(key, JSON.stringify(data[key]))
                    } else {
                        formData.append(key, data[key])
                    }
                }
            })
            images.forEach(image => formData.append('images', image))
            videos.forEach(video => formData.append('videos', video))
            Object.entries(variantImages).forEach(([vIdx, files]) => {
                files.forEach(f => formData.append(`variant_${vIdx}_images`, f))
            })
            return createProduct(formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            queryClient.invalidateQueries(['adminProducts'])
            toast({
                title: "Success",
                description: "Product created successfully",
            })
            onClose()
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data) => {
            const formData = new FormData()
            Object.keys(data).forEach(key => {
                if (key !== 'images' && key !== '_id') {
                    if (Array.isArray(data[key]) || typeof data[key] === 'object') {
                        formData.append(key, JSON.stringify(data[key]))
                    } else {
                        formData.append(key, data[key])
                    }
                }
            })
            images.forEach(image => formData.append('images', image))
            videos.forEach(video => formData.append('videos', video))
            Object.entries(variantImages).forEach(([vIdx, files]) => {
                files.forEach(f => formData.append(`variant_${vIdx}_images`, f))
            })
            return updateProduct(product._id, formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            queryClient.invalidateQueries(['adminProducts'])
            toast({
                title: "Success",
                description: "Product updated successfully",
            })
            onClose()
        },
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!formData.categoryId) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select a category",
            })
            return
        }

        const desc = formData.description?.replace(/<[^>]*>/g, '').trim()
        if (!desc) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please enter a product description",
            })
            return
        }

        if (product) {
            updateMutation.mutate(formData)
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const totalAfter = images.length + files.length
        if (totalAfter > 5) {
            toast({
                variant: "destructive",
                title: "Too many images",
                description: "You can upload up to 5 images per product.",
            })
            return
        }

        setImages(prev => [...prev, ...files])

        // Create preview URLs in order (Promise.all preserves order)
        const newPreviews = await Promise.all(files.map(file =>
            new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result || null)
                reader.onerror = () => resolve(null)
                reader.readAsDataURL(file)
            })
        ))
        // Use placeholder for failed reads to keep images/previews in sync
        const PLACEHOLDER = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'
        setImagePreviews(prev => [...prev, ...newPreviews.map(p => p || PLACEHOLDER)])

        // Reset input so same file can be selected again
        e.target.value = ''
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const isPending = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {product ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Basic Information</h3>

                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <div className="rounded-md border border-slate-200 focus-within:ring-2 focus-within:ring-[#F97316]/50 overflow-hidden [&_.ql-container]:border-0 [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:bg-slate-50 [&_.ql-editor]:min-h-[120px]">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    placeholder="Enter product description (use toolbar for bold, italic, lists, etc.)"
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ list: 'ordered' }, { list: 'bullet' }],
                                            [{ header: [2, 3, false] }],
                                            ['link'],
                                            ['clean']
                                        ]
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                                id="brand"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                placeholder="e.g. Nike, Samsung, Titan"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories?.map((category) => (
                                        <SelectItem key={category._id} value={category._id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Pricing & Stock</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discountPrice">Discount Price (₹)</Label>
                                <Input
                                    id="discountPrice"
                                    type="number"
                                    min="0"
                                    value={formData.discountPrice}
                                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock Quantity *</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.isActive ? 'active' : 'inactive'}
                                    onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                                >
                                    <SelectTrigger className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 border-slate-200">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Flash Sale Controls */}
                    <div className="space-y-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-orange-900">Flash Sale Settings</h3>
                                <p className="text-xs text-orange-700">Enable real-time countdown on product card</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="isFlashSale" className="cursor-pointer text-orange-900 font-medium">Flash Sale?</Label>
                                <input
                                    type="checkbox"
                                    id="isFlashSale"
                                    checked={formData.isFlashSale}
                                    onChange={(e) => setFormData({ ...formData, isFlashSale: e.target.checked })}
                                    className="w-5 h-5 accent-orange-500 rounded border-orange-300 focus:ring-orange-500"
                                />
                            </div>
                        </div>

                        {formData.isFlashSale && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2 overflow-hidden"
                            >
                                <Label htmlFor="flashSaleEndTime" className="text-orange-900">Sale End Time *</Label>
                                <Input
                                    id="flashSaleEndTime"
                                    type="datetime-local"
                                    value={formData.flashSaleEndTime}
                                    onChange={(e) => setFormData({ ...formData, flashSaleEndTime: e.target.value })}
                                    required={formData.isFlashSale}
                                    className="bg-white border-orange-200 focus:ring-orange-500 text-orange-900"
                                />
                                <p className="text-[10px] text-orange-600 italic">User will see the countdown exactly until this time.</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Variant Configuration */}
                    <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/60 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                                    <Layers className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-sm">Product Variants</h3>
                                    <p className="text-[11px] text-blue-600">Color, Size, Storage, Material etc.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.hasVariants}
                                    onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                            </label>
                        </div>

                        {formData.hasVariants && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-5 pt-4 border-t border-blue-200/60"
                            >
                                {/* Step 1: Define Attributes */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                                            <Label className="text-blue-900 font-semibold text-xs">Define Attributes</Label>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-100"
                                            onClick={() => {
                                                const attrs = [...(formData.variantAttributes || [])];
                                                attrs.push({ name: '', values: [''] });
                                                setFormData({ ...formData, variantAttributes: attrs });
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Attribute
                                        </Button>
                                    </div>

                                    {(formData.variantAttributes || []).length === 0 && (
                                        <div className="text-center py-5 bg-white/60 rounded-lg border border-dashed border-blue-200">
                                            <p className="text-xs text-blue-400">Click "Add Attribute" to start — e.g. Color, Size, Storage</p>
                                        </div>
                                    )}
                                    
                                    {(formData.variantAttributes || []).map((attr, attrIdx) => (
                                        <div key={attrIdx} className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                                <Input 
                                                    placeholder="Attribute name (e.g. Color, Size)"
                                                    value={attr.name}
                                                    onChange={(e) => {
                                                        const attrs = [...formData.variantAttributes];
                                                        attrs[attrIdx].name = e.target.value;
                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                    }}
                                                    className="flex-1 h-8 text-sm font-medium border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        const attrs = formData.variantAttributes.filter((_, i) => i !== attrIdx);
                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] text-slate-400 mb-2 font-medium uppercase tracking-wider">Values</p>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {attr.values.map((val, valIdx) => (
                                                        <div key={valIdx} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-lg pl-3 pr-1 py-1">
                                                            <input 
                                                                value={val}
                                                                onChange={(e) => {
                                                                    const attrs = [...formData.variantAttributes];
                                                                    attrs[attrIdx].values[valIdx] = e.target.value;
                                                                    setFormData({ ...formData, variantAttributes: attrs });
                                                                }}
                                                                placeholder="Value"
                                                                className="w-20 bg-transparent text-xs font-medium text-blue-900 border-0 outline-none placeholder:text-blue-300"
                                                            />
                                                            {attr.values.length > 1 && (
                                                                <button 
                                                                    type="button"
                                                                    className="w-5 h-5 rounded-md flex items-center justify-center text-blue-400 hover:text-red-500 hover:bg-red-50 transition"
                                                                    onClick={() => {
                                                                        const attrs = [...formData.variantAttributes];
                                                                        attrs[attrIdx].values = attrs[attrIdx].values.filter((_, i) => i !== valIdx);
                                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button 
                                                        type="button" 
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed border-blue-200 text-[11px] font-medium text-blue-500 hover:border-blue-400 hover:text-blue-700 transition"
                                                        onClick={() => {
                                                            const attrs = [...formData.variantAttributes];
                                                            attrs[attrIdx].values.push('');
                                                            setFormData({ ...formData, variantAttributes: attrs });
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3" /> Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Step 2: Generate & Edit Variants */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                                            <Label className="text-blue-900 font-semibold text-xs">Variants ({(formData.variants || []).length})</Label>
                                        </div>
                                        <Button 
                                            type="button" 
                                            size="sm" 
                                            className="h-8 text-[11px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                            onClick={() => {
                                                if (!formData.variantAttributes?.length) return;
                                                
                                                const generateCombinations = (index, current) => {
                                                    if (index === formData.variantAttributes.length) return [current];
                                                    const attribute = formData.variantAttributes[index];
                                                    let results = [];
                                                    attribute.values.forEach(val => {
                                                        if (val.trim()) {
                                                            results = results.concat(generateCombinations(index + 1, { ...current, [attribute.name]: val }));
                                                        }
                                                    });
                                                    return results;
                                                };

                                                const combinations = generateCombinations(0, {});
                                                const newVariants = combinations.map(combo => {
                                                    const existing = formData.variants?.find(v => {
                                                        const attrs = v.attributes ?? v;
                                                        return attrs && Object.entries(combo).every(([k, val]) => attrs[k] === val);
                                                    });
                                                    return {
                                                        attributes: combo,
                                                        price: existing?.price ?? formData.price,
                                                        discountPrice: existing?.discountPrice ?? formData.discountPrice,
                                                        stock: existing?.stock ?? formData.stock,
                                                        sku: existing?.sku ?? '',
                                                        imageIds: existing?.imageIds ?? []
                                                    };
                                                });
                                                setFormData({ ...formData, variants: newVariants });
                                            }}
                                        >
                                            ⚡ Generate All Combinations
                                        </Button>
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                        {(formData.variants || []).map((v, vIdx) => {
                                            const discPct = v.price && v.discountPrice && Number(v.price) > Number(v.discountPrice)
                                                ? Math.round((1 - Number(v.discountPrice) / Number(v.price)) * 100) : 0;
                                            return (
                                                <div key={vIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition">
                                                    {/* Variant Header */}
                                                    <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {Object.entries(v.attributes).map(([k, val]) => (
                                                                <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[11px] font-semibold">
                                                                    <span className="text-blue-500 font-normal">{k}:</span> {val}
                                                                </span>
                                                            ))}
                                                            {discPct > 0 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold">
                                                                    {discPct}% OFF
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                const variants = formData.variants.filter((_, i) => i !== vIdx);
                                                                setFormData({ ...formData, variants: variants });
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    {/* Variant Body */}
                                                    <div className="p-4 space-y-3">
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 font-medium">Original Price ₹</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={v.price} 
                                                                    onChange={(e) => {
                                                                        const vars = [...formData.variants];
                                                                        vars[vIdx] = { ...vars[vIdx], price: e.target.value };
                                                                        setFormData({ ...formData, variants: vars });
                                                                    }}
                                                                    className="h-8 text-xs font-medium" 
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-green-600 font-medium">Selling Price ₹</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={v.discountPrice} 
                                                                    onChange={(e) => {
                                                                        const vars = [...formData.variants];
                                                                        vars[vIdx] = { ...vars[vIdx], discountPrice: e.target.value };
                                                                        setFormData({ ...formData, variants: vars });
                                                                    }}
                                                                    className="h-8 text-xs font-medium border-green-200 focus-visible:ring-green-500" 
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 font-medium">Stock</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    value={v.stock} 
                                                                    onChange={(e) => {
                                                                        const vars = [...formData.variants];
                                                                        vars[vIdx] = { ...vars[vIdx], stock: e.target.value };
                                                                        setFormData({ ...formData, variants: vars });
                                                                    }}
                                                                    className="h-8 text-xs font-medium" 
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 font-medium">SKU</Label>
                                                                <Input 
                                                                    value={v.sku || ''} 
                                                                    onChange={(e) => {
                                                                        const vars = [...formData.variants];
                                                                        vars[vIdx] = { ...vars[vIdx], sku: e.target.value };
                                                                        setFormData({ ...formData, variants: vars });
                                                                    }}
                                                                    placeholder="SKU-001"
                                                                    className="h-8 text-xs font-medium" 
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Variant Images */}
                                                        <div className="pt-2 border-t border-slate-100">
                                                            <Label className="text-[10px] text-slate-500 font-medium mb-1.5 block">Variant Images</Label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(v.imageIds || []).map((id, i) => (
                                                                    <div key={i} className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden group shadow-sm">
                                                                        <img src={`${import.meta.env.VITE_API_URL || ''}/products/image/${id}`} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeVariantImage(vIdx, 'existing', i)}
                                                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(variantImages[vIdx] || []).map((f, i) => (
                                                                    <div key={`new-${i}`} className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden group shadow-sm">
                                                                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeVariantImage(vIdx, 'new', i)}
                                                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {((v.imageIds || []).length + (variantImages[vIdx] || []).length) < 5 && (
                                                                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition text-blue-400">
                                                                        <Plus className="h-4 w-4" />
                                                                        <span className="text-[8px] font-medium mt-0.5">Image</span>
                                                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleVariantImageChange(vIdx, e)} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!formData.variants || formData.variants.length === 0) && (
                                            <div className="text-center py-8 bg-white/60 rounded-xl border border-dashed border-blue-200">
                                                <Layers className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                                                <p className="text-xs text-blue-400 font-medium">Define attributes above, then click "Generate All Combinations"</p>
                                                <p className="text-[10px] text-slate-400 mt-1">Each variant gets its own price, stock, SKU & images</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Product Images</h3>

                        <div className="grid grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative aspect-square group">
                                    <img
                                        src={preview}
                                        alt={`Product ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#F97316] transition group">
                                <Plus className="h-8 w-8 text-slate-400 group-hover:text-[#F97316] transition" />
                                <span className="text-xs text-slate-500 mt-1">Add Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500">
                            You can upload up to 5 images. Max file size: 5MB each.
                        </p>
                    </div>

                    {/* Videos - only show section when there are videos, otherwise just "Add Video" */}
                    <div className="space-y-4">
                        {videoPreviews.length > 0 && (
                            <>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Product Videos
                                </h3>
                                <div className="space-y-3">
                                    {videoPreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <video
                                                src={preview}
                                                controls
                                                className="w-full rounded-lg border border-slate-200 max-h-[200px]"
                                                preload="metadata"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVideos(prev => prev.filter((_, i) => i !== index))
                                                    setVideoPreviews(prev => prev.filter((_, i) => i !== index))
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {videoPreviews.length < 3 && (
                            <>
                                <label className="flex items-center justify-center gap-2 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#F97316] transition group">
                                    <Video className="h-6 w-6 text-slate-400 group-hover:text-[#F97316] transition" />
                                    <span className="text-sm text-slate-500 group-hover:text-[#F97316]">Add Video</span>
                                    <input
                                        type="file"
                                        accept="video/mp4,video/webm,video/mov"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || [])
                                            if (files.length === 0) return
                                            if (videos.length + files.length > 3) {
                                                toast({ variant: 'destructive', title: 'Too many videos', description: 'You can upload up to 3 videos.' })
                                                return
                                            }
                                            setVideos(prev => [...prev, ...files])
                                            const newPreviews = files.map(f => URL.createObjectURL(f))
                                            setVideoPreviews(prev => [...prev, ...newPreviews])
                                            e.target.value = ''
                                        }}
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-slate-500">
                                    You can upload up to 3 videos. Max file size: 100MB each. Supported: MP4, WebM, MOV.
                                </p>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                            {isPending ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ProductModal