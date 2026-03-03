import { motion } from 'framer-motion'
import {
    Package,
    CheckCircle,
    Truck,
    MapPin,
    XCircle,
    Clock,
    Check
} from 'lucide-react'
import { format } from 'date-fns'

const statusConfig = {
    PLACED: {
        label: 'Order Placed',
        description: 'Your order has been placed successfully.',
        icon: Package,
        color: 'text-blue-600 bg-blue-100 border-blue-200'
    },
    CONFIRMED: {
        label: 'Order Confirmed',
        description: 'Seller has processed your order.',
        icon: CheckCircle,
        color: 'text-orange-600 bg-orange-100 border-orange-200'
    },
    SHIPPED: {
        label: 'Shipped',
        description: 'Your item has been shipped.',
        icon: Truck,
        color: 'text-amber-600 bg-amber-100 border-amber-200'
    },
    OUT_FOR_DELIVERY: {
        label: 'Out For Delivery',
        description: 'Your item is out for delivery.',
        icon: Truck,
        color: 'text-indigo-600 bg-indigo-100 border-indigo-200'
    },
    DELIVERED: {
        label: 'Delivered',
        description: 'Your item has been delivered.',
        icon: CheckCircle,
        color: 'text-green-600 bg-green-100 border-green-200'
    },
    CANCELLED: {
        label: 'Cancelled',
        description: 'Your order has been cancelled.',
        icon: XCircle,
        color: 'text-red-600 bg-red-100 border-red-200'
    }
}

const OrderTimeline = ({ history = [], currentStatus }) => {
    // Sort history by timestamp (newest first for display usually, but timeline flows down so oldest first might be better? 
    // Actually vertical timeline usually has newest at top. Let's stick to newest at top as implemented before)
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    // If no history (legacy orders), show current status
    const displayHistory = sortedHistory.length > 0 
        ? sortedHistory 
        : [{ status: currentStatus, timestamp: new Date(), comment: '' }]

    return (
        <div className="py-2">
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-20px)] before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-muted">
                {displayHistory.map((item, index) => {
                    const config = statusConfig[item.status] || statusConfig.PLACED
                    const isLatest = index === 0
                    
                    return (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="relative"
                        >
                            {/* Dot/Icon */}
                            <div className={`absolute -left-[43px] top-0 h-8 w-8 rounded-full flex items-center justify-center border-2 shadow-sm z-10 ${config.color} bg-background`}>
                                <config.icon className="h-4 w-4" />
                            </div>
                            
                            <div className={`p-4 rounded-xl border transition-all duration-300 ${isLatest ? 'bg-card border-primary/20 shadow-md transform scale-[1.01]' : 'bg-muted/30 border-transparent'}`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                                    <h4 className={`font-bold text-base ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {config.label}
                                    </h4>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground">
                                        {item.timestamp ? format(new Date(item.timestamp), 'MMM dd, h:mm a') : ''}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.comment || config.description}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

export default OrderTimeline
