import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit, X, Loader2, CheckCircle, XCircle } from 'lucide-react'
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
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/coupon'
import { toast } from '../ui/use-toast'
import PremiumLoader from '../ui/PremiumLoader'

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (₹)' },
]

const initialFormState = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '1',
  expiresAt: '',
  isActive: true,
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const data = await getCoupons()
      setCoupons(Array.isArray(data) ? data : data?.coupons || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load coupons',
        variant: 'destructive',
      })
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCoupon(null)
    setFormData(initialFormState)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
        expiresAt: formData.expiresAt || null,
        isActive: formData.isActive,
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, payload)
        toast({ title: 'Success', description: 'Coupon updated successfully' })
      } else {
        await createCoupon(payload)
        toast({ title: 'Success', description: 'Coupon created successfully' })
      }
      closeModal()
      fetchCoupons()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to save coupon',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderAmount: coupon.minOrderAmount ?? '',
      maxDiscount: coupon.maxDiscount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      perUserLimit: coupon.perUserLimit ?? '1',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      isActive: coupon.isActive ?? true,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!deleteConfirm) {
      setDeleteConfirm(id)
      return
    }
    if (deleteConfirm !== id) {
      setDeleteConfirm(null)
      return
    }
    setDeletingId(id)
    try {
      await deleteCoupon(id)
      toast({ title: 'Success', description: 'Coupon deleted successfully' })
      setDeleteConfirm(null)
      fetchCoupons()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete coupon',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (coupon) => {
    setTogglingId(coupon._id)
    try {
      await updateCoupon(coupon._id, { isActive: !coupon.isActive })
      toast({ title: 'Success', description: `Coupon ${coupon.isActive ? 'deactivated' : 'activated'}` })
      fetchCoupons()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatValue = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    }
    return `₹${coupon.discountValue}`
  }

  return (
    <div className="space-y-8">
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-syne text-[#1E3A8A] text-2xl">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Code *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  required
                  disabled={!!editingCoupon}
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/20 focus:outline-none"
                >
                  {DISCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Discount Value *</label>
                <Input
                  type="number"
                  min="0"
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                  required
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Min Order (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="0"
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Max Discount (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="Unlimited"
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Usage Limit</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Per User Limit</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="h-11 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="couponIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-[#F97316] border-slate-300 rounded focus:ring-[#F97316]"
              />
              <label htmlFor="couponIsActive" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                Active
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#F97316] hover:bg-[#EA580C] text-white">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : (editingCoupon ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Coupons</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage discount coupons</p>
        </div>
        <Button
          onClick={() => {
            setEditingCoupon(null)
            setFormData(initialFormState)
            setIsModalOpen(true)
          }}
          className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium px-6 h-12"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-5 pl-6 font-semibold text-slate-600">Code</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Type</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Value</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600 hidden md:table-cell">Min Order</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600 hidden lg:table-cell">Max Discount</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Usage</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
              <TableHead className="py-5 font-semibold text-slate-600 hidden sm:table-cell">Expiry</TableHead>
              <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20">
                  <div className="flex justify-center">
                    <PremiumLoader size="small" text="Loading coupons..." />
                  </div>
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 text-slate-500">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                  <TableCell className="py-4 pl-6 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-[#F97316]" />
                      {coupon.code}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      {coupon.discountType}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 font-medium text-slate-900">{formatValue(coupon)}</TableCell>
                  <TableCell className="py-4 text-slate-600 hidden md:table-cell">₹{coupon.minOrderAmount ?? 0}</TableCell>
                  <TableCell className="py-4 text-slate-600 hidden lg:table-cell">{coupon.maxDiscount ? `₹${coupon.maxDiscount}` : '—'}</TableCell>
                  <TableCell className="py-4 text-slate-600">
                    {coupon.usedCount ?? 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={togglingId === coupon._id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-all ${coupon.isActive
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {togglingId === coupon._id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : coupon.isActive ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  <TableCell className="py-4 text-slate-600 hidden sm:table-cell">{formatDate(coupon.expiresAt)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg hover:bg-[#1E3A8A] hover:text-white hover:border-[#1E3A8A] border-slate-200 text-slate-500 transition-all gap-1.5"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 border-slate-200 text-slate-500 transition-all gap-1.5"
                        onClick={() => handleDelete(coupon._id)}
                      >
                        {deletingId === coupon._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : deleteConfirm === coupon._id ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="text-xs font-medium">{deleteConfirm === coupon._id ? 'Confirm?' : 'Delete'}</span>
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

export default AdminCoupons
