import { useState } from 'react'
import {
    Search,
    Shield,
    Package,
    User,
    Plus,
    Mail,
    Lock,
    Tag
} from 'lucide-react'
import PremiumLoader from '../../ui/PremiumLoader'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../ui/dialog'
import { Badge } from '../../ui/badge'
import { Avatar, AvatarFallback } from '../../ui/avatar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createDeliveryBoy, createEmployee, createVendor } from '../../../services/admin'
import { format } from 'date-fns'
import { toast } from '../../ui/use-toast'

const AdminUsers = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState('delivery') // 'delivery', 'employee' or 'vendor'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    })

    const queryClient = useQueryClient()

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['adminUsers', roleFilter],
        queryFn: () => getUsers({ role: roleFilter !== 'all' ? roleFilter : undefined }),
    })

    const createDeliveryMutation = useMutation({
        mutationFn: createDeliveryBoy,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers'])
            setIsModalOpen(false)
            setFormData({ name: '', email: '', password: '' })
            toast({
                title: "Success",
                description: "Delivery partner created successfully",
            })
        },
    })

    const createEmployeeMutation = useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers'])
            setIsModalOpen(false)
            setFormData({ name: '', email: '', password: '' })
            toast({
                title: "Success",
                description: "Employee created successfully",
            })
        },
    })

    const createVendorMutation = useMutation({
        mutationFn: createVendor,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers'])
            setIsModalOpen(false)
            setFormData({ name: '', email: '', password: '' })
            toast({
                title: "Success",
                description: "Vendor created successfully",
            })
        },
    })

    const getRoleBadge = (role) => {
        const styles = {
            ADMIN: 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/20',
            EMPLOYEE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            DELIVERY: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20',
            VENDOR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
            USER: 'bg-slate-100 text-slate-600 border-slate-200',
        }
        return styles[role] || styles.USER
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case 'ADMIN': return <Shield className="h-3 w-3 mr-1" />
            case 'EMPLOYEE': return <Shield className="h-3 w-3 mr-1" />
            case 'DELIVERY': return <Package className="h-3 w-3 mr-1" />
            case 'VENDOR': return <Tag className="h-3 w-3 mr-1" />
            default: return <User className="h-3 w-3 mr-1" />
        }
    }

    const users = usersData?.users || []
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateSubmit = (e) => {
        e.preventDefault()
        if (modalType === 'employee') {
            createEmployeeMutation.mutate(formData)
        } else if (modalType === 'vendor') {
            createVendorMutation.mutate(formData)
        } else {
            createDeliveryMutation.mutate(formData)
        }
    }

    const isSubmitting = modalType === 'employee'
        ? createEmployeeMutation.isPending
        : modalType === 'vendor'
            ? createVendorMutation.isPending
            : createDeliveryMutation.isPending

    return (
        <div className="space-y-8">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-syne text-[#1E3A8A] text-2xl">
                            {modalType === 'employee' ? 'Add Employee' : modalType === 'vendor' ? 'Add Vendor' : 'Add Delivery Partner'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="pl-10 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter email address"
                                    className="pl-10 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Create password"
                                    className="pl-10 border-slate-200 focus:border-[#F97316] focus:ring-[#F97316]/20"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className={
                                    modalType === 'employee' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                                    modalType === 'vendor' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                                    'bg-[#F97316] hover:bg-[#EA580C] text-white'
                                }
                            >
                                {isSubmitting ? 'Creating...' : 'Create Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Users</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Manage users, admins, and delivery partners
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={() => { setModalType('vendor'); setIsModalOpen(true) }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all font-medium px-6 h-12"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Vendor
                    </Button>
                    <Button
                        onClick={() => { setModalType('employee'); setIsModalOpen(true) }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all font-medium px-6 h-12"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Employee
                    </Button>
                    <Button
                        onClick={() => { setModalType('delivery'); setIsModalOpen(true) }}
                        className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium px-6 h-12"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Delivery Partner
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 self-center hidden md:block mx-2"></div>
                <div className="p-1">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] h-12 rounded-xl bg-slate-50 border-transparent hover:bg-slate-100 focus:ring-0 text-slate-600 font-medium">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="USER">Customers</SelectItem>
                            <SelectItem value="ADMIN">Admins</SelectItem>
                            <SelectItem value="EMPLOYEE">Employees</SelectItem>
                            <SelectItem value="VENDOR">Vendors</SelectItem>
                            <SelectItem value="DELIVERY">Delivery Partners</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600">User</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Role</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Joined Date</TableHead>
                            <TableHead className="py-5 pr-8 text-right font-semibold text-slate-600">Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading users..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-slate-500">
                                    No users found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user._id} className="hover:bg-slate-50 transition-colors border-slate-50">
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-10 w-10 border border-slate-200 bg-white">
                                                <AvatarFallback className="bg-slate-50 text-[#1E3A8A] font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-slate-900 text-base">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`gap-1 py-1 px-3 font-medium border ${getRoleBadge(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            {user.role === 'USER' ? 'Customer' : user.role === 'DELIVERY' ? 'Delivery Partner' : user.role === 'EMPLOYEE' ? 'Employee' : user.role === 'VENDOR' ? 'Vendor' : 'Admin'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500 font-medium">
                                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <span className="text-slate-500 font-medium">{user.email}</span>
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

export default AdminUsers