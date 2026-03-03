import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ShoppingCart, Star, X, Check, ShoppingBag, GitCompare, Package, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useCompareStore from '../../store/compareStore';
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils';

const CompareModal = ({ isOpen, onClose }) => {
  const { compareItems, removeFromCompare } = useCompareStore();
  const { addItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = async (product) => {
    if (product.stock === 0) return;
    try {
      await addItem(product._id, 1);
    } catch (error) {
      // toast is handled in cart store or handled globally
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96%] max-w-[400px] md:max-w-7xl p-0 overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] md:rounded-3xl">
        <div className="flex flex-col h-full max-h-[85vh] md:max-h-[90vh]">
          <DialogHeader className="p-5 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-[#1E3A8A] text-white p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <GitCompare className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg md:text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">Comparison</DialogTitle>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm mt-0.5 md:mt-1 font-medium italic">Finding your match</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
            <div className="min-w-fit flex gap-6">
              {/* Feature Labels Column */}
              <div className="w-16 md:w-48 sticky left-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-10 pt-28 md:pt-72">
                 <div className="space-y-[100px] md:space-y-48">
                    <p className="text-[8px] md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Brand</p>
                    <p className="text-[8px] md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pricing</p>
                    <p className="text-[8px] md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rating</p>
                    <p className="text-[8px] md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock</p>
                 </div>
              </div>

              {/* Product Columns */}
              <AnimatePresence mode="popLayout">
                {compareItems.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-44 md:w-80 flex-shrink-0 group"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] md:rounded-3xl border border-slate-100 dark:border-slate-800 p-2.5 md:p-6 space-y-3 md:space-y-8 ring-1 ring-slate-200/50 dark:ring-slate-800/50 shadow-sm transition-all duration-500 relative">
                      
                      <button 
                        onClick={() => removeFromCompare(product._id)}
                        className="absolute top-2 right-2 md:top-4 md:right-4 z-20 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-red-500 hover:text-white text-slate-400 dark:text-slate-500 p-1 md:p-2 rounded-lg transition-all shadow-sm backdrop-blur-sm"
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                      </button>

                      {/* Header Info */}
                      <div className="space-y-2 md:space-y-4">
                        <div className="aspect-[4/5] rounded-lg md:rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <img 
                            src={product.imageIds?.length > 0 ? getProductImageUrl(product.imageIds[0]) : NO_IMAGE_PLACEHOLDER} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-[11px] md:text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2 h-[2rem] md:h-[3.5rem] leading-tight">{product.name}</h3>
                      </div>

                      {/* Stats Table */}
                      <div className="space-y-16 md:space-y-20 pt-1 md:pt-4">
                        {/* Brand */}
                        <div className="h-6 flex items-center">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-md md:rounded-lg w-fit">
                            {product.brand || "EdisonKart"}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="h-10 flex flex-col justify-center">
                          <div className="flex items-center gap-1">
                             <span className="text-sm md:text-3xl font-black text-[#F97316]">₹{product.discountPrice?.toLocaleString() || product.price.toLocaleString()}</span>
                          </div>
                          {product.discountPrice && (
                            <span className="text-[9px] md:text-sm text-slate-400 dark:text-slate-600 line-through leading-none">₹{product.price.toLocaleString()}</span>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="h-12 flex items-center">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 md:p-3 rounded-lg md:rounded-2xl w-fit">
                            <Star className="h-2.5 w-2.5 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs md:text-lg font-black text-slate-900 dark:text-slate-100">{product.averageRating?.toFixed(1) || "4.5"}</span>
                             <span className="text-[8px] md:text-xs text-slate-400 dark:text-slate-500 font-bold">({product.numOfReviews || 0})</span>
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="h-10 flex items-center">
                           <div className={`flex items-center gap-1 p-1 md:p-3 rounded-lg md:rounded-2xl w-fit ${product.stock > 0 ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-500'}`}>
                              {product.stock > 0 ? (
                                <>
                                  <BadgeCheck className="h-3 w-3 md:h-4 md:w-4" />
                                  <span className="text-[8px] md:text-xs font-black uppercase">Stock</span>
                                </>
                              ) : (
                                <>
                                  <Package className="h-3 w-3 md:h-4 md:w-4" />
                                  <span className="text-[8px] md:text-xs font-black uppercase">Out</span>
                                </>
                              )}
                           </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-2 md:pt-6">
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 || isLoading}
                          className="w-full h-8 md:h-14 rounded-lg md:rounded-2xl bg-[#1E3A8A] hover:bg-[#F97316] text-white font-black text-[9px] md:text-sm uppercase tracking-widest shadow-lg transition-all duration-300 group/btn"
                        >
                          <ShoppingBag className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {compareItems.length < 4 && (
                   <div className="w-44 md:w-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.25rem] md:rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-8 text-center group/add transition-all">
                      <div className="p-3 md:p-6 bg-white dark:bg-slate-900 rounded-xl md:rounded-3xl shadow-sm mb-3 md:mb-6">
                        <ShoppingBag className="h-6 w-6 md:h-12 md:w-12 text-slate-300 dark:text-slate-700" />
                      </div>
                      <p className="text-[10px] md:text-base text-slate-400 dark:text-slate-500 font-bold">Add more</p>
                      <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="mt-4 md:mt-8 text-[#1E3A8A] dark:text-blue-400 font-black uppercase text-[8px] md:text-xs tracking-widest"
                      >
                        Browse
                      </Button>
                   </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareModal;
