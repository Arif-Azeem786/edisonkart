import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ShoppingCart, Star, Eye, ArrowRight, Heart, Share2, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useCompareStore from '../../store/compareStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!product) return null;

  const isProductInCompare = isInCompare(product?._id);

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const imageUrl = product.imageIds?.length > 0
    ? getProductImageUrl(product.imageIds[0])
    : NO_IMAGE_PLACEHOLDER;

  const handleAddToCart = async () => {
    if (product.stock === 0) return;

    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      });
      navigate('/login');
      onClose();
      return;
    }

    try {
      await addItem(product._id, 1);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Failed to add item",
        description: error.message || "Could not add item to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[94%] max-w-[400px] md:max-w-4xl p-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] md:rounded-3xl">
        <div className="flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-[90vh]">
          {/* Image Section */}
          <div className="h-48 md:h-auto md:w-1/2 relative bg-slate-50 dark:bg-slate-900 group">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 px-2.5 py-1 bg-[#F97316] text-white text-[10px] md:text-xs font-bold rounded-full shadow-lg">
                -{discountPercent}%
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/2 p-5 md:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                {product.categoryId && (
                  <span className="px-2.5 py-0.5 bg-[#1E3A8A]/10 text-[#1E3A8A] dark:text-blue-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {product.categoryId.name}
                  </span>
                )}
                {product.brand && (
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {product.brand}
                  </span>
                )}
              </div>

              <DialogTitle className="text-xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1.5 md:mb-2 leading-tight">
                {product.name}
              </DialogTitle>

              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 md:h-4 md:w-4 ${
                        star <= (product.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-slate-200 dark:fill-slate-800 text-slate-200 dark:text-slate-800'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] md:text-sm text-slate-400 ml-1.5 md:ml-2">
                    ({product.numOfReviews || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <span className="text-2xl md:text-4xl font-black text-[#F97316]">
                  ₹{displayPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-base md:text-xl text-slate-400 line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                )}
              </div>

              <DialogDescription className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 md:mb-8 text-sm md:text-lg line-clamp-3 md:line-clamp-none">
                {(product.description || "Experience premium quality with our " + product.name + ".").replace(/<[^>]*>/g, '')}
              </DialogDescription>

              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 md:h-3 md:w-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className={`text-[11px] md:text-sm font-medium ${product.stock > 0 ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                    {product.stock > 0 ? `${product.stock} Units left` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-12 space-y-3 md:space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isLoading}
                className="w-full h-12 md:h-16 rounded-2xl bg-[#1E3A8A] hover:bg-[#F97316] text-white font-bold text-base md:text-lg shadow-xl shadow-[#1E3A8A]/20 transition-all duration-300 group"
              >
                <ShoppingCart className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              <div className="flex gap-2 md:gap-4 mt-2 md:mt-0">
                <Button
                  variant="outline"
                  className="flex-1 h-10 md:h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-xs md:text-sm"
                  onClick={() => {
                    navigate(`/product/${product._id}`);
                    onClose();
                  }}
                >
                  Details
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-all"
                >
                  <Heart className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.5} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-10 w-10 md:h-12 md:w-12 rounded-xl border-slate-200 dark:border-slate-800 transition-all ${
                    isProductInCompare 
                    ? 'bg-[#F97316] text-white border-[#F97316]' 
                    : 'hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    if (isProductInCompare) {
                      removeFromCompare(product._id);
                    } else {
                      addToCompare(product);
                    }
                  }}
                  title={isProductInCompare ? "Remove from Compare" : "Compare"}
                >
                  <GitCompare className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.5} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-50 transition-all"
                >
                  <Share2 className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
