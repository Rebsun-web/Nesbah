'use client'

import { useState, useEffect, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    ArrowLeftIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/admin/ProtectedRoute'

export default function ApplicationDetail() {
    const params = useParams()
    const router = useRouter()
    const resolvedParams = use(params)
    const [application, setApplication] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [timeRemaining, setTimeRemaining] = useState(null)

    useEffect(() => {
        fetchApplication()
    }, [resolvedParams.id])

    useEffect(() => {
        if (application && application.status === 'live_auction' && application.auction_end_time) {
            const updateTimeRemaining = () => {
                const now = new Date()
                const endTime = new Date(application.auction_end_time)
                const diff = endTime - now
                
                if (diff <= 0) {
                    setTimeRemaining('Expired')
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60))
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
                }
            }
            
            updateTimeRemaining()
            const interval = setInterval(updateTimeRemaining, 1000)
            return () => clearInterval(interval)
        }
    }, [application])

    const fetchApplication = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/applications/${resolvedParams.id}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setApplication(data.data)
                setEditForm({
                    status: data.data.status,
                    admin_notes: data.data.admin_notes || '',
                    priority_level: data.data.priority_level || 'normal',
                    trade_name: data.data.trade_name,
                    cr_number: data.data.cr_number,
                    city: data.data.city,
                    contact_person: data.data.contact_person,
                    contact_person_number: data.data.contact_person_number,
                    notes: data.data.notes,
                    assigned_user_id: data.data.assigned_user_id || null
                })
            } else {
                setError(data.error || 'Failed to fetch application')
            }
        } catch (err) {
            setError('Network error while fetching application')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            const response = await fetch(`/api/admin/applications/${resolvedParams.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(editForm)
            })
            
            const data = await response.json()
            
            if (data.success) {
                setApplication(prev => ({ ...prev, ...data.data }))
                setIsEditing(false)
                setEditForm({
                    status: data.data.status,
                    admin_notes: data.data.admin_notes || '',
                    priority_level: data.data.priority_level || 'normal',
                    trade_name: application.trade_name,
                    cr_number: application.cr_number,
                    city: application.city,
                    contact_person: application.contact_person,
                    contact_person_number: application.contact_person_number,
                    notes: application.notes,
                    assigned_user_id: application.assigned_user_id || null
                })
            } else {
                setError(data.error || 'Failed to update application')
            }
        } catch (err) {
            setError('Network error while updating application')
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/applications/${resolvedParams.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success) {
                router.push('/admin?tab=applications')
            } else {
                setError(data.error || 'Failed to delete application')
            }
        } catch (err) {
            setError('Network error while deleting application')
        }
    }

    const getStatusInfo = (status) => {
        const statusConfig = {
            'live_auction': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                icon: ClockIcon
            },
            'completed': {
                label: 'Completed',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon
            },
            'ignored': {
                label: 'Ignored',
                color: 'bg-gray-100 text-gray-800',
                icon: XCircleIcon
            }
        }
        return statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            icon: ClockIcon
        }
    }

    const getUrgencyInfo = (urgencyLevel) => {
        const urgencyConfig = {

            'normal': {
                label: 'Normal',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon
            }
        }
        return urgencyConfig[urgencyLevel] || {
            label: 'Normal',
            color: 'bg-green-100 text-green-800',
            icon: CheckCircleIcon
        }
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getAuctionStartTime = (endTime) => {
        if (!endTime) return null
        const end = new Date(endTime)
        return new Date(end.getTime() - (48 * 60 * 60 * 1000)) // 48 hours before
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading application...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    if (error) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="text-red-500 text-6xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => router.push('/admin?tab=applications')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Back to Applications
                            </button>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    if (!application) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50">
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="text-gray-500 text-6xl mb-4">📄</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
                            <p className="text-gray-600 mb-4">The application you're looking for doesn't exist.</p>
                            <button
                                onClick={() => router.push('/admin?tab=applications')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Back to Applications
                            </button>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    const statusInfo = getStatusInfo(application.status)
    const urgencyInfo = getUrgencyInfo(application.urgency_level)
    const StatusIcon = statusInfo.icon
    const UrgencyIcon = urgencyInfo.icon
    const auctionStartTime = getAuctionStartTime(application.auction_end_time)

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <button
                                    onClick={() => router.push('/admin?tab=applications')}
                                    className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <ArrowLeftIcon className="h-5 w-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">
                                        Application #{application.application_id}
                                    </h1>
                                    <p className="text-sm text-gray-500">{application.trade_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            <PencilIcon className="h-4 w-4 inline mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                                        >
                                            <TrashIcon className="h-4 w-4 inline mr-1" />
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status and Urgency */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Urgency</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                            <StatusIcon className="h-4 w-4 mr-2" />
                                            {statusInfo.label}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${urgencyInfo.color}`}>
                                            <UrgencyIcon className="h-4 w-4 mr-2" />
                                            {urgencyInfo.label}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auction Timing - Only show for live auction applications */}
                            {application.status === 'live_auction' && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Auction Timing</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Auction Start Time</label>
                                            <p className="mt-1 text-sm text-gray-900">{formatDateTime(auctionStartTime)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Auction End Time</label>
                                            <p className="mt-1 text-sm text-gray-900">{formatDateTime(application.auction_end_time)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Time Remaining</label>
                                            <p className={`mt-1 text-sm font-medium ${timeRemaining === 'Expired' ? 'text-red-600' : 'text-green-600'}`}>
                                                {timeRemaining || 'Calculating...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Business Information */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Trade Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.trade_name}
                                                onChange={(e) => setEditForm({...editForm, trade_name: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.trade_name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.cr_number}
                                                onChange={(e) => setEditForm({...editForm, cr_number: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.cr_number}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.city}
                                                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.city}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CR Capital</label>
                                        <p className="mt-1 text-sm text-gray-900">SAR {application.cr_capital || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.contact_person}
                                                onChange={(e) => setEditForm({...editForm, contact_person: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.contact_person || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editForm.contact_person_number}
                                                onChange={(e) => setEditForm({...editForm, contact_person_number: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.contact_person_number || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assigned User</label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.assigned_user_id || ''}
                                                onChange={(e) => setEditForm({...editForm, assigned_user_id: e.target.value || null})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">No user assigned</option>
                                                {/* TODO: Add business users dropdown */}
                                            </select>
                                        ) : (
                                            <div>
                                                {application.assigned_trade_name ? (
                                                    <div>
                                                        <p className="mt-1 text-sm font-medium text-gray-900">{application.assigned_trade_name}</p>
                                                        <p className="text-xs text-gray-500">{application.assigned_email}</p>
                                                    </div>
                                                ) : (
                                                    <p className="mt-1 text-sm text-gray-500">No user assigned</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Offers */}
                            {application.offers && application.offers.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Offers ({application.offers.length})</h2>
                                    <div className="space-y-4">
                                        {application.offers.map((offer) => (
                                            <div key={offer.offer_id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">{offer.bank_name}</h3>
                                                        <p className="text-sm text-gray-500">{offer.bank_email}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-900">SAR {offer.offer_amount}</p>
                                                        <p className="text-xs text-gray-500">{new Date(offer.submitted_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-600">
                                                    <div>Setup Fee: SAR {offer.setup_fee}</div>
                                                    <div>Mada Fee: {offer.transaction_fee_mada}%</div>
                                                    <div>Visa/MC Fee: {offer.transaction_fee_visa_mc}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Audit Log */}
                            {application.audit_log && application.audit_log.length > 0 && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Audit Log</h2>
                                    <div className="space-y-3">
                                        {application.audit_log.map((log) => (
                                            <div key={log.log_id} className="border-l-4 border-blue-500 pl-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Status changed from {log.from_status} to {log.to_status}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{log.reason}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">{log.admin_name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
                                <div className="space-y-3">

                                    <div>
                                        <p className="text-sm text-gray-500">Submitted</p>
                                        <p className="text-sm text-gray-900">{new Date(application.submitted_at).toLocaleDateString()}</p>
                                    </div>

                                </div>
                            </div>

                            {/* Admin Controls */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Controls</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="live_auction">Live Auction</option>
                                                <option value="approved_leads">Approved Leads</option>
                                                <option value="complete">Complete</option>
                                                <option value="ignored">Ignored</option>
                                            </select>
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{statusInfo.label}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Priority Level</label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.priority_level}
                                                onChange={(e) => setEditForm({...editForm, priority_level: e.target.value})}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900 capitalize">{application.priority_level || 'normal'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                                        {isEditing ? (
                                            <textarea
                                                value={editForm.admin_notes}
                                                onChange={(e) => setEditForm({...editForm, admin_notes: e.target.value})}
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Add admin notes..."
                                            />
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-900">{application.admin_notes || 'No notes'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
