import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    Edit2,
    Save,
    Camera,
    LogOut,
    Package,
    Plus,
    Loader2,
    Calendar,
    UserCircle
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useToast } from '../ui/use-toast'
import useAuthStore from '../../store/authStore'
import { getUserOrders } from '../../services/order'
import { updateProfile, addAddress, updateAddress, deleteAddress, uploadAvatar } from '../../services/user'
import AddressCard from '../profile/AddressCard'
import AddressModal from '../profile/AddressModal'
import { useNavigate, Link } from 'react-router-dom'
import { validatePhone } from '../../utils/validation'
import { getUserAvatarUrl } from '../ui/imageUtils'

const Profile = () => {
    const { user, logout, updateUser } = useAuthStore()
    const navigate = useNavigate()
    const { toast } = useToast()

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gender: user?.gender || 'PREFER_NOT_TO_SAY',
        dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    })

    const fileInputRef = useRef(null)

    // Address Modal State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)

    // Fetch Orders
    const { data: orderData } = useQuery({
        queryKey: ['orders'],
        queryFn: getUserOrders,
    })

    const orders = orderData?.orders || []

    const handleLogout = () => {
        logout()
        navigate('/login')
        toast({ title: "Logged out successfully" })
    }

    // Avatar Upload Handler
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Maximum size is 2MB"
            })
            return
        }

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            setIsUploading(true)
            const updatedUser = await uploadAvatar(formData)
            updateUser(updatedUser)
            toast({ title: "Profile picture updated" })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: error.response?.data?.message || "Something went wrong"
            })
        } finally {
            setIsUploading(false)
        }
    }

    // Profile Update Handler
    const handleSaveProfile = async () => {
        // Validation
        if (profileData.phone && !validatePhone(profileData.phone)) {
            toast({
                variant: "destructive",
                title: "Invalid Phone Number",
                description: "Please enter a valid 10-digit phone number"
            })
            return
        }

        try {
            const updatedUser = await updateProfile({
                name: profileData.name,
                phone: profileData.phone,
                gender: profileData.gender,
                dob: profileData.dob
            })
            updateUser(updatedUser)
            setIsEditing(false)
            toast({ title: "Profile updated successfully" })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to update profile",
                description: error.response?.data?.message || "Something went wrong"
            })
        }
    }

    // Address Handlers
    const handleAddAddress = () => {
        setEditingAddress(null)
        setIsAddressModalOpen(true)
    }

    const handleEditAddress = (addressId) => {
        const addressToEdit = user.addresses.find(addr => addr._id === addressId)
        if (addressToEdit) {
            setEditingAddress(addressToEdit)
            setIsAddressModalOpen(true)
        }
    }

    const handleSaveAddress = async (formData) => {
        try {
            let updatedAddresses
            if (editingAddress) {
                updatedAddresses = await updateAddress(editingAddress._id, formData)
                toast({ title: "Address updated successfully" })
            } else {
                updatedAddresses = await addAddress(formData)
                toast({ title: "Address added successfully" })
            }
            // Backend returns the updated list of addresses
            updateUser({ addresses: updatedAddresses })
            setIsAddressModalOpen(false)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to save address",
                description: error.response?.data?.message || "Something went wrong"
            })
        }
    }

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return

        try {
            const updatedAddresses = await deleteAddress(addressId)
            updateUser({ addresses: updatedAddresses })
            toast({ title: "Address deleted successfully" })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to delete address",
                description: error.response?.data?.message || "Something went wrong"
            })
        }
    }

    const handleSetDefaultAddress = async (addressId) => {
        try {
            const updatedAddresses = await updateAddress(addressId, { isDefault: true })
            updateUser({ addresses: updatedAddresses })
            toast({ title: "Default address updated" })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to update default address",
                description: error.response?.data?.message || "Something went wrong"
            })
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'DELIVERED': return 'text-[#10B981] bg-[#10B981]/10'
            case 'CANCELLED': return 'text-red-500 bg-red-100'
            case 'SHIPPED': return 'text-amber-600 bg-amber-100'
            default: return 'text-[#1E3A8A] bg-[#1E3A8A]/10'
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 sticky top-28"
                    >
                        {/* Avatar */}
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-[3px] shadow-lg">
                                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden relative group">
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 text-[#1E3A8A] animate-spin" />
                                        ) : user?.avatar ? (
                                            <img 
                                                src={getUserAvatarUrl(user.avatar)} 
                                                alt={user.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <UserIcon className="h-10 w-10 text-muted-foreground/40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarChange} 
                                />
                                <button 
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-[#1E3A8A] rounded-full text-white hover:bg-[#15306B] transition shadow-md shadow-[#1E3A8A]/20"
                                >
                                    <Camera className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold mt-4">{user?.name}</h2>
                            <p className="text-sm text-muted-foreground">{user?.createdAt ? `Member since ${new Date(user.createdAt).getFullYear()}` : 'Member'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="text-center p-4 bg-card rounded-2xl shadow-sm border border-border/50">
                                <p className="text-2xl font-bold text-[#1E3A8A]">{orders.length}</p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Orders</p>
                            </div>
                            <div className="text-center p-4 bg-card rounded-2xl shadow-sm border border-border/50">
                                <p className="text-2xl font-bold text-[#F97316]">{user?.addresses?.length || 0}</p>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Addresses</p>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-medium group"
                        >
                            <LogOut className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
                            <span>Logout</span>
                        </button>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
                    >
                        {/* Profile Info Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-[#1E3A8A]">Profile Information</h3>
                                <p className="text-sm text-muted-foreground">Manage your personal details</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`rounded-xl gap-2 border-0 ${isEditing ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            >
                                {isEditing ? (
                                    <><Save className="h-4 w-4" /> Save Changes</>
                                ) : (
                                    <><Edit2 className="h-4 w-4" /> Edit Profile</>
                                )}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <UserIcon className="h-3 w-3" /> Full Name
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="text"
                                        value={profileData.name}
                                        className="h-11 rounded-xl focus:ring-[#1E3A8A]"
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-sm font-semibold text-foreground py-2.5 px-1 border-b border-slate-100 dark:border-slate-800">
                                        {profileData.name}
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Email Address
                                </label>
                                <div className="text-sm font-semibold text-foreground py-2.5 px-1 border-b border-slate-100 dark:border-slate-800 opacity-60 flex items-center justify-between">
                                    {profileData.email}
                                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Verified</span>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Phone Number
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="tel"
                                        value={profileData.phone}
                                        className="h-11 rounded-xl focus:ring-[#1E3A8A]"
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-sm font-semibold text-foreground py-2.5 px-1 border-b border-slate-100 dark:border-slate-800">
                                        {profileData.phone || 'Not provided'}
                                    </div>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <UserCircle className="h-3 w-3" /> Gender
                                </label>
                                {isEditing ? (
                                    <select
                                        value={profileData.gender}
                                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                        className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
                                    >
                                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                ) : (
                                    <div className="text-sm font-semibold text-foreground py-2.5 px-1 border-b border-slate-100 dark:border-slate-800">
                                        {profileData.gender.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>

                            {/* DOB */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> Date of Birth
                                </label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={profileData.dob}
                                        className="h-11 rounded-xl focus:ring-[#1E3A8A]"
                                        onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-sm font-semibold text-foreground py-2.5 px-1 border-b border-slate-100 dark:border-slate-800">
                                        {profileData.dob ? new Date(profileData.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Saved Addresses */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
                    >
                        <h3 className="text-lg font-bold text-[#1E3A8A] mb-4">Saved Addresses</h3>
                        <div className="space-y-3">
                            {user?.addresses && user.addresses.length > 0 ? (
                                user.addresses.map((address) => (
                                    <AddressCard
                                        key={address._id}
                                        address={address}
                                        onEdit={handleEditAddress}
                                        onDelete={handleDeleteAddress}
                                        onSetDefault={handleSetDefaultAddress}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-xl">No addresses saved yet</p>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleAddAddress}
                                className="w-full rounded-xl border-dashed border-2 hover:border-[#F97316] hover:text-[#F97316] h-12 gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add New Address
                            </Button>
                        </div>
                    </motion.div>

                    {/* Recent Orders */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#1E3A8A]">Recent Orders</h3>
                            {orders.length > 0 && (
                                <Link to="/orders">
                                    <Button variant="link" className="text-[#F97316] text-sm h-auto p-0 hover:no-underline font-medium">
                                        View All Orders
                                    </Button>
                                </Link>
                            )}
                        </div>

                        <div className="space-y-3">
                            {orders.length > 0 ? (
                                orders.slice(0, 3).map((order) => (
                                    <div
                                        key={order._id}
                                        className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-[#1E3A8A]">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Order #{order.orderId}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus.replace(/_/g, ' ')}
                                            </span>
                                            <Link to={`/orders/${order.orderId}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                                                    <Edit2 className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-muted/30 rounded-xl">
                                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <p className="text-base font-medium text-foreground">No orders yet</p>
                                    <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here.</p>
                                    <Link to="/products">
                                        <Button className="bg-[#1E3A8A] hover:bg-[#15306B] text-white rounded-xl">
                                            Start Shopping
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Address Modal */}
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleSaveAddress}
                address={editingAddress}
            />
        </div>
    )
}

export default Profile