import { useState, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { getReturnRequests, processReturn } from '../../services/order'
import { toast } from '../ui/use-toast'
import PremiumLoader from '../ui/PremiumLoader'

const AdminReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const data = await getReturnRequests()
      setReturns(Array.isArray(data) ? data : data?.orders || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load return requests',
        variant: 'destructive',
      })
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  const handleAction = async (action) => {
    if (!actionModal) return
    setProcessing(true)
    try {
      await processReturn(actionModal.orderId, action, comment.trim() || undefined)
      toast({ title: 'Success', description: `Return ${action}d successfully` })
      setActionModal(null)
      setComment('')
      fetchReturns()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || `Failed to ${action} return`,
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const styles = {
      RETURN_REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
      REPLACEMENT_REQUESTED: 'bg-blue-50 text-blue-700 border-blue-200',
    }
    const label = status?.replace(/_/g, ' ') || status
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        {label}
      </span>
    )
  }

  const getItemsSummary = (items) => {
    if (!items?.length) return '—'
    return items.map((i) => `${i.nameSnapshot || 'Item'} x${i.quantity}`).join(', ')
  }

  return (
    <div className="space-y-8">
      <Dialog open={!!actionModal} onOpenChange={(open) => { if (!open) { setActionModal(null); setComment('') } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-syne text-[#1E3A8A] text-xl">
              {actionModal?.orderStatus === 'REPLACEMENT_REQUESTED' ? 'Process Replacement' : 'Process Return'} — {actionModal?.orderId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Comment (optional)</label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note for the customer..."
                className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAction('reject')}
              disabled={processing}
              className="hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Reject
            </Button>
            <Button
              type="button"
              onClick={() => handleAction('approve')}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Returns & Replacements</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage return and replacement requests</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-5 pl-6 font-semibold text-slate-600">Order ID</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Customer</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600 hidden md:table-cell">Items</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Reason</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600 hidden sm:table-cell">Request Date</TableHead>
              <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex justify-center">
                    <PremiumLoader size="small" text="Loading return requests..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                  No return or replacement requests
                </TableCell>
              </TableRow>
            ) : (
              returns.map((order) => (
                <TableRow key={order._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                  <TableCell className="py-4 pl-6 font-medium text-slate-900">
                    {order.orderId}
                  </TableCell>
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-slate-900">{order.userId?.name || '—'}</p>
                      {order.userId?.email && (
                        <p className="text-xs text-slate-500">{order.userId.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 hidden md:table-cell max-w-[220px]">
                    <span className="line-clamp-2">{getItemsSummary(order.items)}</span>
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 max-w-[180px]">
                    <span className="line-clamp-2">{order.returnReason || '—'}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.orderStatus)}
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 hidden sm:table-cell">
                    {formatDate(order.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-600 border-slate-200 text-slate-500 transition-all gap-1.5"
                        onClick={() => setActionModal(order)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Approve</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 border-slate-200 text-slate-500 transition-all gap-1.5"
                        onClick={() => setActionModal(order)}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Reject</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default AdminReturns
