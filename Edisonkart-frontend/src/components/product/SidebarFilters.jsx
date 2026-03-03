import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ShieldCheck, Tag, Box, ChevronRight, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const SidebarFilters = ({ filters, setFilters, categories, onClose }) => {
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || '')
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || '')

  const ratings = [
    { value: 4, label: '4★ & above' },
    { value: 3, label: '3★ & above' },
    { value: 2, label: '2★ & above' },
  ]

  const discounts = [
    { value: 10, label: '10% or more' },
    { value: 20, label: '20% or more' },
    { value: 30, label: '30% or more' },
    { value: 50, label: '50% or more' },
  ]

  const brands = [
    'Apple', 'Samsung', 'Sony', 'OnePlus', 'Google', 'Dell', 'LG', 'Nothing'
  ]

  const handleRatingClick = (val) => {
    setFilters({ ...filters, rating: filters.rating === val.toString() ? '' : val.toString() })
  }

  const handleDiscountClick = (val) => {
    setFilters({ ...filters, discount: filters.discount === val.toString() ? '' : val.toString() })
  }

  const handleAvailabilityChange = (inStock) => {
    setFilters({ ...filters, availability: inStock ? 'inStock' : '' })
  }

  const handleBrandChange = (brand) => {
    const currentBrands = filters.brand ? filters.brand.split(',') : []
    let newBrands
    if (currentBrands.includes(brand)) {
      newBrands = currentBrands.filter(b => b !== brand)
    } else {
      newBrands = [...currentBrands, brand]
    }
    setFilters({ ...filters, brand: newBrands.join(',') })
  }

  const handlePriceBlur = () => {
     if (localMinPrice !== filters.minPrice || localMaxPrice !== filters.maxPrice) {
         setFilters({ ...filters, minPrice: localMinPrice, maxPrice: localMaxPrice })
     }
  }

  return (
    <div className="space-y-8">
      {/* Mobile Header with Close Button */}
      <div className="flex items-center justify-between lg:hidden mb-4 pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Filters</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-28">
        {/* Categories */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Box className="h-3 w-3" /> Categories
          </h3>
          <div className="space-y-1">
            {categories?.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setFilters({ ...filters, category: filters.category === cat.slug ? '' : cat.slug })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all group",
                  filters.category === cat.slug
                    ? "bg-blue-50 dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-[#1E3A8A] dark:hover:text-blue-400"
                )}
              >
                <span className="truncate">{cat.name}</span>
                <ChevronRight className={cn(
                  "h-3 w-3 transition-transform",
                  filters.category === cat.slug ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        {/* Price Range */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             ₹ Price Range
          </h3>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-xs">₹</span>
              <input
                type="number"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                onBlur={handlePriceBlur}
                placeholder="Min"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-6 pr-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#F97316] transition-all"
              />
            </div>
            <span className="text-slate-300 dark:text-slate-700">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-xs">₹</span>
              <input
                type="number"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                onBlur={handlePriceBlur}
                placeholder="Max"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-6 pr-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#F97316] transition-all"
              />
            </div>
          </div>
        </section>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        {/* Brand Filter */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Brands</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto px-1 custom-scrollbar">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => handleBrandChange(brand)}
                  className={cn(
                    "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                    filters.brand?.split(',').includes(brand)
                      ? "bg-[#1E3A8A] border-[#1E3A8A]"
                      : "border-slate-300 dark:border-slate-700 group-hover:border-[#1E3A8A] dark:group-hover:border-blue-400"
                  )}
                >
                  {filters.brand?.split(',').includes(brand) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className={cn(
                  "text-sm transition-colors",
                  filters.brand?.split(',').includes(brand) ? "text-slate-900 dark:text-slate-100 font-bold" : "text-slate-600 dark:text-slate-400"
                )}>{brand}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        {/* Ratings Filter */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Star className="h-3 w-3" /> Ratings
          </h3>
          <div className="space-y-2">
            {ratings.map((rate) => (
              <button
                key={rate.value}
                onClick={() => handleRatingClick(rate.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all",
                  filters.rating === rate.value.toString()
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                )}
              >
                <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {rate.value} <Star className="h-2 w-2 fill-current" />
                </div>
                <span>{rate.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        {/* Discounts Filter */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Tag className="h-3 w-3" /> Discounts
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {discounts.map((disc) => (
              <button
                key={disc.value}
                onClick={() => handleDiscountClick(disc.value)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left",
                  filters.discount === disc.value.toString()
                    ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {disc.label}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

        {/* Availability */}
        <section>
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-green-500" />
               <span className="text-sm font-bold text-slate-700 dark:text-slate-200">In Stock only</span>
            </div>
            <div
              onClick={() => handleAvailabilityChange(filters.availability !== 'inStock')}
              className={cn(
                "w-10 h-5 rounded-full transition-all relative",
                filters.availability === 'inStock' ? "bg-green-500" : "bg-slate-200 dark:bg-slate-800"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                filters.availability === 'inStock' ? "left-6" : "left-1"
              )} />
            </div>
          </label>
        </section>
      </div>
    </div>
  )
}

export default SidebarFilters
