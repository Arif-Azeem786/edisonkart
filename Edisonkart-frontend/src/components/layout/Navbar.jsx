import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useScroll, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Shield,
  ChevronRight,
  Heart,
  Search,
  Tag,
  Store,
  Camera,
  Bell,
} from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import CartDrawer from '../cart/CartDrawer'
import { cn } from '../../lib/utils'
import { ThemeToggle } from '../ui/ThemeToggle'
import { getSearchSuggestions, getProductImage, searchByImage } from '../../services/product'
import { getUnreadCount, markAllAsRead } from '../../services/notification'
import { Loader2, ImageIcon } from 'lucide-react'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/products' },
  { name: 'Import', path: '/import-product' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
]

const Navbar = ({ cartDrawerOpen, setCartDrawerOpen }) => {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [imageSearching, setImageSearching] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImageSearching(true)
    setImageSearchResults(null)
    try {
      const result = await searchByImage(file)
      const products = result?.data?.products || result?.products || []
      const terms = result?.data?.searchTerms || result?.searchTerms || ''
      if (products.length > 0) {
        navigate(`/products?search=${encodeURIComponent(terms)}`)
      } else {
        setImageSearchResults({ terms, products: [] })
        setTimeout(() => setImageSearchResults(null), 4000)
      }
    } catch (err) {
      console.error('Image search error:', err)
      setImageSearchResults({ terms: '', products: [], error: 'Could not search by image. Please try again.' })
      setTimeout(() => setImageSearchResults(null), 4000)
    } finally {
      setImageSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/products?search=${encodeURIComponent(q)}`)
      setSearchQuery('')
      searchInputRef.current?.blur()
    }
  }
 
   useEffect(() => {
     const fetchSuggestions = async () => {
       if (searchQuery.trim().length < 1) {
         setSuggestions([])
         setShowSuggestions(false)
         return
       }
 
       setIsSearching(true)
       setShowSuggestions(true)
       try {
         const data = await getSearchSuggestions(searchQuery)
         setSuggestions(data.data || [])
       } catch (error) {
         console.error('Error fetching suggestions:', error)
         setSuggestions([])
       } finally {
         setIsSearching(false)
       }
     }
 
     const debounceTimer = setTimeout(() => {
       fetchSuggestions()
     }, 300)
 
     return () => clearTimeout(debounceTimer)
   }, [searchQuery])
 
   // Close suggestions on click outside
   useEffect(() => {
     function handleClickOutside(event) {
       if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
         setShowSuggestions(false)
       }
     }
     document.addEventListener("mousedown", handleClickOutside)
     return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])


  const { scrollY } = useScroll()

  const { isAuthenticated, user, logout } = useAuthStore()
  const itemCount = useCartStore((state) => state.itemCount)
  const navigate = useNavigate()
  const location = useLocation()

  // Determine if navbar should look scrolled (solid bg, dark text)
  // Force scrolled look on pages that don't have a hero section
  const isScrolled = hasScrolled || !['/', '/about', '/contact', '/faq'].includes(location.pathname)

  // Navbar hide/show on scroll
  useEffect(() => {
    return scrollY.on("change", (latest) => {
      const previous = scrollY.getPrevious()
      setHasScrolled(latest > 50)
      if (latest > previous && latest > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    })
  }, [scrollY])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchUnread = async () => {
      try {
        const data = await getUnreadCount()
        setUnreadNotifs(data?.data?.unreadCount ?? data?.unreadCount ?? 0)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Click outside listener for user menu
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [userMenuRef])



  const navVariants = {
    visible: { y: 0 },
    hidden: { y: '-100%' },
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSearch}
        className="hidden"
      />

      {/* Image search notification */}
      <AnimatePresence>
        {imageSearching && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 border border-slate-200 dark:border-slate-700"
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Analyzing image...</span>
          </motion.div>
        )}
        {imageSearchResults && !imageSearching && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl px-6 py-4 border border-slate-200 dark:border-slate-700"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {imageSearchResults.error || (imageSearchResults.products.length === 0
                ? `No products found for "${imageSearchResults.terms}"`
                : `Found ${imageSearchResults.products.length} results`)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        variants={navVariants}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(30,58,138,0.08)] border-b border-slate-200/60 dark:border-slate-800/60"
        )}
      >
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1E3A8A] via-[#F97316] to-[#1E3A8A]" />

        {/* ── Top row: Logo + Desktop Search + Icons ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-[68px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group flex-shrink-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <img src="/logo.png" alt="EdisonKart" className="h-9 sm:h-12 w-auto object-contain" />
              </motion.div>
            </Link>

            {/* ── Desktop Search Bar (Flipkart style) ── */}
            <form
               onSubmit={handleSearch}
               className="hidden md:flex flex-1 max-w-2xl mx-auto relative"
               ref={searchContainerRef}
             >
               <div className="flex w-full rounded-full overflow-hidden border-2 border-[#1E3A8A]/30 hover:border-[#1E3A8A]/60 focus-within:border-[#F97316] transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm relative z-10">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands and more…"
                  className="flex-1 px-5 py-2.5 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={imageSearching}
                  className="flex items-center px-3 border-l border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#1E3A8A] transition-colors disabled:opacity-50"
                  title="Search by image"
                >
                  {imageSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors flex-shrink-0"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:block">Search</span>
                 </button>
               </div>
 
               {/* Suggestions Dropdown */}
               <AnimatePresence>
                 {showSuggestions && (searchQuery.trim().length > 0) && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-20"
                   >
                     {isSearching ? (
                       <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                         <Loader2 className="h-6 w-6 animate-spin text-[#1E3A8A]" />
                         <p className="text-xs font-medium">Searching for products...</p>
                       </div>
                     ) : suggestions.length > 0 ? (
                       <div className="max-h-[400px] overflow-y-auto py-2">
                         <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50 mb-1">
                           Product Suggestions
                         </div>
                         {suggestions.map((item) => (
                           <button
                             key={item._id}
                             type="button"
                             onClick={() => {
                               navigate(`/products/${item.slug || item._id}`);
                               setShowSuggestions(false);
                               setSearchQuery('');
                             }}
                             className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group text-left"
                           >
                             <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0">
                               {item.image ? (
                                 <img
                                   src={getProductImage(item.image._id)}
                                   alt={item.name}
                                   className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center">
                                   <Package className="h-4 w-4 text-slate-300" />
                                 </div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#F97316] transition-colors">
                                 {item.name}
                               </p>
                               <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                 <Tag className="h-2.5 w-2.5" />
                                 {item.brand || 'EdisonKart'}
                               </p>
                             </div>
                             <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="p-8 text-center">
                         <p className="text-sm text-slate-500">No products found for "{searchQuery}"</p>
                         <p className="text-[11px] text-slate-400 mt-1">Try a different keyword</p>
                       </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
             </form>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-sm bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
              {navLinks.map((item) => {
                if (item.hideFor?.includes(user?.role)) return null;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <Link key={item.name} to={item.path} className="relative px-4 py-2 group">
                    <span className={cn(
                      "relative z-10 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-[#F97316] font-bold"
                        : "text-[#1E3A8A] dark:text-blue-400 group-hover:text-[#F97316]"
                    )}>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-1 left-3 right-3 h-0.5 bg-[#F97316] rounded-full mx-auto"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Wishlist Quick Access */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/wishlist')}
                className="relative p-2.5 rounded-xl transition-colors text-[#1E3A8A] dark:text-blue-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hidden sm:flex"
              >
                <Heart className="h-[18px] w-[18px]" />
              </motion.button>

              {/* Theme Toggle — always visible, including mobile */}
              <ThemeToggle />

              {isAuthenticated && (
                <Link to="/notifications" className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartDrawerOpen(true)}
                className="relative p-2.5 rounded-xl transition-colors text-[#1E3A8A] dark:text-blue-400 hover:text-[#F97316] hover:bg-[#1E3A8A]/5 dark:hover:bg-blue-400/10"
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md shadow-[#F97316]/30"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* User Menu / Sign In */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2.5 rounded-xl transition-colors text-[#1E3A8A] dark:text-blue-400 hover:text-[#F97316] hover:bg-[#1E3A8A]/5 dark:hover:bg-blue-400/10"
                  >
                    <User className="h-[18px] w-[18px]" />
                  </motion.button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
                      >
                        {/* User Info Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 via-orange-50 to-transparent dark:from-blue-950/30 dark:via-orange-950/30 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#F97316] flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                          >
                            <User className="h-4 w-4 text-slate-500 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400" />
                            My Profile
                            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                          >
                            <Package className="h-4 w-4 text-slate-500 group-hover:text-[#F97316]" />
                            My Orders
                            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                          </Link>
                          <Link
                            to="/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                          >
                            <Heart className="h-4 w-4 text-slate-500 group-hover:text-red-500" />
                            My Wishlist
                            <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                          </Link>
                          {user?.role === 'ADMIN' && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                            >
                              <Shield className="h-4 w-4 text-slate-500 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400" />
                              Admin Panel
                              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                            </Link>
                          )}
                          {user?.role === 'EMPLOYEE' && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                            >
                              <Shield className="h-4 w-4 text-slate-500 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400" />
                              Employee Panel
                              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                            </Link>
                          )}
                          {user?.role === 'DELIVERY' && (
                            <Link
                              to="/delivery"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                            >
                              <Package className="h-4 w-4 text-slate-500 group-hover:text-[#F97316]" />
                              Delivery Panel
                              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                            </Link>
                          )}
                          {user?.role === 'VENDOR' && (
                            <Link
                              to="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group text-slate-700 dark:text-slate-300"
                            >
                              <Store className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                              Vendor Panel
                              <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                            </Link>
                          )}
                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="ml-1">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="sm" className="rounded-xl px-5 font-semibold border-0 shadow-md bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[#F97316]/20">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="md:hidden p-2.5 rounded-xl transition-colors text-[#1E3A8A] dark:text-blue-400 hover:text-[#1E3A8A]/80 hover:bg-[#1E3A8A]/5 dark:hover:bg-blue-400/10"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
        {/* ── Mobile Search Row (below top bar, hidden on md+) ── */}
        <div className="md:hidden border-t border-slate-200/60 dark:border-slate-800/60 px-3 py-2 bg-white/95 dark:bg-slate-950/95 relative">
          <form onSubmit={handleSearch} className="flex rounded-full overflow-hidden border-2 border-[#1E3A8A]/25 focus-within:border-[#F97316] bg-white dark:bg-slate-900 transition-all duration-200 relative z-10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands…"
              className="flex-1 px-4 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={handleCameraClick} disabled={imageSearching} className="px-2 text-slate-400 hover:text-[#1E3A8A] border-l border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50" title="Search by image">
              {imageSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <button type="submit" className="px-4 bg-[#F97316] hover:bg-[#EA580C] text-white flex-shrink-0 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Mobile Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (searchQuery.trim().length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-20"
              >
                {isSearching ? (
                  <div className="p-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" />
                    <p className="text-[10px] font-medium">Searching...</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto py-1">
                    {suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          navigate(`/products/${item.slug || item._id}`);
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left border-b border-slate-50 dark:border-slate-900/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0">
                          {item.image ? (
                            <img
                              src={getProductImage(item.image._id)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-3 w-3 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {item.name}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs text-slate-500">No results found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>



      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-950 z-[60] shadow-2xl flex flex-col"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="EdisonKart" className="h-10 w-auto" />
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-0.5">
                  {navLinks.map((item, i) => {
                    if (item.hideFor?.includes(user?.role)) return null;
                    const isActive = location.pathname === item.path
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            isActive
                              ? "bg-gradient-to-r from-[#F97316]/10 to-transparent text-[#F97316]"
                              : "text-foreground/70 hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {item.name}
                          <ChevronRight className={cn(
                            "h-4 w-4",
                            isActive ? "text-[#F97316] opacity-60" : "opacity-30"
                          )} />
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Mobile Quick Actions */}
                {isAuthenticated && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                    >
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      Wishlist
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Admin Panel
                      </Link>
                    )}
                    {user?.role === 'EMPLOYEE' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Employee Panel
                      </Link>
                    )}
                    {user?.role === 'DELIVERY' && (
                      <Link
                        to="/delivery"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Delivery Panel
                      </Link>
                    )}
                    {user?.role === 'VENDOR' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
                      >
                        <Store className="h-4 w-4 text-muted-foreground" />
                        Vendor Panel
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                {isAuthenticated ? (
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white border-0 font-semibold">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  )
}

export default Navbar