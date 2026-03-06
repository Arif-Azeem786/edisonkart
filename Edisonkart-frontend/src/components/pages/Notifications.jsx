import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Package,
  Tag,
  CreditCard,
  Gift,
} from 'lucide-react'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../services/notification'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import PremiumLoader from '../ui/PremiumLoader'

const ICON_MAP = {
  order_placed: Package,
  order_confirmed: Package,
  order_shipped: Package,
  order_delivered: Package,
  order_cancelled: Package,
  return_approved: Package,
  return_rejected: Package,
  price_drop: Tag,
  flash_sale: Tag,
  refund_processed: CreditCard,
  promo: Gift,
  welcome: Gift,
  general: Bell,
}

function getIconForType(type) {
  return ICON_MAP[type] || Bell
}

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await getNotifications({ page, limit: 20 })
      setNotifications(res.notifications || [])
      setTotalPages(res.totalPages ?? 1)
      setTotal(res.total ?? 0)
    } catch (err) {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await markAllAsRead()
      await fetchNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await markAsRead(n._id)
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
        )
      } catch (_) {}
    }
    if (n.link) {
      navigate(n.link)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      setTotal((t) => Math.max(0, t - 1))
    } finally {
      setDeletingId(null)
    }
  }

  const hasUnread = notifications.some((n) => !n.read)

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Notifications
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
                Stay updated with your orders and offers
              </p>
            </div>
            {notifications.length > 0 && hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="rounded-xl border-slate-200 hover:bg-slate-50 gap-2"
              >
                {markingAll ? (
                  <span className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all as read
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <PremiumLoader size="default" text="Loading notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 sm:p-16 text-center"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm">
              When you get order updates, price drops, or promotions, they'll
              appear here.
            </p>
            <Link to="/products">
              <Button className="bg-[#1E3A8A] hover:bg-[#F97316] text-white rounded-xl px-8 py-3 font-semibold transition-all duration-300 shadow-lg shadow-[#1E3A8A]/15">
                Browse Products
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, index) => {
                const Icon = getIconForType(n.type)
                const isUnread = !n.read
                return (
                  <motion.div
                    key={n._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(n)}
                    className={`bg-white rounded-2xl border shadow-sm transition-all duration-300 cursor-pointer group overflow-hidden ${
                      isUnread
                        ? 'border-slate-200 shadow-md bg-slate-50/50'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-4">
                      <div
                        className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                          isUnread ? 'bg-[#1E3A8A]/10' : 'bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isUnread ? 'text-[#1E3A8A]' : 'text-slate-500'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className={`font-semibold ${
                                isUnread ? 'text-slate-900' : 'text-slate-600'
                              }`}
                            >
                              {n.title}
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {n.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {timeAgo(n.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isUnread ? (
                              <span
                                className="w-2 h-2 rounded-full bg-[#1E3A8A]"
                                title="Unread"
                              />
                            ) : (
                              <Check className="h-4 w-4 text-emerald-500" title="Read" />
                            )}
                            <button
                              onClick={(e) => handleDelete(e, n._id)}
                              disabled={deletingId === n._id}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              aria-label="Delete notification"
                            >
                              {deletingId === n._id ? (
                                <span className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-transparent rounded-full block" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
