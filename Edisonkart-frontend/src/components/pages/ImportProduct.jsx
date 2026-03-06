import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Loader2, Star, ShoppingCart, ExternalLink, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import api from '../../services/axios'

const SUPPORTED_PLATFORMS = [
  { name: 'Amazon', logo: '🛒' },
  { name: 'Flipkart', logo: '🛍️' },
  { name: 'Myntra', logo: '👗' },
  { name: 'Savana', logo: '🛒' },
  { name: 'Purple', logo: '🟣' },
  { name: 'Ajio', logo: '👔' },
  { name: 'Nykaa', logo: '💄' },
  { name: 'Snitch', logo: '👕' },
  { name: 'Banana Club', logo: '🍌' },
  { name: 'Tata Neu', logo: '⚡' },
  { name: 'Tira', logo: '✨' },
  { name: 'Shopsy', logo: '🛒' },
  { name: 'Snapdeal', logo: '📦' },
  { name: 'Firstcry', logo: '👶' },
  { name: 'Zara', logo: '👗' },
  { name: 'Max', logo: '👖' },
  { name: 'Croma', logo: '📱' },
  { name: 'Reliance Digital', logo: '📺' },
  { name: 'Tata Cliq', logo: '🛍️' },
  { name: 'Refurbed', logo: '♻️' },
  { name: 'Jiomart', logo: '🛒' },
  { name: 'Any Website', logo: '🌐' },
]

export default function ImportProduct() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please paste a product link')
      return
    }

    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setError('')
    setProduct(null)
    setLoading(true)

    try {
      const res = await api.post('/products/import', { url: url.trim() })

      if (res.success) {
        setProduct(res.data)
        toast({ title: 'Product imported!', description: res.data.title })
      } else {
        setError(res.message || 'Failed to import product')
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong while importing the product.')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to purchase',
        variant: 'destructive',
      })
      navigate('/login')
      return
    }

    try {
      await addItem(product._id, 1)
      navigate('/checkout')
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not add product to cart',
        variant: 'destructive',
      })
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to add items to cart',
        variant: 'destructive',
      })
      navigate('/login')
      return
    }

    try {
      await addItem(product._id, 1)
      toast({ title: 'Added to cart', description: `${product.title} has been added to your cart` })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not add product to cart',
        variant: 'destructive',
      })
    }
  }

  const displayImage = product?.images?.[activeImageIdx] || product?.images?.[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E3A8A]/10 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Import
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            Import Product
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Paste a product link from any ecommerce website and we'll import it for you with EdisonKart pricing.
          </p>
        </motion.div>

        {/* Supported Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {SUPPORTED_PLATFORMS.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300"
            >
              <span>{p.logo}</span>
              {p.name}
            </span>
          ))}
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20 mb-8"
        >
          <label htmlFor="product-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Paste product link
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                id="product-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleImport()}
                placeholder="https://amazon.in/dp/XXXXXXXX"
                disabled={loading}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="h-12 px-6 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl font-semibold shadow-lg shadow-[#1E3A8A]/20 transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Product
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center mb-8"
            >
              <Loader2 className="h-10 w-10 text-[#1E3A8A] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Importing Product</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Scraping product details, images and videos...
              </p>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Fetching page</span>
                <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting data</span>
                <span className="flex items-center gap-1 opacity-50">Downloading images</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Preview Card */}
        <AnimatePresence>
          {product && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/30"
            >
              {/* Success Banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30 px-6 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Product imported from {product.sourcePlatform}
                </span>
                <a
                  href={product.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                >
                  View original <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="p-6">
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={product.title}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No Image Available
                      </div>
                    )}
                  </div>
                  {/* Thumbnail Strip */}
                  {product.images?.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {product.images.slice(0, 6).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIdx(i)}
                          className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            i === activeImageIdx
                              ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Videos */}
                  {product.videos?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Product Videos</h3>
                      <div className="space-y-3">
                        {product.videos.map((videoUrl, i) => (
                          <video
                            key={i}
                            controls
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                            preload="metadata"
                          >
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-6 flex flex-col">
                  {/* Platform Badge */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1E3A8A]/10 dark:bg-blue-900/30 text-[#1E3A8A] dark:text-blue-400 text-xs font-semibold w-fit mb-3">
                    Imported from {product.sourcePlatform}
                  </span>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-3">
                    {product.title}
                  </h2>

                  {/* Rating */}
                  {product.rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#26a541] text-white">
                        <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                        <Star className="h-3.5 w-3.5 fill-white text-white" />
                      </div>
                      <span className="text-sm text-slate-500">Rating</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-bold text-[#F97316]">
                      ₹{Math.round(product.edisonkartPrice ?? 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-lg text-slate-400 line-through">
                      ₹{Math.round(product.originalPrice ?? 0).toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                      {product.discountPercent || 10}% OFF
                    </span>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div className="mb-6 flex-1">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-5">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto">
                    <Button
                      onClick={handleBuyNow}
                      className="flex-1 h-12 bg-[#F97316] hover:bg-[#F97316]/90 text-white rounded-xl font-bold shadow-lg shadow-[#F97316]/20 text-base"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
