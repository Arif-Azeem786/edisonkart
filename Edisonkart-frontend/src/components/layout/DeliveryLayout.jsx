import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  ClipboardList,
  MapPin,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
  Home,
  Truck,
  Calendar,
  ExternalLink
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import ScrollToTop from '../ui/ScrollToTop'
import { getDeliveryStats } from '../../services/delivery'

const DeliveryLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [stats, setStats] = useState(null)
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDeliveryStats()
        setStats(data)
      } catch (err) {
        // console.error('Failed to fetch delivery stats', err)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { path: '/delivery', icon: Home, label: 'Dashboard' },
    { path: '/delivery/orders', icon: ClipboardList, label: 'Assigned Orders' },
    // { path: '/delivery/route', icon: MapPin, label: 'Delivery Route' },
    { path: '/delivery/completed', icon: Package, label: 'Completed' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/delivery') return 'Dashboard'
    if (path === '/delivery/orders') return 'Assigned Orders'
    if (path === '/delivery/route') return 'Delivery Route'
    if (path === '/delivery/completed') return 'Completed Deliveries'
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <ScrollToTop />

      {/* Mobile Menu Overlay */}
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

      {/* Sidebar — Mobile (slide-in overlay) */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-screen w-[280px] bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 z-50 flex flex-col lg:hidden"
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1E3A8A] via-[#F97316] to-[#1E3A8A]" />

        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3 group w-full">
            <img
              src="/logo.png"
              alt="EdisonKart"
              className="h-10 w-10 object-contain rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-syne font-bold text-xl text-[#1E3A8A] tracking-tight">
                EdisonKart
              </span>
              <span className="text-[10px] font-medium text-[#F97316] uppercase tracking-widest -mt-0.5">
                Delivery Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E3A8A]'
                  }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#F97316]'
                  }`} />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats in Sidebar */}
        {stats && (
          <div className="px-4 pb-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Today's Stats</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Delivered</span>
                  <span className="text-sm font-bold text-green-600">{stats.deliveredToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">In Progress</span>
                  <span className="text-sm font-bold text-[#F97316]">{stats.outForDelivery || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Pending</span>
                  <span className="text-sm font-bold text-[#1E3A8A]">{stats.pendingCount || 0}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-200 h-1.5 rounded-full">
                  <div
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#F97316] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalAssigned > 0 ? Math.round((stats.totalDelivered / stats.totalAssigned) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {stats.totalDelivered || 0} / {stats.totalAssigned || 0} all-time
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#F97316] flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-[#1E3A8A]">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate font-medium">Delivery Partner</p>
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

      {/* Sidebar — Desktop (sticky, collapsible) */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 z-50 flex-col transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-[80px] overflow-hidden'
          }`}
      >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1E3A8A] via-[#F97316] to-[#1E3A8A]" />

        {/* Logo Area */}
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
                <span className="font-syne font-bold text-xl text-[#1E3A8A] tracking-tight">
                  EdisonKart
                </span>
                <span className="text-[10px] font-medium text-[#F97316] uppercase tracking-widest -mt-0.5">
                  Delivery Panel
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? 'bg-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E3A8A]'
                  }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#F97316]'
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
                {!sidebarOpen && isActive && (
                  <div className="absolute left-14 bg-[#1E3A8A] text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md border border-[#1E3A8A]/20">
                    {item.label}
                  </div>
                )}
                {!sidebarOpen && !isActive && (
                  <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats in Sidebar */}
        {sidebarOpen && stats && (
          <div className="px-4 pb-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Today's Stats</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Delivered</span>
                  <span className="text-sm font-bold text-green-600">{stats.deliveredToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">In Progress</span>
                  <span className="text-sm font-bold text-[#F97316]">{stats.outForDelivery || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Pending</span>
                  <span className="text-sm font-bold text-[#1E3A8A]">{stats.pendingCount || 0}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-200 h-1.5 rounded-full">
                  <div
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#F97316] h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.totalAssigned > 0 ? Math.round((stats.totalDelivered / stats.totalAssigned) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">
                  {stats.totalDelivered || 0} / {stats.totalAssigned || 0} all-time
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#F97316] flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-[#1E3A8A]">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate font-medium">Delivery Partner</p>
              </div>
            )}
            {sidebarOpen ? (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white bg-transparent rounded-lg transition-all text-slate-400 hover:text-red-500 hover:shadow-sm border border-transparent hover:border-slate-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="absolute left-20 p-2 bg-white rounded-lg text-red-500 shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Header */}
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

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-[#F97316] rounded-full hidden md:block"></div>
              <h2 className="text-lg lg:text-xl font-bold text-[#1E3A8A] font-syne capitalize tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            {/* Live Stats Badge */}
            {stats && (
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-slate-500">Today:</span>
                  <span className="font-bold text-green-600">{stats.deliveredToday || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Active:</span>
                  <span className="ml-1 font-bold text-[#F97316]">{stats.outForDelivery || 0}</span>
                </div>
              </div>
            )}

            {/* Date Display */}
            <div className="hidden md:flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
              <Calendar className="h-4 w-4 text-[#F97316]" />
              <span className="text-sm font-medium font-syne">{currentDate}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DeliveryLayout