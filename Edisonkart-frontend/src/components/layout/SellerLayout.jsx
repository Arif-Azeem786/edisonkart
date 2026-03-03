import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Package,
  Calendar,
  Store,
  Tag
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import ScrollToTop from '../ui/ScrollToTop'

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    setCurrentDate(new Date().toLocaleDateString('en-US', dateOptions))

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/orders', icon: ShoppingBag, label: 'Manage Orders' },
    { path: '/seller/products', icon: Package, label: 'My Products' },
  ]

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop()
    if (!path || path === 'dashboard') return 'Seller Dashboard'
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <ScrollToTop />
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-screen w-[280px] bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 z-50 flex flex-col lg:hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-800 via-indigo-600 to-indigo-800" />
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3 group w-full">
            <img
              src="/logo.png"
              alt="EdisonKart"
              className="h-10 w-10 object-contain rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-syne font-bold text-xl text-indigo-900 tracking-tight">
                Seller Hub
              </span>
              <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest -mt-0.5">
                EdisonKart Partner
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`} />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-indigo-900">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate font-medium">Verified Seller</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white bg-transparent rounded-lg transition-all text-slate-400 hover:text-red-500 hover:shadow-sm border border-transparent hover:border-slate-200"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.aside>

      <aside
        className={`hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 z-50 flex-col transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-[80px] overflow-hidden'
          }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-800 via-indigo-600 to-indigo-800" />
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3 group w-full">
            <img
              src="/logo.png"
              alt="EdisonKart"
              className="h-10 w-10 object-contain rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0"
            />
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-syne font-bold text-xl text-indigo-900 tracking-tight">
                  Seller Hub
                </span>
                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest -mt-0.5" title="Verified Seller">
                  EdisonKart Partner
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                  }`} />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-indigo-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate font-medium">Verified Seller</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 hover:bg-white bg-transparent rounded-lg transition-all text-slate-400 hover:text-red-500 hover:shadow-sm border border-transparent hover:border-slate-200 ${!sidebarOpen && 'hidden'}`}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-4 lg:px-8 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition hidden lg:block text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition lg:hidden text-slate-600"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-emerald-500 rounded-full hidden md:block"></div>
              <h2 className="text-lg lg:text-xl font-bold text-indigo-900 font-syne capitalize tracking-tight text-nowrap">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium font-syne">{currentDate}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SellerLayout
