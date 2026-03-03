import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '../ui/Pagination'
import { getProducts, getCategories } from '../../services/product'
import ProductCard from '../product/ProductCard'
import ProductFilterBar from '../product/ProductFilterBar'
import SidebarFilters from '../product/SidebarFilters'
import { Button } from '../ui/button'
import { useSearchParams } from 'react-router-dom'
import { Package, Loader2, Filter, X } from 'lucide-react'
import PremiumLoader from '../ui/PremiumLoader'

const ProductListing = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [showMobileFilters, setShowMobileFilters] = useState(false)

    // Filters state derived from URL params (Single Source of Truth)
    const filters = {
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        rating: searchParams.get('rating') || '',
        brand: searchParams.get('brand') || '',
        discount: searchParams.get('discount') || '',
        availability: searchParams.get('availability') || '',
    }
    const sort = searchParams.get('sort') || 'createdAt_desc'
    const page = Number(searchParams.get('page')) || 1
    const limit = 12

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    })

    const {
        data: productsData,
        isLoading,
        error
    } = useQuery({
        queryKey: ['products', filters, sort, page],
        queryFn: async () => {
            const [sortField, sortOrder] = sort.split('_')
            return getProducts({
                ...filters,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                sort: sortField,
                order: sortOrder || 'desc',
                page,
                limit
            })
        },
        keepPreviousData: true,
    })

    const setPage = (newPage) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', newPage)
        setSearchParams(params)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Update URL params
    const updateFilters = (newFilters) => {
        const params = new URLSearchParams(searchParams)
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key]) {
                params.set(key, newFilters[key])
            } else {
                params.delete(key)
            }
        })
        setSearchParams(params)
    }

    const setSort = (newSort) => {
        const params = new URLSearchParams(searchParams)
        if (newSort) params.set('sort', newSort)
        else params.delete('sort')
        setSearchParams(params)
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center pt-20 bg-background">
                <div className="text-center">
                    <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-4">
                        <Package className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-500 font-medium mb-2">Error loading products</p>
                    <Button onClick={() => window.location.reload()} className="rounded-xl bg-[#1E3A8A] hover:bg-[#F97316]">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const products = productsData?.products || []

    return (
        <div className="min-h-screen bg-background pt-32 md:pt-24 pb-20 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                
                {/* Mobile Filter Trigger */}
                <div className="lg:hidden mb-6 flex gap-4">
                  <Button 
                    onClick={() => setShowMobileFilters(true)}
                    className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-14 font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <Filter className="h-4 w-4" /> Filters
                  </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Sidebar (Desktop) */}
                  <aside className="hidden lg:block w-72 flex-shrink-0">
                    <SidebarFilters 
                      filters={filters} 
                      setFilters={updateFilters} 
                      categories={categories || []} 
                    />
                  </aside>

                  {/* Main Content Area */}
                  <div className="flex-1">
                    {/* Filter Bar (Search & Sort) */}
                    <ProductFilterBar
                        filters={filters}
                        setFilters={updateFilters}
                        categories={categories || []}
                        sort={sort}
                        setSort={setSort}
                    />

                    {/* Product Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] rounded-3xl bg-slate-100/50 skeleton-shine" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-24 border border-slate-200 dark:border-slate-800 border-dashed rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700">
                                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 font-syne uppercase tracking-tight">No products found</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto font-medium leading-relaxed">Try adjusting your filters or search to find what you're looking for.</p>
                            <Button
                                onClick={() => setSearchParams({})}
                                className="bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-2xl px-10 py-6 font-bold shadow-xl shadow-blue-900/20"
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                            >
                                <AnimatePresence mode="popLayout">
                                    {products.map((product, i) => (
                                        <motion.div
                                            key={product._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            {/* Pagination */}
                            <div className="mt-16 flex justify-center py-10 border-t border-slate-100 dark:border-slate-800">
                                <Pagination 
                                    page={productsData?.pagination?.page || 1}
                                    pages={productsData?.pagination?.pages || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                  </div>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
              {showMobileFilters && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileFilters(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                  />
                  <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-950 z-[101] shadow-2xl flex flex-col"
                  >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h2 className="text-xl font-bold font-syne dark:text-slate-100">Filters</h2>
                      <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)} className="rounded-xl">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                       <SidebarFilters 
                          filters={filters} 
                          setFilters={updateFilters} 
                          categories={categories || []} 
                        />
                    </div>
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                      <Button 
                        onClick={() => setShowMobileFilters(false)}
                        className="w-full bg-[#1E3A8A] text-white rounded-2xl py-6 font-bold"
                      >
                        View Products
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
        </div>
    )
}

export default ProductListing
