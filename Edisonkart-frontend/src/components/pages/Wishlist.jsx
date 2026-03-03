import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import useWishlistStore from '../../store/wishlistStore'
import ProductCard from '../product/ProductCard'
import { Button } from '../ui/button'

const Wishlist = () => {
  const { wishlist, isLoading, fetchWishlist } = useWishlistStore()

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-[#F97316] rounded-full" />
              <span className="text-[#F97316] text-sm font-bold uppercase tracking-widest">My Collection</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-syne capitalize">
              My <span className="text-[#1E3A8A]">Wishlist</span>
            </h1>
            <p className="mt-4 text-slate-500 text-lg max-w-2xl font-medium">
              You have <span className="text-[#1E3A8A] font-bold">{wishlist.length}</span> items saved in your collection.
            </p>
          </motion.div>

          {wishlist.length > 0 && (
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:block"
             >
                <Link to="/products">
                    <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-100 px-6 py-6 gap-2 text-slate-600 font-bold group">
                        Continue Shopping
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
             </motion.div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-slate-200/50 skeleton-shine" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {wishlist.length > 0 ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
              >
                {wishlist.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 mt-12 overflow-hidden relative"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-orange-50/50 rounded-full blur-3xl -z-10" />

                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner group transition-all duration-500 hover:scale-110 hover:bg-white hover:shadow-xl">
                  <Heart className="h-10 w-10 text-slate-300 group-hover:text-red-400 transition-colors" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-4 font-syne">Your wishlist is empty</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg font-medium leading-relaxed">
                  Start adding items you love to your collection by clicking the heart icon on any product!
                </p>
                <Link to="/products">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-2xl px-10 py-7 text-lg font-bold shadow-2xl shadow-blue-900/20 group">
                      Browse Products
                      <ShoppingBag className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default Wishlist
