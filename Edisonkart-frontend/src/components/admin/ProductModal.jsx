import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Plus, Trash2 } from 'lucide-react'
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
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-blue-900">Product Variants</h3>
                                <p className="text-xs text-blue-700">Add options like Color, Size, or Storage</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="hasVariants" className="cursor-pointer text-blue-900 font-medium">Has Variants?</Label>
                                <input
                                    type="checkbox"
                                    id="hasVariants"
                                    checked={formData.hasVariants}
                                    onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600 rounded border-blue-300 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {formData.hasVariants && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-6 pt-4 border-t border-blue-100"
                            >
                                {/* Attributes Definition */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-blue-900">Attributes</Label>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-xs border-blue-200 text-blue-700"
                                            onClick={() => {
                                                const attrs = [...(formData.variantAttributes || [])];
                                                attrs.push({ name: '', values: [''] });
                                                setFormData({ ...formData, variantAttributes: attrs });
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Attribute
                                        </Button>
                                    </div>
                                    
                                    {(formData.variantAttributes || []).map((attr, attrIdx) => (
                                        <div key={attrIdx} className="bg-white p-3 rounded-lg border border-blue-100 space-y-3">
                                            <div className="flex gap-2">
                                                <Input 
                                                    placeholder="e.g. Color"
                                                    value={attr.name}
                                                    onChange={(e) => {
                                                        const attrs = [...formData.variantAttributes];
                                                        attrs[attrIdx].name = e.target.value;
                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                    }}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0 text-red-500"
                                                    onClick={() => {
                                                        const attrs = formData.variantAttributes.filter((_, i) => i !== attrIdx);
                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {attr.values.map((val, valIdx) => (
                                                    <div key={valIdx} className="relative group">
                                                        <Input 
                                                            value={val}
                                                            onChange={(e) => {
                                                                const attrs = [...formData.variantAttributes];
                                                                attrs[attrIdx].values[valIdx] = e.target.value;
                                                                setFormData({ ...formData, variantAttributes: attrs });
                                                            }}
                                                            className="w-24 h-7 text-xs pr-6"
                                                        />
                                                        {attr.values.length > 1 && (
                                                            <button 
                                                                type="button"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600"
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
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-7 px-2 text-[10px] text-blue-600"
                                                    onClick={() => {
                                                        const attrs = [...formData.variantAttributes];
                                                        attrs[attrIdx].values.push('');
                                                        setFormData({ ...formData, variantAttributes: attrs });
                                                    }}
                                                >
                                                    + Add Value
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Variants Generation & Listing */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-blue-900">Variant Price & Stock</Label>
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-7 text-xs"
                                            onClick={() => {
                                                // Generate combinations based on attributes
                                                if (!formData.variantAttributes?.length) return;
                                                
                                                const generateCombinations = (index, current) => {
                                                    if (index === formData.variantAttributes.length) {
                                                        return [current];
                                                    }
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
                                            Generate All Combinations
                                        </Button>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {(formData.variants || []).map((v, vIdx) => (
                                            <div key={vIdx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                                                <div className="flex items-center justify-between font-bold text-blue-900 border-b pb-1 mb-2">
                                                    <span>{Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' / ')}</span>
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 text-red-500"
                                                        onClick={() => {
                                                            const variants = formData.variants.filter((_, i) => i !== vIdx);
                                                            setFormData({ ...formData, variants: variants });
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">Price (₹)</Label>
                                                        <Input 
                                                            type="number" 
                                                            value={v.price} 
                                                            onChange={(e) => {
                                                                const vars = [...formData.variants];
                                                                vars[vIdx].price = e.target.value;
                                                                setFormData({ ...formData, variants: vars });
                                                            }}
                                                            className="h-7 text-xs" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Discount (₹)</Label>
                                                        <Input 
                                                            type="number" 
                                                            value={v.discountPrice} 
                                                            onChange={(e) => {
                                                                const vars = [...formData.variants];
                                                                vars[vIdx].discountPrice = e.target.value;
                                                                setFormData({ ...formData, variants: vars });
                                                            }}
                                                            className="h-7 text-xs" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Stock</Label>
                                                        <Input 
                                                            type="number" 
                                                            value={v.stock} 
                                                            onChange={(e) => {
                                                                const vars = [...formData.variants];
                                                                vars[vIdx].stock = e.target.value;
                                                                setFormData({ ...formData, variants: vars });
                                                            }}
                                                            className="h-7 text-xs" 
                                                        />
                                                    </div>
                                                </div>
                                                {/* Variant images - show when selecting color etc (Flipkart-style) */}
                                                <div className="mt-2 pt-2 border-t border-blue-100">
                                                    <Label className="text-[10px] text-blue-700">Images for this variant</Label>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(v.imageIds || []).map((id, i) => (
                                                            <div key={i} className="relative w-12 h-12 rounded border overflow-hidden group">
                                                                <img src={`${import.meta.env.VITE_API_URL || ''}/products/image/${id}`} alt="" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariantImage(vIdx, 'existing', i)}
                                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                                >
                                                                    <Trash2 className="h-3 w-3 text-white" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(variantImages[vIdx] || []).map((f, i) => (
                                                            <div key={`new-${i}`} className="relative w-12 h-12 rounded border overflow-hidden group">
                                                                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVariantImage(vIdx, 'new', i)}
                                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                                >
                                                                    <Trash2 className="h-3 w-3 text-white" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {((v.imageIds || []).length + (variantImages[vIdx] || []).length) < 5 && (
                                                            <label className="w-12 h-12 rounded border-2 border-dashed border-blue-200 flex items-center justify-center cursor-pointer hover:border-blue-400 text-blue-500">
                                                                <Plus className="h-4 w-4" />
                                                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleVariantImageChange(vIdx, e)} />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!formData.variants || formData.variants.length === 0) && (
                                            <div className="text-center py-4 text-slate-400 italic text-xs">
                                                Click "Generate" or define attributes to see variants here.
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