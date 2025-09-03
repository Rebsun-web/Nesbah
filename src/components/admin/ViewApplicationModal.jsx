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

export default function ViewApplicationModal({ isOpen, onClose, application, onRefresh }) {
    const [timeRemaining, setTimeRemaining] = useState(null)

    useEffect(() => {
        if (application && (application.calculated_status === 'live_auction' || application.status === 'live_auction') && application.auction_end_time) {
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

    const getStatusInfo = (status) => {
        const statusConfig = {
            'live_auction': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                icon: ClockIcon,
                description: 'Application is currently in live auction'
            },
            'completed': {
                label: 'Completed',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon,
                description: 'Application has offers and auction completed'
            },
            'ignored': {
                label: 'Ignored',
                color: 'bg-red-100 text-red-800',
                icon: XCircleIcon,
                description: 'Application expired with no offers'
            }
        }
        return statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            icon: ClockIcon,
            description: 'Status unknown'
        }
    }

    const formatMoney = (amount) => {
        if (!amount) return 'N/A'
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return 'N/A'
        return `SAR ${num.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        })}`
    }

    const getArrayInfo = (array, label) => {
        if (!array || !Array.isArray(array)) return { count: 0, display: 'None' }
        
        const count = array.length
        if (count === 0) return { count: 0, display: 'None' }
        
        return {
            count,
            display: `${count} ${label}${count === 1 ? '' : 's'}`
        }
    }

    const downloadDocument = async (applicationId, filename) => {
        try {
            const response = await fetch(`/api/admin/applications/${applicationId}/download`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Failed to download document')
            }
        } catch (error) {
            console.error('Download error:', error)
            alert('Error downloading document')
        }
    }

    if (!isOpen) return null

    if (!application) {
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
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-600">No application data available</p>
                    </div>
                </div>
            </div>
        )
    }

    const statusInfo = getStatusInfo(application.calculated_status || application.status)
    const StatusIcon = statusInfo.icon
    const openedInfo = getArrayInfo(application.opened_by, 'view')
    const purchasedInfo = getArrayInfo(application.purchased_by, 'offer')

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

                <div className="space-y-6">
                    {/* Header Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900">{application.trade_name}</h4>
                                <p className="text-sm text-gray-600">Application #{application.application_id}</p>
                                <p className="text-sm text-gray-500">
                                    Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                    <StatusIcon className="h-5 w-5" />
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                                {(application.calculated_status === 'live_auction' || application.status === 'live_auction') && timeRemaining && (
                                    <div className="text-sm text-gray-600">
                                        Time remaining: {timeRemaining}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status & Tracking Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Status & Tracking</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Current Status</label>
                                <p className="text-sm text-gray-900">{statusInfo.description}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Offers Received</label>
                                <p className="text-sm text-gray-900">{application.offers_count || 0}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Views</label>
                                <p className="text-sm text-gray-900">{openedInfo.display}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Purchases</label>
                                <p className="text-sm text-gray-900">{purchasedInfo.display}</p>
                            </div>
                            {application.auction_end_time && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Auction End Time</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(application.auction_end_time).toLocaleString()}
                                    </p>
                                </div>
                            )}
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
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Legal Form</label>
                                    <p className="text-sm text-gray-900">{application.legal_form || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Registration Status</label>
                                    <p className="text-sm text-gray-900">{application.registration_status || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">CR Capital</label>
                                    <p className="text-sm text-gray-900">{formatMoney(application.cr_capital)}</p>
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
                                    <p className="text-sm text-gray-900">{application.contact_person || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <p className="text-sm text-gray-900 flex items-center">
                                        <PhoneIcon className="h-4 w-4 mr-1" />
                                        {application.contact_person_number || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Business Email</label>
                                    <p className="text-sm text-gray-900">
                                        {application.business_email && application.business_email.trim() !== '' ? application.business_email : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* POS & Application Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            POS & Application Details
                        </h5>
                        
                        {/* POS Information */}
                        <div className="mt-6">
                            <h6 className="text-md font-medium text-gray-800 mb-3">POS Information</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Provider Name</label>
                                    <p className="text-sm text-gray-900">{application.pos_provider_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Age Duration</label>
                                    <p className="text-sm text-gray-900">
                                        {application.pos_age_duration_months ? `${application.pos_age_duration_months} months` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Number of POS Devices</label>
                                    <p className="text-sm text-gray-900">{application.number_of_pos_devices || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">City of Operation</label>
                                    <p className="text-sm text-gray-900">{application.city_of_operation || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Average Monthly POS Sales</label>
                                    <p className="text-sm text-gray-900">
                                        {formatMoney(application.avg_monthly_pos_sales)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Own POS System</label>
                                    <p className="text-sm text-gray-900">{application.own_pos_system ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Financial Information */}
                        <div className="mt-6">
                            <h6 className="text-md font-medium text-gray-800 mb-3">Financial Information</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Requested Financing Amount</label>
                                    <p className="text-sm text-gray-900">
                                        {formatMoney(application.requested_financing_amount)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Preferred Repayment Period</label>
                                    <p className="text-sm text-gray-900">
                                        {application.preferred_repayment_period_months ? `${application.preferred_repayment_period_months} months` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Notes */}
                        {application.notes && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Notes</label>
                                <p className="text-sm text-gray-900 mt-1">{application.notes}</p>
                            </div>
                        )}
                        
                        {/* Uploaded Document */}
                        {application.uploaded_filename && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Uploaded Document</label>
                                <div className="flex items-center space-x-3 mt-1">
                                    <p className="text-sm text-gray-900">{application.uploaded_filename}</p>
                                    <button
                                        onClick={() => downloadDocument(application.application_id, application.uploaded_filename)}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 transition-colors"
                                    >
                                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Notes */}
                    {application.admin_notes && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="text-lg font-medium text-gray-900 mb-4">Admin Notes</h5>
                            <p className="text-sm text-gray-900">{application.admin_notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
