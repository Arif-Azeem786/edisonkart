import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { validatePhone, validatePincode, validateRequired } from '../../utils/validation'

const AddressModal = ({ isOpen, onClose, onSave, address = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false
    })
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (address) {
            setFormData({
                name: address.name || '',
                phone: address.phone || '',
                addressLine1: address.addressLine1 || '',
                addressLine2: address.addressLine2 || '',
                city: address.city || '',
                state: address.state || '',
                pincode: address.pincode || '',
                isDefault: address.isDefault || false
            })
        } else {
            setFormData({
                name: '',
                phone: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                pincode: '',
                isDefault: false
            })
        }
        setErrors({})
    }, [address, isOpen])

    const validate = () => {
        const newErrors = {}
        if (!validateRequired(formData.name)) newErrors.name = 'Name is required'

        if (!validateRequired(formData.phone)) {
            newErrors.phone = 'Phone is required'
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Invalid phone number (must be 10 digits)'
        }

        if (!validateRequired(formData.addressLine1)) newErrors.addressLine1 = 'Address Line 1 is required'
        if (!validateRequired(formData.city)) newErrors.city = 'City is required'
        if (!validateRequired(formData.state)) newErrors.state = 'State is required'

        if (!validateRequired(formData.pincode)) {
            newErrors.pincode = 'Pincode is required'
        } else if (!validatePincode(formData.pincode)) {
            newErrors.pincode = 'Invalid pincode (must be 6 digits)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
          //  console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold">{address ? 'Edit Address' : 'Add New Address'}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="address-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="John Doe"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="9876543210"
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Address Line 1</label>
                                <Input
                                    type="text"
                                    value={formData.addressLine1}
                                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                    placeholder="House No, Building, Street"
                                    className={errors.addressLine1 ? 'border-red-500' : ''}
                                />
                                {errors.addressLine1 && <p className="text-xs text-red-500">{errors.addressLine1}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Address Line 2 (Optional)</label>
                                <Input
                                    type="text"
                                    value={formData.addressLine2}
                                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                    placeholder="Landmark, Area"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">City</label>
                                    <Input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="City"
                                        className={errors.city ? 'border-red-500' : ''}
                                    />
                                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">State</label>
                                    <Input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="State"
                                        className={errors.state ? 'border-red-500' : ''}
                                    />
                                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Pincode</label>
                                    <Input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        placeholder="Pin Code"
                                        className={errors.pincode ? 'border-red-500' : ''}
                                    />
                                    {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
                                </div>
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isDefault}
                                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700">Set as default</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="address-form"
                            disabled={isLoading}
                            className="bg-[#1E3A8A] hover:bg-[#15306B] text-white"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save Address</>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default AddressModal
