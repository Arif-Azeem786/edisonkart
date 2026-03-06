import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Plus, Heart, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import useWishlistStore from '../../store/wishlistStore'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../ui/use-toast'
import MagneticButton from '../ui/MagneticButton'
import QuickViewModal from './QuickViewModal'
import { Eye, GitCompare } from 'lucide-react'
import useCompareStore from '../../store/compareStore'

const ProductCard = ({ product }) => {
  const { addItem, isLoading } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const { toggleWishlist, isInWishlist } = useWishlistStore()
  const isProductInWishlist = isInWishlist(product?._id)

  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore()
  const isProductInCompare = isInCompare(product?._id)

  const hasDiscount = product.discountPrice && product.discountPrice < product.price
  const displayPrice = hasDiscount ? product.discountPrice : product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0
  const isOutOfStock = product.stock === 0

  const imageIds = product.imageIds || []
  const primaryImageUrl = imageIds.length > 0 ? getProductImageUrl(imageIds[0]) : NO_IMAGE_PLACEHOLDER
  const hoverImageUrl = imageIds.length > 1 ? getProductImageUrl(imageIds[1]) : null

  // Countdown Logic
  useEffect(() => {
    // Robust check for flash sale status
    const isFlashActive = product.isFlashSale === true || product.isFlashSale === 'true'
    
    // Diagnostic logging
    if (isFlashActive) {
      console.log(`[FlashSale] ${product.name}: active=${isFlashActive}, endTime=${product.flashSaleEndTime}`)
    }

    if (!isFlashActive || !product.flashSaleEndTime) {
      setTimeLeft('')
      return
    }

    const calculateTimeLeft = () => {
      try {
        const end = new Date(product.flashSaleEndTime)
        if (isNaN(end.getTime())) {
          console.error(`[FlashSale] Invalid Date for product ${product.name}:`, product.flashSaleEndTime)
          setTimeLeft('INVALID DATE')
          return
        }

        const difference = end - new Date()
        
        if (difference <= 0) {
          setTimeLeft('EXPIRED')
          return
        }

        const hours = Math.floor((difference / (1000 * 60 * 60)))
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      } catch (err) {
        console.error(`[FlashSale] Calc Error for ${product.name}:`, err)
        setTimeLeft('ERROR')
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [product.isFlashSale, product.flashSaleEndTime, product.name])

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) return

    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      })
      navigate('/login')
      return
    }

    try {
      await addItem(product._id, 1)
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      })
    } catch (error) {
      toast({
        title: "Failed to add item",
        description: error.message || "Could not add item to cart",
        variant: "destructive",
      })
    }
  }

  const handleWishlistToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to add items to wishlist",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      const message = await toggleWishlist(product._id);
      toast({
        title: isProductInWishlist ? "Removed from Wishlist" : "Added to Wishlist",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Failed to update wishlist",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCompareToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isProductInCompare) {
      removeFromCompare(product._id);
      toast({
        title: "Removed from comparison",
        description: `${product.name} removed`,
      });
    } else {
      const result = addToCompare(product);
      if (result.success) {
        toast({
          title: "Added to comparison",
          description: result.message,
        });
      } else {
        toast({
          title: "Comparison limit reached",
          description: result.message,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product._id}`} className="block">
        {/* Card Component */}
        <div className="relative bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-500 group-hover:border-[#1E3A8A]/20 dark:group-hover:border-blue-400/20 group-hover:shadow-2xl group-hover:shadow-[#1E3A8A]/8 dark:group-hover:shadow-black/40 group-hover:scale-[1.03]">

          {/* Image Area - hover shows second image (Flipkart-style) */}
          <div
            className="aspect-square overflow-hidden bg-slate-50 dark:bg-slate-900 relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {!imageLoaded && <div className="absolute inset-0 skeleton-shine z-10" />}
            <img
              src={primaryImageUrl}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHovering && hoverImageUrl ? 'opacity-0 scale-110' : 'group-hover:scale-110'}`}
              onLoad={() => setImageLoaded(true)}
            />
            {hoverImageUrl && (
              <img
                src={hoverImageUrl}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
              />
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40" />

            {/* Tags */}
            <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-20">
              {hasDiscount && (
                <span className="px-3 py-1 bg-[#F97316] text-white text-xs font-bold rounded-full shadow-lg shadow-[#F97316]/20 backdrop-blur-md">
                  -{discountPercent}%
                </span>
              )}
               {product.brand && (
                <span className="px-3 py-1 bg-[#1E3A8A]/10 dark:bg-blue-900/30 backdrop-blur-md border border-[#1E3A8A]/20 text-[#1E3A8A] dark:text-blue-400 text-xs font-semibold rounded-full">
                  {product.brand}
                </span>
              )}
               {product.categoryId && (
                <span className="px-3 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                  {product.categoryId.name}
                </span>
              )}
            </div>

            {/* Flash Sale Timer */}
            {(product.isFlashSale === true || product.isFlashSale === 'true') && timeLeft && timeLeft !== 'EXPIRED' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full px-4 transition-all duration-300 group-hover:scale-105">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-600/90 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-red-500/50 shadow-2xl flex items-center justify-center gap-2"
                >
                  <Clock className="h-4 w-4 animate-pulse text-white" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Ends in</span>
                    <span className="text-sm font-mono font-bold tracking-widest">{timeLeft}</span>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Wishlist Button (Floating) */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={handleWishlistToggle}
                className={`p-2 rounded-full backdrop-blur-md border transition-all duration-300 ${
                  isProductInWishlist 
                  ? 'bg-red-500 text-white border-red-500 shadow-lg' 
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800'
                }`}
                title={isProductInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`h-4 w-4 ${isProductInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Removed redundant Quick Add pill for a cleaner hover experience */}
          </div>

          {/* Info Area */}
          <div className="p-4 sm:p-5">
             {/* Flash Sale Label (Inline) */}
             {(product.isFlashSale === true || product.isFlashSale === 'true') && timeLeft && timeLeft !== 'EXPIRED' && (
              <div className="flex items-center gap-1.5 text-red-600 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Flash Sale</span>
              </div>
            )}

            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="text-slate-900 dark:text-slate-100 font-medium text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
            </div>

            <div className="flex items-center justify-between mt-3 sm:mt-4 gap-2 min-h-[2rem]">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-[#F97316] truncate">
                    ₹{Math.round(displayPrice).toLocaleString('en-IN')}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-600 line-through decoration-slate-400 dark:decoration-slate-600 shrink-0">
                      ₹{Math.round(product.price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Rating Pill */}
              {product.averageRating > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#26a541] text-white shrink-0">
                  <span className="text-[11px] font-bold leading-none">{product.averageRating.toFixed(1)}</span>
                  <Star className="h-2.5 w-2.5 fill-white text-white" />
                </div>
              )}
            </div>

            {/* Add to Cart - In flow on mobile (prevents price overlap) */}
            {!isOutOfStock && (
              <div className="mt-3 sm:hidden">
                <Button
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="w-full h-9 bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl shadow-lg font-bold text-sm"
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>
      </Link>

      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />

      {/* Floating Action Bar (Visible on Hover / Always on Mobile) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] sm:-translate-y-1/2 z-30 flex gap-3 sm:gap-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto">
        <MagneticButton strength={20}>
          <button
            onClick={(e) => {
              e.preventDefault();
               e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
            className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-white/95 dark:bg-slate-900/95 text-[#1E3A8A] dark:text-blue-400 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center shadow-lg hover:bg-[#1E3A8A] dark:hover:bg-blue-400 hover:text-white dark:hover:text-slate-900 transition-all transform hover:scale-110"
            title="Quick View"
          >
            <Eye className="h-4.5 w-4.5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </button>
        </MagneticButton>

        <MagneticButton strength={20}>
          <button
            onClick={handleCompareToggle}
            className={`h-9 w-9 sm:h-12 sm:w-12 rounded-full border flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${
              isProductInCompare 
              ? 'bg-[#F97316] text-white border-[#F97316]' 
              : 'bg-white/95 dark:bg-slate-900/95 text-[#1E3A8A] dark:text-blue-400 border border-slate-200/50 dark:border-slate-800/50 hover:bg-[#1E3A8A] dark:hover:bg-blue-400 hover:text-white dark:hover:text-slate-900'
            }`}
            title={isProductInCompare ? "Remove from Compare" : "Compare Product"}
          >
            <GitCompare className="h-4.5 w-4.5 sm:h-6 sm:w-6" strokeWidth={2.5} />
          </button>
        </MagneticButton>
      </div>

      {/* Modern Add to Cart Bar (Desktop only - overlay on hover; mobile uses in-flow button) */}
      {!isOutOfStock && (
        <div className="hidden sm:block absolute bottom-4 left-4 right-4 z-30 opacity-0 translate-y-4 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 pointer-events-none sm:group-hover:pointer-events-auto">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full h-9 sm:h-11 bg-[#1E3A8A]/90 sm:bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl shadow-lg shadow-[#1E3A8A]/20 font-bold transition-all text-[10px] sm:text-sm group/btn"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 group-hover/btn:scale-110 transition-transform" />
            Add to Cart
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProductCard
