import { useState } from 'react'
import {
    Search,
    MessageSquare,
    Mail,
    Clock,
    CheckCircle2,
    Eye,
    Trash2,
    ChevronDown,
    ChevronUp,
    Inbox
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
import { Badge } from '../../ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContacts, updateContactStatus, deleteContact } from '../../../services/contact'
import { format } from 'date-fns'
import { toast } from '../../ui/use-toast'

const AdminContactSubmissions = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedRow, setExpandedRow] = useState(null)

    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['adminContacts', statusFilter, searchTerm],
        queryFn: () => getContacts({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: searchTerm || undefined,
        }),
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => updateContactStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminContacts'])
            toast({ title: "Status Updated", description: "Contact status has been updated." })
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminContacts'])
            toast({ title: "Deleted", description: "Contact submission has been deleted." })
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete submission.", variant: "destructive" })
        }
    })

    const contacts = data?.contacts || []
    const counts = data?.counts || { NEW: 0, READ: 0, RESOLVED: 0, total: 0 }

    const getStatusBadge = (status) => {
        const styles = {
            NEW: 'bg-blue-50 text-blue-700 border-blue-200',
            READ: 'bg-amber-50 text-amber-700 border-amber-200',
            RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
        return styles[status] || styles.NEW
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'NEW': return <Inbox className="h-3 w-3 mr-1" />
            case 'READ': return <Eye className="h-3 w-3 mr-1" />
            case 'RESOLVED': return <CheckCircle2 className="h-3 w-3 mr-1" />
            default: return <Inbox className="h-3 w-3 mr-1" />
        }
    }

    const getNextStatus = (current) => {
        const flow = { NEW: 'READ', READ: 'RESOLVED', RESOLVED: 'RESOLVED' }
        return flow[current]
    }

    const getNextStatusLabel = (current) => {
        const labels = { NEW: 'Mark as Read', READ: 'Mark as Resolved', RESOLVED: null }
        return labels[current]
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this submission?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-syne text-[#1E3A8A]">Contact Submissions</h1>
                <p className="text-slate-500 mt-2 text-lg">
                    View and manage messages from your customers
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: counts.total, color: 'slate', icon: MessageSquare },
                    { label: 'New', value: counts.NEW, color: 'blue', icon: Inbox },
                    { label: 'Read', value: counts.READ, color: 'amber', icon: Eye },
                    { label: 'Resolved', value: counts.RESOLVED, color: 'emerald', icon: CheckCircle2 },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                                <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search by name, email, or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="h-10 w-px bg-slate-200 self-center hidden md:block mx-2"></div>
                <div className="p-1">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-12 rounded-xl bg-slate-50 border-transparent hover:bg-slate-100 focus:ring-0 text-slate-600 font-medium">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="READ">Read</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="py-5 pl-6 font-semibold text-slate-600 w-8"></TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Sender</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Subject</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Status</TableHead>
                            <TableHead className="py-5 font-semibold text-slate-600">Date</TableHead>
                            <TableHead className="py-5 pr-6 text-right font-semibold text-slate-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex justify-center">
                                        <PremiumLoader size="small" text="Loading submissions..." />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                            <MessageSquare className="h-7 w-7 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No submissions found</p>
                                        <p className="text-sm text-slate-400">Contact submissions will appear here</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact) => (
                                <>
                                    <TableRow
                                        key={contact._id}
                                        className={`hover:bg-slate-50 transition-colors border-slate-50 cursor-pointer ${contact.status === 'NEW' ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => setExpandedRow(expandedRow === contact._id ? null : contact._id)}
                                    >
                                        <TableCell className="pl-6 w-8">
                                            {expandedRow === contact._id
                                                ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                                : <ChevronDown className="h-4 w-4 text-slate-400" />
                                            }
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div>
                                                <p className={`font-semibold text-slate-900 ${contact.status === 'NEW' ? 'text-[#1E3A8A]' : ''}`}>
                                                    {contact.name}
                                                </p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Mail className="h-3 w-3" />
                                                    {contact.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className={`text-sm font-medium ${contact.status === 'NEW' ? 'text-slate-900' : 'text-slate-600'} max-w-[250px] truncate`}>
                                                {contact.subject}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1 py-1 px-3 font-medium border ${getStatusBadge(contact.status)}`}>
                                                {getStatusIcon(contact.status)}
                                                {contact.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-sm font-medium">
                                                    {format(new Date(contact.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {getNextStatusLabel(contact.status) && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-lg text-xs font-medium h-8"
                                                        disabled={updateStatusMutation.isPending}
                                                        onClick={() => updateStatusMutation.mutate({
                                                            id: contact._id,
                                                            status: getNextStatus(contact.status)
                                                        })}
                                                    >
                                                        {getNextStatusLabel(contact.status)}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                                    onClick={() => handleDelete(contact._id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {/* Expanded Message Row */}
                                    {expandedRow === contact._id && (
                                        <TableRow key={`${contact._id}-detail`} className="bg-slate-50/70">
                                            <TableCell colSpan={6} className="px-6 py-5">
                                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Message</p>
                                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {contact.message}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                                                        <a
                                                            href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                                                            className="text-sm text-[#1E3A8A] hover:text-[#F97316] font-medium flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                            Reply via Email
                                                        </a>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default AdminContactSubmissions
