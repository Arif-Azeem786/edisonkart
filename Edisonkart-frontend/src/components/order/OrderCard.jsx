import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Button } from '../ui/button'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { NO_IMAGE_PLACEHOLDER } from '../ui/imageUtils'
import OrderTimeline from './OrderTimeline'

const OrderCard = ({ order, index, statusColors, statusIcons }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const StatusIcon = statusIcons[order.orderStatus]

  // Get first 4 items for preview
  const previewItems = order.items.slice(0, 4)
  const remainingItemsCount = order.items.length - 4

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
    >
      {/* Header - Always visible */}
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          {/* Left Side: Status & ID */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${statusColors[order.orderStatus]} bg-opacity-20`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColors[order.orderStatus]}`}>
                  {order.orderStatus.replace('_', ' ')}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <p className="font-mono text-sm font-medium text-foreground">
                ORDER #{order.orderId}
              </p>
            </div>
          </div>

          {/* Middle: Product Previews (Hidden on small mobile) */}
          <div className="hidden sm:flex items-center gap-2 -space-x-2 pl-4">
            {previewItems.map((item, i) => (
              <div key={i} className="relative w-10 h-10 rounded-full border-2 border-background overflow-hidden ring-1 ring-border shadow-sm">
                <img
                  src={item.productId?.imageIds?.[0]
                    ? `${import.meta.env.VITE_API_URL}/products/image/${item.productId.imageIds[0]}`
                    : NO_IMAGE_PLACEHOLDER
                  }
                  alt={item.nameSnapshot}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {remainingItemsCount > 0 && (
              <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-1 ring-border">
                +{remainingItemsCount}
              </div>
            )}
          </div>

          {/* Right Side: Total & Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-6 min-w-[140px]">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Amount</p>
              <p className="text-lg font-bold text-foreground">₹{order.totalAmount.toLocaleString()}</p>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-muted-foreground group-hover:text-primary transition-colors"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-muted/30 border-t border-border/50"
          >
            <div className="p-6 space-y-8">
              {/* Items Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Items in Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-background rounded-xl border border-border/50 hover:border-primary/20 transition-colors shadow-sm">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                        <img
                          src={item.productId?.imageIds?.[0]
                            ? `${import.meta.env.VITE_API_URL}/products/image/${item.productId.imageIds[0]}`
                            : NO_IMAGE_PLACEHOLDER
                          }
                          alt={item.nameSnapshot}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h5 className="font-medium text-sm text-foreground truncate" title={item.nameSnapshot}>{item.nameSnapshot}</h5>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                          </p>
                          <p className="font-semibold text-sm">₹{(item.priceSnapshot * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="border-t border-border/50 pt-6">
                 <OrderTimeline history={order.statusHistory} currentStatus={order.orderStatus} />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Shipping Details
                  </h4>
                  <div className="bg-background p-4 rounded-xl border border-border/50 text-sm space-y-1">
                    <p className="font-semibold text-foreground">{order.addressSnapshot.name}</p>
                    <div className="text-muted-foreground">
                      <p>{order.addressSnapshot.addressLine1}</p>
                      {order.addressSnapshot.addressLine2 && <p>{order.addressSnapshot.addressLine2}</p>}
                      <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.pincode}</p>
                      <p className="mt-2 text-foreground font-medium">{order.addressSnapshot.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" /> Payment info
                  </h4>
                  <div className="bg-background p-4 rounded-xl border border-border/50 text-sm flex flex-col h-full justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${statusColors[order.orderStatus]}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium text-foreground">Online (Cashfree)</span>
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-border/50 flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total Paid</span>
                      <span className="font-bold text-lg text-primary">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Link to={`/products/${order.items[0]?.productId?.slug}`}>
                  <Button variant="outline" className="rounded-xl border-border/60 hover:bg-muted">
                    Buy Again
                  </Button>
                </Link>
                <Link to={`/orders/${order.orderId}`}>
                  <Button className="rounded-xl pl-5 pr-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 group/btn">
                    Track Order
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default OrderCard