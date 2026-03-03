import { useState, useEffect } from 'react'
import { Search, ChevronDown, Check, X, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'

const ProductFilterBar = ({ filters, setFilters, categories, sort, setSort }) => {
    const [searchQuery, setSearchQuery] = useState(filters.search || '')

    // Sync local search state with props when props change
    useEffect(() => {
        setSearchQuery(filters.search || '')
    }, [filters.search])

    // Debounce search update to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters.search || '')) {
                setFilters({ ...filters, search: searchQuery })
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery, filters, setFilters])

    const sortOptions = [
        { label: 'Newest First', value: 'createdAt_desc' },
        { label: 'Price: Low to High', value: 'price_asc' },
        { label: 'Price: High to Low', value: 'price_desc' },
        { label: 'Name: A to Z', value: 'name_asc' },
    ]

    const hasActiveFilters = Object.values(filters).some(v => v !== '')

    return (
        <div className="w-full space-y-6 mb-8 z-40 relative">
            {/* Top Bar: Search & Sort */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

                {/* Search */}
                <div className="relative flex-1 group z-10 transition-all">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#1E3A8A] dark:group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by name, description or brand..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100/50 dark:border-slate-800 rounded-[1.5rem] py-5 pl-14 pr-6 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-[#1E3A8A]/20 dark:focus:border-blue-400/20 focus:ring-8 focus:ring-blue-50/50 dark:focus:ring-blue-900/10 transition-all shadow-inner shadow-slate-100 dark:shadow-black/20"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                </div>

                {/* Sort Select */}
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort By:</span>
                   <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="w-full lg:w-[180px] h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 focus:ring-[#F97316]/10 border-2 border-slate-50 dark:border-slate-900">
                          <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent align="end" className="rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-1">
                          {sortOptions.map((option) => (
                              <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className="rounded-xl focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-[#1E3A8A] dark:focus:text-blue-400 cursor-pointer py-3 font-medium transition-colors"
                              >
                                  {option.label}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
            </div>

            {/* Active Filters Summary (Simplified) */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-wrap items-center gap-2 pt-2"
                    >
                        {filters.search && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/50 shadow-sm">
                                "{filters.search}"
                                <button
                                    onClick={() => { setSearchQuery(''); setFilters({ ...filters, search: '' }) }}
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {/* More complex filters shown elsewhere or kept minimal here */}
                        {(filters.category || filters.rating || filters.brand || filters.minPrice || filters.maxPrice || filters.discount || filters.availability) && (
                           <button
                              onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', rating: '', brand: '', discount: '', availability: '' })}
                              className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-1.5 translate-y-[-1px] rounded-lg transition-all"
                            >
                                Reset Filters
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ProductFilterBar
