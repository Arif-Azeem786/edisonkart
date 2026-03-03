import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

const tabs = [
    { icon: Home,         label: 'Home',    path: '/'          },
    { icon: Search,       label: 'Shop',    path: '/products'  },
    { icon: ShoppingCart, label: 'Cart',    path: '/cart'      },
    { icon: Heart,        label: 'Wishlist',path: '/wishlist'  },
    { icon: User,         label: 'Account', path: '/profile'   },
]

export default function MobileBottomNav({ onCartOpen }) {
    const location = useLocation()
    const navigate  = useNavigate()
    const itemCount = useCartStore((s) => s.itemCount)
    const { isAuthenticated } = useAuthStore()

    const handleTab = (tab) => {
        if (tab.path === '/cart') {
            // Open the cart drawer instead of navigating
            if (onCartOpen) {
                onCartOpen()
                return
            }
        }
        if ((tab.path === '/wishlist' || tab.path === '/profile') && !isAuthenticated) {
            navigate('/login')
            return
        }
        navigate(tab.path)
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 safe-area-pb">
            <div className="flex items-stretch justify-around px-1 pt-1 pb-safe">
                {tabs.map((tab) => {
                    const isActive = tab.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(tab.path)

                    return (
                        <button
                            key={tab.path}
                            onClick={() => handleTab(tab)}
                            className={cn(
                                'relative flex flex-col items-center justify-center flex-1 py-2 gap-0.5 rounded-xl transition-colors min-w-0',
                                isActive
                                    ? 'text-[#F97316]'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            {/* Active bg pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-pill"
                                    className="absolute inset-x-1 inset-y-0 bg-orange-50 dark:bg-orange-950/30 rounded-xl -z-10"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Icon with cart badge */}
                            <div className="relative">
                                <tab.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                                {tab.path === '/cart' && itemCount > 0 && (
                                    <AnimatePresence>
                                        <motion.span
                                            key="cart-badge"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#F97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                                        >
                                            {itemCount > 9 ? '9+' : itemCount}
                                        </motion.span>
                                    </AnimatePresence>
                                )}
                            </div>

                            <span className={cn('text-[10px] font-medium leading-none', isActive && 'font-bold')}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
