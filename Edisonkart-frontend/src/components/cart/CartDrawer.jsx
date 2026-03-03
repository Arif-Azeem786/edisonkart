import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import useCartStore from '../../store/cartStore'
import { getProductImageUrl, NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import { useToast } from '../ui/use-toast'

const CartDrawer = ({ open, onClose }) => {
  const { items, total, itemCount, updateItem, removeItem, isLoading } = useCartStore()
  const { toast } = useToast()

  const handleUpdateItem = async (itemId, quantity) => {
    try {
      await updateItem(itemId, quantity)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      })
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId)
      toast({ title: "Removed", description: "Item removed from cart" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      })
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const drawerVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: { type: 'spring', damping: 30, stiffness: 300 }
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1E3A8A]/10 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
                  {itemCount > 0 && (
                    <p className="text-xs text-slate-500">
                      {itemCount} item{itemCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </motion.button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                    <ShoppingBag className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-slate-900">Your cart is empty</h3>
                  <p className="text-sm text-slate-500 text-center mb-6">
                    Browse our collection and find something you love!
                  </p>
                  <Button
                    onClick={onClose}
                    className="rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] gap-2 shadow-lg shadow-[#1E3A8A]/20 px-6"
                    asChild
                  >
                    <Link to="/products">
                      <Sparkles className="h-4 w-4" />
                      Start Shopping
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {items.map((item) => {
                      const product = item.productId
                      if (!product || typeof product === 'string') return null

                      const imageUrl = product.imageIds?.[0]
                        ? getProductImageUrl(product.imageIds[0])
                        : NO_IMAGE_PLACEHOLDER

                      const unitPrice = item.priceSnapshot || product.discountPrice || product.price || 0
                      const lineTotal = unitPrice * item.quantity

                      return (
                        <motion.div
                          key={item._id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="flex gap-4 p-3.5 bg-gradient-to-r from-slate-50/80 to-white rounded-2xl border border-slate-100 group hover:shadow-md hover:border-slate-200 transition-all duration-300"
                        >
                          {/* Image */}
                          <Link to={`/product/${product._id}`} onClick={onClose}>
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm ring-1 ring-slate-100">
                              <img
                                src={imageUrl}
                                alt={product.name || 'Product'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <Link to={`/product/${product._id}`} onClick={onClose} className="min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 truncate hover:text-[#1E3A8A] transition-colors">
                                  {product.name || 'Product'}
                                </h4>
                              </Link>
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveItem(item._id)}
                                disabled={isLoading}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </motion.button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <button
                                  onClick={() => handleUpdateItem(item._id, Math.max(1, item.quantity - 1))}
                                  disabled={isLoading || item.quantity <= 1}
                                  className="p-2 hover:bg-slate-50 transition-colors disabled:opacity-30"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-3 text-sm font-semibold min-w-[28px] text-center text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateItem(item._id, item.quantity + 1)}
                                  disabled={isLoading}
                                  className="p-2 hover:bg-slate-50 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <p className="text-sm font-bold text-[#1E3A8A]">
                                ₹{Math.round(lineTotal).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-100 bg-white">
                {/* Free shipping nudge */}
                {total < 999 && (
                  <div className="px-5 pt-4">
                    <div className="bg-gradient-to-r from-[#F97316]/10 to-[#FB923C]/10 rounded-xl p-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#F97316] flex-shrink-0" />
                      <p className="text-xs text-[#F97316] font-medium">
                        Add ₹{Math.round(999 - total).toLocaleString()} more for <span className="font-bold">FREE shipping!</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-xl font-bold text-slate-900">
                      ₹{Math.round(total).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Shipping and taxes calculated at checkout
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] h-12 text-base font-semibold shadow-lg shadow-[#1E3A8A]/20 gap-2"
                        asChild
                      >
                        <Link to="/checkout" onClick={onClose}>
                          Checkout
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                    <Button
                      variant="ghost"
                      className="w-full rounded-xl text-slate-500 hover:text-[#1E3A8A] font-medium"
                      asChild
                    >
                      <Link to="/cart" onClick={onClose}>
                        View Full Cart
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartDrawer