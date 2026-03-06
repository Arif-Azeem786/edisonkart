import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star,
    ShoppingCart,
    Minus,
    Plus,
    Truck,
    RotateCcw,
    Shield,
    Package,
    Check,
    Zap,
    ArrowRight,
    Share2,
    Link2,
    Heart,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Info,
    Video,
    X
} from 'lucide-react'
import { Button } from '../ui/button'
import ProductCard from '../product/ProductCard'
import ProductRecommendations, { recordRecentlyViewed } from './ProductRecommendations'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import useWishlistStore from '../../store/wishlistStore'
import { getProductById, getProducts, getProductVideoUrl, getProductImage } from '../../services/product'
import { getProductImageUrl, getProductImages, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import { useToast } from '../ui/use-toast'
import { getProductReviews, createReview } from '../../services/review'
import { getQuestions, askQuestion, answerQuestion } from '../../services/qa'
import { Helmet } from 'react-helmet-async'
import { checkPincodeServiceability } from '../../services/delivery'
import { cn } from '../../lib/utils'
import DOMPurify from 'dompurify'

// Clean scraped product description: remove repeated phrases and format for display
function formatProductDescription(raw) {
    if (!raw || typeof raw !== 'string') return ''
    let text = raw.trim()
    // Collapse repeated phrases (e.g. "Key HighlightsKey Highlights+16" -> "Key Highlights")
    const repeatedPhrases = ['Key Highlights', 'Product highlights', 'All details', 'Showcase', 'Specifications', 'Warranty', 'Manufacturer info', 'Show More']
    repeatedPhrases.forEach(phrase => {
        const regex = new RegExp(`(${phrase.replace(/\s+/g, '\\s*')})(\\s*\\1)*(\\s*\\+?\\d*)?`, 'gi')
        text = text.replace(regex, phrase + ' ')
    })
    // Remove stray "+16" or similar
    text = text.replace(/\s*\+\d+\s*/g, ' ')
    // Normalize multiple newlines and spaces
    text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)
    const formatted = lines.map(line => {
        if (line.includes('|') && line.length < 250) {
            return line.split('|').map(s => s.trim()).filter(Boolean).join(' • ')
        }
        return line
    }).join('\n\n')
    return formatted.trim() || raw.trim()
}

const ProductDetails = () => {
    const { id, slug } = useParams()
    const productId = id || slug
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [quantity, setQuantity] = useState(1)
    const { addItem, isLoading: cartLoading } = useCartStore()
    const { isAuthenticated } = useAuthStore()
    const navigate = useNavigate()
    const { toast } = useToast()

    const { data: product, isLoading, error, refetch: refetchProduct } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => getProductById(productId),
        enabled: !!productId,
    })

    const { data: reviews, refetch: refetchReviews } = useQuery({
        queryKey: ['reviews', product?._id],
        queryFn: () => getProductReviews(product._id),
        enabled: !!product?._id,
    })

    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [reviewLoading, setReviewLoading] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)

    const [questions, setQuestions] = useState([])
    const [newQuestion, setNewQuestion] = useState('')
    const [showQA, setShowQA] = useState(false)
    const [answerTexts, setAnswerTexts] = useState({})

    const { toggleWishlist, isInWishlist, fetchWishlist } = useWishlistStore()
    const isProductInWishlist = isInWishlist(product?._id)

    const [pincode, setPincode] = useState('')
    const [serviceability, setServiceability] = useState(null)
    const [isCheckingPincode, setIsCheckingPincode] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist()
        }
    }, [isAuthenticated, fetchWishlist])

    useEffect(() => {
        if (product?._id) {
            getQuestions(product._id).then(res => {
                setQuestions(res?.data || res || [])
            }).catch(() => {})
        }
    }, [product?._id])

    const { data: relatedData } = useQuery({
        queryKey: ['products', 'related', product?.categoryId?._id || 'all'],
        queryFn: () => getProducts({
            category: product?.categoryId?.slug,
            limit: 5,
            isActive: true
        }),
        enabled: !!product,
    })

    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Update selected variant whenever attributes change
    useEffect(() => {
        if (product?.hasVariants && product.variants?.length > 0) {
            const variant = product.variants.find(v => {
                const variantAttributes = v.attributes instanceof Map 
                    ? Object.fromEntries(v.attributes) 
                    : v.attributes;
                return Object.entries(selectedAttributes).every(([key, value]) => variantAttributes[key] === value);
            });
            setSelectedVariant(variant);
        }
    }, [selectedAttributes, product]);

    // Reset media selection when variant changes (e.g. color)
    useEffect(() => {
        setSelectedMediaIndex(0);
    }, [selectedVariant]);

    // Initialize selected attributes
    useEffect(() => {
        if (product?.hasVariants && product.variantAttributes?.length > 0) {
            const initialAttrs = {};
            product.variantAttributes.forEach(attr => {
                initialAttrs[attr.name] = attr.values[0];
            });
            setSelectedAttributes(initialAttrs);
        }
    }, [product]);

    useEffect(() => {
        window.scrollTo(0, 0)
        setSelectedMediaIndex(0)
        setQuantity(1)
        if (product) recordRecentlyViewed(product)
    }, [id, product])

    // Close lightbox on Escape
    useEffect(() => {
        const onEscape = (e) => { if (e.key === 'Escape') setLightboxOpen(false) }
        if (lightboxOpen) {
            document.addEventListener('keydown', onEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', onEscape)
            document.body.style.overflow = ''
        }
    }, [lightboxOpen])

    // Use variant images when selected variant has its own images (e.g. color change)
    const variantImageIds = selectedVariant?.imageIds && selectedVariant.imageIds?.length > 0
      ? selectedVariant.imageIds
      : product?.imageIds
    const imageUrls = variantImageIds?.length ? getProductImages(variantImageIds) : (product?.imageIds ? getProductImages(product.imageIds) : [])

    // Build unified media (images + videos) for Flipkart-style gallery
    const videoUrls = (product?.videoIds || []).map(id => getProductVideoUrl(id))
    const media = [
      ...imageUrls.map(url => ({ type: 'image', url })),
      ...videoUrls.map(url => ({ type: 'video', url }))
    ]
    const hasMedia = media.length > 0
    
    // Dynamic values based on variant
    const displayPrice = selectedVariant ? (selectedVariant.discountPrice || selectedVariant.price) : (product?.discountPrice || product?.price);
    const originalPrice = selectedVariant ? selectedVariant.price : product?.price;
    const currentStock = selectedVariant ? selectedVariant.stock : product?.stock;
    const isOutOfStock = currentStock === 0;
    const hasDiscount = originalPrice && originalPrice > displayPrice;

    const handleAddToCart = async () => {
        if (isOutOfStock) return;
        
        if (!isAuthenticated) {
            toast({
                title: "Please sign in",
                description: "You need to be logged in to add items to cart",
                variant: "destructive",
            })
            navigate('/login')
            return
        }
        if (product) {
            try {
                await addItem(product._id, quantity, selectedVariant?._id)
                toast({
                    title: "Added to cart",
                    description: `${product.name}${selectedVariant ? ` (${Object.values(selectedAttributes).join(' / ')})` : ''} has been added to your cart`,
                })
            } catch (error) {
                toast({
                    title: "Failed to add item",
                    description: error.message || "Could not add item to cart",
                    variant: "destructive",
                })
            }
        }
    }

    const handleBuyNow = () => {
        if (isOutOfStock) return;

        if (!isAuthenticated) {
            toast({
                title: "Please sign in",
                description: "You need to be logged in to buy items",
                variant: "destructive",
            })
            navigate('/login')
            return
        }
        if (product) {
            navigate('/checkout', {
                state: {
                    buyNow: {
                        productId: product._id,
                        variantId: selectedVariant?._id,
                        selectedAttributes: selectedVariant ? selectedAttributes : null,
                        product: { ...product, price: displayPrice, discountPrice: null, stock: currentStock },
                        quantity,
                        price: displayPrice
                    }
                }
            })
        }
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault()
        if (!isAuthenticated) {
            toast({ title: "Auth required", description: "Please login to review", variant: "destructive" })
            return
        }
        if (!comment.trim()) {
            toast({ title: "Error", description: "Please add a comment", variant: "destructive" })
            return
        }

        setReviewLoading(true)
        try {
            await createReview({
                productId: product._id,
                rating: rating,
                comment: comment
            })
            toast({ title: "Success", description: "Review submitted successfully" })
            setComment('')
            setRating(5)
            setShowReviewForm(false)
            refetchReviews()
            refetchProduct()
        } catch (error) {
            toast({
                title: "Failed to submit",
                description: error.message || "Something went wrong",
                variant: "destructive"
            })
        } finally {
            setReviewLoading(false)
        }
    }

    const handleAskQuestion = async () => {
        if (!newQuestion.trim() || !product?._id) return
        try {
            await askQuestion(product._id, newQuestion.trim())
            setNewQuestion('')
            const res = await getQuestions(product._id)
            setQuestions(res?.data || res || [])
        } catch {}
    }

    const handleAnswer = async (questionId) => {
        const text = answerTexts[questionId]?.trim()
        if (!text) return
        try {
            await answerQuestion(questionId, text)
            setAnswerTexts(prev => ({ ...prev, [questionId]: '' }))
            const res = await getQuestions(product._id)
            setQuestions(res?.data || res || [])
        } catch {}
    }

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast({
                title: "Link Copied!",
                description: "Product link copied to clipboard.",
            });
        });
    };

    const handleWhatsAppShare = () => {
        const url = window.location.href;
        const text = `Check out this product on Edisonkart: ${product.name} - ${url}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleWishlistToggle = async () => {
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

    const handleCheckPincode = async (e) => {
        e.preventDefault();
        if (!pincode || pincode.length !== 6) {
            toast({
                title: "Invalid Pincode",
                description: "Please enter a valid 6-digit pincode",
                variant: "destructive"
            });
            return;
        }

        setIsCheckingPincode(true);
        try {
            const result = await checkPincodeServiceability(pincode);
            setServiceability(result);
            if (!result.available) {
                toast({
                    title: "Not Serviceable",
                    description: "Currently not delivering to this location",
                    variant: "warning"
                });
            }
        } catch (error) {
            toast({
                title: "Check Failed",
                description: "Could not verify pincode serviceability",
                variant: "destructive"
            });
        } finally {
            setIsCheckingPincode(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="aspect-square skeleton-shine rounded-2xl bg-muted" />
                        <div className="flex gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-20 h-20 skeleton-shine rounded-xl bg-muted" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4 pt-4">
                        <div className="h-4 skeleton-shine rounded-lg w-1/4 bg-muted" />
                        <div className="h-8 skeleton-shine rounded-lg w-3/4 bg-muted" />
                        <div className="h-6 skeleton-shine rounded-lg w-1/3 bg-muted" />
                        <div className="h-4 skeleton-shine rounded-lg w-full bg-muted" />
                        <div className="h-4 skeleton-shine rounded-lg w-2/3 bg-muted" />
                        <div className="h-12 skeleton-shine rounded-xl w-full mt-6 bg-muted" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-4">
                        <Package className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
                    <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist</p>
                    <Link to="/products">
                        <Button className="rounded-xl bg-[#1E3A8A] hover:bg-[#15306B]">Back to Shop</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const relatedProducts = relatedData?.products?.filter(p => p._id !== product._id) || []

    return (
        <div className="pt-24 pb-24 md:pb-16 bg-background">
            <Helmet>
                <title>{product?.name ? `${product.name} — EdisonKart` : 'EdisonKart'}</title>
                <meta name="description" content={product?.description?.slice(0, 160) || 'Shop premium products on EdisonKart'} />
                <meta property="og:title" content={product?.name || 'EdisonKart'} />
                <meta property="og:description" content={product?.description?.slice(0, 160) || ''} />
                {product?.imageIds?.[0] && <meta property="og:image" content={getProductImage(product.imageIds[0])} />}
            </Helmet>
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
                    {product.categoryId && (
                        <>
                            <ChevronRight className="h-4 w-4 shrink-0" />
                            <Link 
                                to={`/products?category=${product.categoryId.slug}`}
                                className="hover:text-primary transition-colors"
                            >
                                {product.categoryId.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <span className="text-foreground font-medium truncate">{product.name}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left: Image Gallery */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => hasMedia && setLightboxOpen(true)}
                            onKeyDown={(e) => hasMedia && (e.key === 'Enter' || e.key === ' ') && setLightboxOpen(true)}
                            className="aspect-square rounded-3xl overflow-hidden bg-white border border-border/50 relative group cursor-zoom-in"
                        >
                            <AnimatePresence mode="wait">
                                {hasMedia ? (
                                    media[selectedMediaIndex].type === 'video' ? (
                                        <motion.div
                                            key={`video-${selectedMediaIndex}`}
                                            initial={{ opacity: 0, scale: 1.02 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full h-full flex items-center justify-center bg-slate-900"
                                        >
                                            <video
                                                src={media[selectedMediaIndex].url}
                                                controls
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full h-full object-contain"
                                                preload="metadata"
                                                playsInline
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.img
                                            key={`img-${selectedMediaIndex}`}
                                            initial={{ opacity: 0, scale: 1.1 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            src={media[selectedMediaIndex].url}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-4 sm:p-8"
                                        />
                                    )
                                ) : (
                                    <motion.img
                                        key="placeholder"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        src={NO_IMAGE_PLACEHOLDER}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4 sm:p-8"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Navigation Arrows */}
                            {media.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1)); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedMediaIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0)); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails: images + videos side by side (Flipkart-style) */}
                        {media.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {media.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedMediaIndex(i)}
                                        type="button"
                                        className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${
                                            selectedMediaIndex === i
                                                ? 'border-primary shadow-md ring-2 ring-primary/20'
                                                : 'border-border/50 hover:border-primary/50'
                                        }`}
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                <Video className="h-8 w-8 text-white/90" />
                                            </div>
                                        ) : (
                                            <img src={item.url} alt="" className="w-full h-full object-contain p-2 bg-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Product Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-wrap gap-2 items-center">
                            {product.brand && (
                                <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg">
                                    {product.brand}
                                </span>
                            )}
                            {product.categoryId && (
                                <Link to={`/products?category=${product.categoryId.slug}`}>
                                    <span className="text-xs font-semibold text-[#F97316] uppercase tracking-wider hover:underline">
                                        {product.categoryId.name}
                                    </span>
                                </Link>
                            )}
                        </div>

                        {/* Name, Share & Wishlist */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight flex-1">{product.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={handleWishlistToggle}
                                    className={`p-2.5 rounded-full transition-all border ${
                                        isProductInWishlist 
                                        ? 'bg-red-50 text-red-500 border-red-100 shadow-sm' 
                                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-red-400'
                                    }`}
                                    title={isProductInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                                >
                                    <Heart className={`h-5 w-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
                                </button>
                                <div className="h-6 w-px bg-slate-200 mx-1" />
                                <button
                                    onClick={handleWhatsAppShare}
                                    className="p-2.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100"
                                    title="Share on WhatsApp"
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100"
                                    title="Copy Link"
                                >
                                    <Link2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-4">
                            <span className="text-3xl sm:text-4xl font-bold text-[#1E3A8A]">₹{Math.round(displayPrice).toLocaleString('en-IN')}</span>
                            {originalPrice > displayPrice && (
                                <>
                                    <span className="text-xl text-slate-400 line-through">₹{Math.round(originalPrice).toLocaleString('en-IN')}</span>
                                    <span className="text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-lg text-sm">
                                        {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Rating */}
                        {product.averageRating > 0 && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#26a541] text-white font-medium text-sm">
                                    <span>{product.averageRating.toFixed(1)}</span>
                                    <Star className="h-3 w-3 fill-white text-white" />
                                </div>
                                <span className="text-sm font-medium text-slate-500">
                                    {product.numReviews.toLocaleString()} Ratings & {product.numReviews.toLocaleString()} Reviews
                                </span>
                            </div>
                        )}
                        {/* Variant Selectors */}
                        {product.hasVariants && product.variantAttributes?.length > 0 && (
                            <div className="space-y-6 py-2">
                                {product.variantAttributes.map((attr) => (
                                    <div key={attr.name} className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                                                Select {attr.name}: <span className="text-slate-900">{selectedAttributes[attr.name]}</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.values.map((value) => {
                                                const isSelected = selectedAttributes[attr.name] === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: value })}
                                                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                                                            isSelected 
                                                            ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                        }`}
                                                    >
                                                        {value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="h-px bg-slate-100"></div>

                        {/* Stock & Quantity */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 disabled:opacity-30"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-12 text-center text-lg font-bold text-slate-800">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 disabled:opacity-30"
                                        disabled={quantity >= currentStock}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex flex-col">
                                    {currentStock > 0 ? (
                                        <>
                                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                                <Package className="h-4 w-4" />
                                                <span>In Stock</span>
                                            </div>
                                            {currentStock < 10 && (
                                                <span className="text-xs text-orange-500 font-medium">Only {currentStock} left - order soon</span>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-500 font-bold">
                                            <Package className="h-4 w-4" />
                                            <span>Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <Button
                                size="lg"
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
                                onClick={handleAddToCart}
                                disabled={cartLoading || isOutOfStock}
                            >
                                <ShoppingCart className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 border-primary text-primary hover:bg-primary/5 h-14 rounded-2xl text-lg font-bold group"
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                            >
                                <Zap className="mr-2 h-6 w-6 fill-current group-hover:scale-110 transition-transform" />
                                Buy Now
                            </Button>
                        </div>

                        {/* Delivery Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Truck className="h-6 w-6 text-primary mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-slate-800">Fast Delivery</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Free on orders above ₹999</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Shield className="h-6 w-6 text-primary mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-slate-800">Secure Warranty</p>
                                    <p className="text-xs text-slate-500 mt-0.5">1 Year Brand Warranty</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Reviews Section */}
                <div className="mt-20 pt-20 border-t border-border/50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold">Ratings & Reviews</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-2xl font-bold">
                                    {product.averageRating.toFixed(1)}
                                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                </div>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-500 font-medium">{product.numReviews.toLocaleString()} verified buyers</span>
                            </div>
                        </div>
                        <Button 
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            variant="outline"
                            className="rounded-xl px-6"
                        >
                            {showReviewForm ? 'Cancel' : 'Write a Review'}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showReviewForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-12"
                            >
                                <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-inner">
                                    <h3 className="text-xl font-bold mb-6">Your Experience</h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-700">How would you rate it?</p>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                                            rating >= star ? 'bg-amber-400 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-200'
                                                        }`}
                                                    >
                                                        <Star className={`h-6 w-6 ${rating >= star ? 'fill-current' : ''}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-700">Detailed Review</p>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="What did you like or dislike? How's the performance?"
                                                rows={4}
                                                required
                                                className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-primary transition-all resize-none shadow-sm"
                                            />
                                        </div>
                                        <Button 
                                            type="submit" 
                                            disabled={reviewLoading}
                                            className="rounded-xl px-10 h-12 font-bold"
                                        >
                                            {reviewLoading ? 'Publishing...' : 'Submit Review'}
                                        </Button>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Review List */}
                    <div className="space-y-6">
                        {reviews?.map((review) => (
                            <div key={review._id} className="pb-8 border-b border-border/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#26a541] text-white font-bold text-xs">
                                        <span>{review.rating}</span>
                                        <Star className="h-3 w-3 fill-white text-white" />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{review.rating >= 4 ? 'Excellent' : review.rating >= 3 ? 'Good' : 'Average'}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{review.comment || review.review}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                                    <span className="font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{review.user?.name || 'Verified Buyer'}</span>
                                    <span>•</span>
                                    <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="flex items-center gap-1 text-[#26a541] font-bold">
                                        <Check className="h-3 w-3" />
                                        Certified Buyer
                                    </span>
                                </div>
                            </div>
                        ))}

                        {(!reviews || reviews.length === 0) && (
                            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed">
                                <p className="text-slate-500">No reviews yet. Be the first to review this product!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Q&A Section */}
                <div className="mt-12 bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                    <button onClick={() => setShowQA(!showQA)} className="w-full flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">Questions & Answers ({questions.length})</h2>
                        <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showQA ? 'rotate-90' : ''}`} />
                    </button>

                    {showQA && (
                        <div className="mt-6 space-y-6">
                            {/* Ask a question */}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Have a question? Ask here..."
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    maxLength={500}
                                />
                                <Button onClick={handleAskQuestion} disabled={!newQuestion.trim()} size="sm" className="rounded-xl px-6">
                                    Ask
                                </Button>
                            </div>

                            {/* Questions list */}
                            {questions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No questions yet. Be the first to ask!</p>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q) => (
                                        <div key={q._id} className="border border-border/50 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="font-bold text-primary text-sm mt-0.5">Q:</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-foreground">{q.text}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Asked by {q.userId?.name || 'User'} • {new Date(q.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {(q.answers || []).map((a) => (
                                                <div key={a._id} className="ml-6 mt-3 pl-3 border-l-2 border-primary/20">
                                                    <div className="flex items-start gap-2">
                                                        <span className="font-bold text-green-600 text-sm">A:</span>
                                                        <div>
                                                            <p className="text-sm text-foreground">{a.text}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {a.userId?.name || 'User'} {a.userId?.role === 'ADMIN' ? '(EdisonKart)' : ''} • {new Date(a.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="ml-6 mt-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Write an answer..."
                                                    value={answerTexts[q._id] || ''}
                                                    onChange={(e) => setAnswerTexts(prev => ({ ...prev, [q._id]: e.target.value }))}
                                                    className="flex-1 px-3 py-1.5 bg-muted/30 border border-border rounded-lg text-xs outline-none"
                                                    maxLength={1000}
                                                />
                                                <button onClick={() => handleAnswer(q._id)} disabled={!answerTexts[q._id]?.trim()} className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50">
                                                    Answer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-16">
                    <div className="border-b border-border/50 mb-8 pb-4">
                        <h3 className="text-xl font-bold font-syne uppercase tracking-wider text-[#F97316]">Product Description</h3>
                    </div>
                    <div className="bg-card p-5 sm:p-8 rounded-2xl border border-border/50">
                        <div
                            className={cn(
                                "text-muted-foreground leading-relaxed text-base sm:text-lg [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_a]:text-[#F97316] [&_a]:underline hover:[&_a]:no-underline",
                                /<[a-z][\s\S]*>/i.test(product.description || '') ? '' : 'whitespace-pre-line'
                            )}
                            dangerouslySetInnerHTML={{
                                __html: (() => {
                                    const raw = product.description || 'No description available for this product.'
                                    const cleaned = formatProductDescription(raw)
                                    if (/<[a-z][\s\S]*>/i.test(cleaned)) {
                                        return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'a'], ALLOWED_ATTR: ['href'] })
                                    }
                                    return DOMPurify.sanitize(cleaned.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
                                })()
                            }}
                        />
                    </div>
                </div>

                {/* Similar Products fallback */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 border-t border-border/50 pt-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                            <div>
                                <span className="text-[#F97316] text-sm font-semibold uppercase tracking-wider">
                                    {product.categoryId ? 'Same Category' : 'Featured Selection'}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold mt-2">
                                    {product.categoryId ? 'Similar Products' : 'Recommended Products'}
                                </h2>
                            </div>
                            {product.categoryId && (
                                <Link to={`/products?category=${product.categoryId.slug}`}>
                                    <Button variant="outline" className="rounded-xl px-6 gap-2">
                                        View All {product.categoryId.name}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.slice(0, 4).map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendation Sections */}
            {product && (
                <ProductRecommendations currentProduct={product} selectedVariant={selectedVariant} />
            )}

            {/* Full-screen image/video lightbox (Flipkart-style) */}
            <AnimatePresence>
                {lightboxOpen && hasMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950"
                    >
                        {/* Close button - top left */}
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Main content - centered image/video */}
                        <div className="flex-1 flex items-center justify-center min-h-0 relative">
                            {media[selectedMediaIndex].type === 'video' ? (
                                <div className="w-full h-full max-h-[85vh] flex items-center justify-center bg-slate-900">
                                    <video
                                        src={media[selectedMediaIndex].url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-[85vh] object-contain"
                                        preload="auto"
                                        playsInline
                                    />
                                </div>
                            ) : (
                                <motion.img
                                    key={selectedMediaIndex}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    src={media[selectedMediaIndex].url}
                                    alt={product.name}
                                    className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                                />
                            )}

                            {/* Left arrow */}
                            {media.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft className="h-7 w-7" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMediaIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
                                        aria-label="Next"
                                    >
                                        <ChevronRight className="h-7 w-7" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Pagination dots - bottom */}
                        {media.length > 1 && (
                            <div className="flex justify-center gap-2 py-6 pb-8">
                                {media.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedMediaIndex(i)}
                                        className={cn(
                                            'rounded-full transition-all',
                                            i === selectedMediaIndex
                                                ? 'w-8 h-2.5 bg-[#1E3A8A] dark:bg-blue-500'
                                                : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                                        )}
                                        aria-label={`Go to item ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Mobile Buy Bar */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-2xl">
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleAddToCart}
                        disabled={cartLoading || product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold text-sm shadow-md disabled:opacity-50"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBuyNow}
                        disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F97316] text-white font-bold text-sm shadow-md disabled:opacity-50"
                    >
                        <Zap className="h-4 w-4" />
                        Buy Now
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default ProductDetails