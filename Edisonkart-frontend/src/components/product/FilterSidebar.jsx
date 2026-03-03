import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { Separator } from '../ui/separator'

const FilterSidebar = ({ filters, setFilters, categories, mobile, onClose }) => {
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        price: true,
    })

    const [priceRange, setPriceRange] = useState({
        min: filters.minPrice || '',
        max: filters.maxPrice || '',
    })

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const handlePriceChange = (type, value) => {
        setPriceRange(prev => ({ ...prev, [type]: value }))
    }

    const applyPriceFilter = () => {
        setFilters({
            ...filters,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
        })
    }

    const handleCategoryChange = (categorySlug) => {
        setFilters({
            ...filters,
            category: categorySlug === filters.category ? '' : categorySlug
        })
    }



    const clearAllFilters = () => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
        })
        setPriceRange({ min: '', max: '' })
    }

    const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice

    return (
        <div className="bg-card rounded-2xl border border-border/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold">Filters</h3>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs font-medium text-[#1E3A8A] hover:underline"
                        >
                            Clear All
                        </button>
                    )}
                    {mobile && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Categories Section */}
            <div className="mb-5">
                <button
                    onClick={() => toggleSection('category')}
                    className="flex items-center justify-between w-full mb-3 group"
                >
                    <span className="text-sm font-medium">Categories</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.category ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {expandedSections.category && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-1.5 pt-1">
                                {Array.isArray(categories) && categories.map((category) => (
                                    <button
                                        key={category._id}
                                        onClick={() => handleCategoryChange(category.slug)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${filters.category === category.slug
                                            ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] font-medium'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        <span>{category.name}</span>
                                        {filters.category === category.slug && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Separator className="my-4" />

            {/* Price Range Section */}
            <div className="mb-5">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full mb-3"
                >
                    <span className="text-sm font-medium">Price Range</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.price ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {expandedSections.price && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => handlePriceChange('min', e.target.value)}
                                        className="w-full rounded-lg text-sm"
                                    />
                                    <span className="text-muted-foreground text-sm">—</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => handlePriceChange('max', e.target.value)}
                                        className="w-full rounded-lg text-sm"
                                    />
                                </div>
                                <Button
                                    onClick={applyPriceFilter}
                                    size="sm"
                                    className="w-full rounded-lg bg-[#1E3A8A] hover:bg-[#15306B] text-xs"
                                >
                                    Apply
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>





            {/* Active Filters */}
            {hasActiveFilters && (
                <>
                    <Separator className="my-4" />
                    <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Active Filters</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {filters.category && (
                                <button
                                    onClick={() => setFilters({ ...filters, category: '' })}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-medium hover:bg-[#1E3A8A]/20 transition-colors"
                                >
                                    {filters.category}
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                            {(filters.minPrice || filters.maxPrice) && (
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, minPrice: '', maxPrice: '' })
                                        setPriceRange({ min: '', max: '' })
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-[#F97316]/10 text-[#F97316] rounded-lg text-xs font-medium hover:bg-[#F97316]/20 transition-colors"
                                >
                                    ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || 'Any'}
                                    <X className="h-3 w-3" />
                                </button>
                            )}

                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default FilterSidebar