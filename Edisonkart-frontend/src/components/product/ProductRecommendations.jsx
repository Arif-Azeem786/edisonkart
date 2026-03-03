import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ShoppingBag, Zap, Star } from 'lucide-react';
import { getProducts } from '../../services/product';
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils';
import { Button } from '../ui/button';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { useToast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';

/* ─── Helpers ──────────────────────────────────────────────────── */

const RECENTLY_VIEWED_KEY = 'ek_recently_viewed';
const MAX_RECENT = 10;

export function recordRecentlyViewed(product) {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
        const filtered = stored.filter((p) => p._id !== product._id);
        const updated = [{
            _id: product._id,
            name: product.name,
            price: product.price,
            slug: product.slug,
            imageIds: product.imageIds || product.images || [],  // backend uses imageIds
            rating: product.rating
        }, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch (_) {}
}

function getRecentlyViewed(excludeId) {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
        return stored.filter((p) => p._id !== excludeId);
    } catch (_) {
        return [];
    }
}

/* ─── Horizontal scroll strip ──────────────────────────────────── */

function ProductStrip({ title, subtitle, icon: Icon, iconColor, products, loading }) {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${iconColor} bg-opacity-15`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => scroll(-1)} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => scroll(1)} className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Scroll container */}
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                    : products.map((product, i) => (
                        <motion.div
                            key={product._id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex-shrink-0"
                        >
                            <MiniProductCard product={product} />
                        </motion.div>
                    ))}
            </div>
        </div>
    );
}

/* ─── Mini Product Card ─────────────────────────────────────────── */

function MiniProductCard({ product }) {
    // Support both imageIds (backend field) and images (legacy)
    const firstImageId = (product.imageIds || product.images)?.[0];
    const imageUrl = firstImageId
        ? getProductImageUrl(firstImageId)
        : NO_IMAGE_PLACEHOLDER;

    return (
        <Link to={`/products/${product.slug || product._id}`} className="block w-[180px] group">
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                <div className="relative aspect-square bg-muted overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.src = NO_IMAGE_PLACEHOLDER; }}
                    />
                    {product.discount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            -{product.discount}%
                        </span>
                    )}
                </div>
                <div className="p-3">
                    <p className="text-xs text-foreground font-medium line-clamp-2 leading-snug mb-1.5">{product.name}</p>
                    {product.rating > 0 && (
                        <div className="flex items-center gap-1 mb-1.5">
                            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] text-muted-foreground">{product.rating?.toFixed(1)}</span>
                        </div>
                    )}
                    <p className="text-sm font-bold text-foreground">₹{product.price?.toLocaleString()}</p>
                </div>
            </div>
        </Link>
    );
}

/* ─── Skeleton ──────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[180px] bg-card border border-border/50 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
            </div>
        </div>
    );
}

/* ─── Frequently Bought Together (visual) ───────────────────────── */

function FrequentlyBoughtTogether({ currentProduct, relatedProducts, selectedVariant }) {
    const { addItems, isLoading } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const { toast } = useToast();
    const navigate = useNavigate();

    const bundle = [currentProduct, ...relatedProducts.slice(0, 2)];
    
    // Calculate total using selectedVariant price if available for currentProduct
    const total = bundle.reduce((sum, p, idx) => {
        if (idx === 0 && selectedVariant) {
            return sum + (selectedVariant.discountPrice || selectedVariant.price);
        }
        return sum + (p?.discountPrice || p?.price || 0);
    }, 0);

    const handleBuyBundle = async () => {
        if (!isAuthenticated) {
            toast({
                title: "Please sign in",
                description: "You need to be logged in to add bundles to cart",
                variant: "destructive",
            });
            navigate('/login');
            return;
        }

        const itemsToBuy = bundle.map((p, idx) => ({
            productId: p._id,
            quantity: 1,
            variantId: (idx === 0 && selectedVariant) ? selectedVariant._id : null
        }));

        try {
            await addItems(itemsToBuy);
            toast({
                title: "Bundle added to cart!",
                description: "All items have been added safely.",
            });
        } catch (error) {
            toast({
                title: "Failed to add bundle",
                description: "Something went wrong while adding items.",
                variant: "destructive",
            });
        }
    };

    if (!relatedProducts.length) return null;

    return (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                <div>
                    <h3 className="text-base font-bold text-foreground">Frequently Bought Together</h3>
                    <p className="text-xs text-muted-foreground">Customers who bought this also bought</p>
                </div>
            </div>

            {/* Product row */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 flex-1">
                    {bundle.map((product, idx) => (
                        <div key={product?._id} className="flex items-center gap-2 flex-shrink-0">
                            <Link to={`/products/${product?.slug || product?._id}`} className="flex-shrink-0 group">
                                <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-white transition-all ${idx === 0 ? 'border-primary shadow-sm shadow-[#1E3A8A]/10' : 'border-slate-200 hover:border-[#1E3A8A]/30'}`}>
                                    <img
                                        src={(product?.imageIds || product?.images)?.[0] ? getProductImageUrl((product.imageIds || product.images)[0]) : NO_IMAGE_PLACEHOLDER}
                                        alt={product?.name}
                                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                                        onError={(e) => { e.target.src = NO_IMAGE_PLACEHOLDER; }}
                                    />
                                </div>
                                <p className="text-[10px] text-center font-medium mt-1 w-20 truncate leading-tight h-6">{product?.name}</p>
                                <p className="text-[11px] text-center font-bold">₹{((idx === 0 && selectedVariant) ? (selectedVariant.discountPrice || selectedVariant.price) : (product?.discountPrice || product?.price))?.toLocaleString()}</p>
                            </Link>
                            {idx < bundle.length - 1 && (
                                <span className="text-muted-foreground font-bold text-lg flex-shrink-0">+</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Total & Action */}
                <div className="flex justify-between items-center md:flex-col md:items-end md:justify-center md:pl-6 md:border-l border-orange-200 dark:border-orange-800 gap-4">
                    <div className="md:text-right">
                        <p className="text-xs text-muted-foreground">Bundle total</p>
                        <p className="text-2xl font-black text-foreground">₹{total.toLocaleString()}</p>
                        <p className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                            <Zap className="h-3 w-3 fill-current" />
                            Save up to 15%
                        </p>
                    </div>
                    <Button 
                        onClick={handleBuyBundle}
                        disabled={isLoading}
                        className="rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold h-12 px-6 shadow-lg shadow-orange-500/20 whitespace-nowrap"
                    >
                        {isLoading ? "Adding..." : "Add Bundle to Cart"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main component ────────────────────────────────────────────── */

export default function ProductRecommendations({ currentProduct, selectedVariant }) {
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [loadingCategory, setLoadingCategory] = useState(true);

    const categoryId = currentProduct?.categoryId?._id || currentProduct?.categoryId;
    const categoryName = currentProduct?.categoryId?.name || 'This Category';

    useEffect(() => {
        // Load recently viewed from localStorage
        setRecentlyViewed(getRecentlyViewed(currentProduct?._id));
    }, [currentProduct?._id]);

    useEffect(() => {
        // Fetch trending / top-rated products (smart suggestions)
        getProducts({ sortBy: 'rating', order: 'desc', limit: 12 })
            .then((res) => setTrendingProducts((res?.products || res || []).filter(p => p._id !== currentProduct?._id)))
            .catch(() => {})
            .finally(() => setLoadingTrending(false));
    }, [currentProduct?._id]);

    useEffect(() => {
        // Fetch category-based products (browsing history simulation)
        if (!categoryId) { setLoadingCategory(false); return; }
        getProducts({ category: categoryId, limit: 10 })
            .then((res) => setCategoryProducts((res?.products || res || []).filter(p => p._id !== currentProduct?._id)))
            .catch(() => {})
            .finally(() => setLoadingCategory(false));
    }, [categoryId, currentProduct?._id]);

    return (
        <div className="mt-16 space-y-10 border-t border-border/50 pt-12">

            {/* 1. Frequently Bought Together */}
            {categoryProducts.length >= 2 && (
                <FrequentlyBoughtTogether
                    currentProduct={currentProduct}
                    relatedProducts={categoryProducts.slice(0, 2)}
                    selectedVariant={selectedVariant}
                />
            )}

            {/* 2. Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <div>
                    <ProductStrip
                        title="Recently Viewed"
                        subtitle="Pick up where you left off"
                        icon={Clock}
                        iconColor="text-blue-500"
                        products={recentlyViewed}
                        loading={false}
                    />
                </div>
            )}

            {/* 3. Based on Browsing History (same category) */}
            {(loadingCategory || categoryProducts.length > 0) && (
                <div>
                    <ProductStrip
                        title={`Based on Your Browsing History`}
                        subtitle={`More from ${categoryName}`}
                        icon={TrendingUp}
                        iconColor="text-green-500"
                        products={categoryProducts}
                        loading={loadingCategory}
                    />
                </div>
            )}

            {/* 4. Smart Suggestions — Top Rated */}
            {(loadingTrending || trendingProducts.length > 0) && (
                <div>
                    <ProductStrip
                        title="Smart Suggestions"
                        subtitle="Top rated picks just for you"
                        icon={Zap}
                        iconColor="text-yellow-500"
                        products={trendingProducts}
                        loading={loadingTrending}
                    />
                </div>
            )}
        </div>
    );
}
