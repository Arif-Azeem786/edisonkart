import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Truck, CreditCard, Loader2 } from 'lucide-react'
import { getAllSettings, toggleCod } from '../../services/settings'
import { useToast } from '../ui/use-toast'

const AdminSettings = () => {
  const [settings, setSettings] = useState({ codEnabled: false })
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    getAllSettings()
      .then(s => setSettings(s || { codEnabled: false }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggleCod = async () => {
    setToggling(true)
    try {
      const result = await toggleCod()
      setSettings(prev => ({ ...prev, codEnabled: result.codEnabled }))
      toast({
        title: result.codEnabled ? 'COD Enabled' : 'COD Disabled',
        description: result.codEnabled
          ? 'Cash on Delivery is now available for customers.'
          : 'Cash on Delivery has been hidden from customers.',
      })
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle COD', variant: 'destructive' })
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your store configuration</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-bold text-foreground">Payment Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-orange-100 rounded-lg">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Cash on Delivery (COD)</h3>
                <p className="text-sm text-muted-foreground">
                  {settings.codEnabled
                    ? 'Customers can pay cash when the order arrives'
                    : 'COD is currently hidden from customers'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleCod}
              disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${settings.codEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <motion.div
                animate={{ x: settings.codEnabled ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-green-50/50">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Online Payment (Razorpay)</h3>
                <p className="text-sm text-muted-foreground">Always enabled — UPI, Cards, Netbanking</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-green-50/50">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">Free shipping on all orders</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminSettings
