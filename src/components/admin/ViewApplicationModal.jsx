'use client'

import { useState, useEffect } from 'react'
import { 
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    UserIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline'

export default function ViewApplicationModal({ isOpen, onClose, applicationId }) {
    const [application, setApplication] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchApplication()
        }
    }, [isOpen, applicationId])

    const fetchApplication = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await fetch(`/api/admin/applications/${applicationId}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setApplication(data.data)
            } else {
                setError(data.error || 'Failed to fetch application')
            }
        } catch (err) {
            setError('Network error while fetching application')
        } finally {
            setLoading(false)
        }
    }

    const getStatusInfo = (status) => {
        const statusConfig = {
            'submitted': {
                label: 'Submitted',
                color: 'bg-blue-100 text-blue-800',
                icon: ClockIcon
            },
            'pending_offers': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                icon: ExclamationTriangleIcon
            },
            'purchased': {
                label: 'Purchased',
                color: 'bg-purple-100 text-purple-800',
                icon: CheckCircleIcon
            },
            'offer_received': {
                label: 'Offer Received',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon
            },
            'completed': {
                label: 'Completed',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon
            },
            'abandoned': {
                label: 'Abandoned',
                color: 'bg-red-100 text-red-800',
                icon: XCircleIcon
            },
            'deal_expired': {
                label: 'Deal Expired',
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
            'auction_ending_soon': {
                label: 'Auction Ending Soon',
                color: 'bg-red-100 text-red-800'
            },
            'selection_ending_soon': {
                label: 'Selection Ending Soon',
                color: 'bg-orange-100 text-orange-800'
            },
            'auction_expired': {
                label: 'Auction Expired',
                color: 'bg-gray-100 text-gray-800'
            },
            'selection_expired': {
                label: 'Selection Expired',
                color: 'bg-gray-100 text-gray-800'
            }
        }
        return urgencyConfig[urgencyLevel] || {
            label: 'Normal',
            color: 'bg-green-100 text-green-800'
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Application Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading application details...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {application && !loading && (
                    <div className="space-y-6">
                        {/* Header Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900">{application.trade_name}</h4>
                                    <p className="text-sm text-gray-600">Application #{application.application_id}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {(() => {
                                        const statusInfo = getStatusInfo(application.status)
                                        const StatusIcon = statusInfo.icon
                                        return (
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                <StatusIcon className="h-4 w-4 mr-1" />
                                                {statusInfo.label}
                                            </div>
                                        )
                                    })()}
                                    {(() => {
                                        const urgencyInfo = getUrgencyInfo(application.urgency_level)
                                        return (
                                            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgencyInfo.color}`}>
                                                {urgencyInfo.label}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Business Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                                    Business Information
                                </h5>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Trade Name</label>
                                        <p className="text-sm text-gray-900">{application.trade_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">CR Number</label>
                                        <p className="text-sm text-gray-900">{application.cr_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">City</label>
                                        <p className="text-sm text-gray-900 flex items-center">
                                            <MapPinIcon className="h-4 w-4 mr-1" />
                                            {application.city}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <UserIcon className="h-5 w-5 mr-2" />
                                    Contact Information
                                </h5>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                        <p className="text-sm text-gray-900">{application.contact_person}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <p className="text-sm text-gray-900 flex items-center">
                                            <PhoneIcon className="h-4 w-4 mr-1" />
                                            {application.contact_person_number}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Application Details */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                Application Details
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Submitted Date</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(application.submitted_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Priority Level</label>
                                    <p className="text-sm text-gray-900 capitalize">{application.priority_level || 'Normal'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Offers Count</label>
                                    <p className="text-sm text-gray-900">{application.offers_count || 0}</p>
                                </div>
                            </div>
                            {application.notes && (
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-gray-700">Notes</label>
                                    <p className="text-sm text-gray-900 mt-1">{application.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Financial Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Revenue Collected</label>
                                    <p className="text-lg font-semibold text-green-600">
                                        SAR {application.revenue_collected || 0}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Assigned User</label>
                                    <p className="text-sm text-gray-900">
                                        {application.assigned_trade_name ? (
                                            <span>
                                                {application.assigned_trade_name}
                                                <br />
                                                <span className="text-xs text-gray-500">{application.assigned_email}</span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">Not assigned</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        {application.admin_notes && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 className="text-lg font-medium text-gray-900 mb-4">Admin Notes</h5>
                                <p className="text-sm text-gray-900">{application.admin_notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
