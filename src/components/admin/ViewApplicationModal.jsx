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
import {
    formatFinancingType, formatAmountRange, formatAgeRange,
    formatRevenueRange, formatCity, formatSector, formatHasPos,
} from '@/lib/apply-options'
import { TIER_LABELS, TIER_BADGE_CLASSES, SCORE_DISCLAIMER } from '@/lib/lead-score'

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
        if (!amount) return 'Not specified'
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return 'Not specified'
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
                                <h4 className="text-xl font-semibold text-gray-900">{application.trade_name || 'Not specified'}</h4>
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
                                {application.trade_name && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Business Name</label>
                                        <p className="text-sm text-gray-900">{application.trade_name}</p>
                                    </div>
                                )}
                                {(application.cr_national_number || application.cr_number) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">CR Number</label>
                                        <p className="text-sm text-gray-900 font-mono">
                                            {application.cr_national_number || application.cr_number}
                                        </p>
                                    </div>
                                )}
                                {application.city_of_operation && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">City</label>
                                        <p className="text-sm text-gray-900">{application.city_of_operation}</p>
                                    </div>
                                )}
                                {application.sector && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Sector</label>
                                        <p className="text-sm text-gray-900">{application.sector}</p>
                                    </div>
                                )}
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
                                    <p className="text-sm text-gray-900">{application.contact_person || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <p className="text-sm text-gray-900 flex items-center">
                                        <PhoneIcon className="h-4 w-4 mr-1" />
                                        {application.contact_person_number || 'Not specified'}
                                    </p>
                                </div>
                                {application.business_contact_email && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Business Email</label>
                                        <p className="text-sm text-gray-900">{application.business_contact_email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Wathiq / Business Registry Data */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                            Wathiq / Business Registry Data
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Trade Name</label>
                                <p className="text-sm text-gray-900">{application.trade_name || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">CR Number</label>
                                <p className="text-sm text-gray-900 font-mono">{application.cr_number || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Legal Form</label>
                                <p className="text-sm text-gray-900">{application.legal_form || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Registration Status</label>
                                <p className="text-sm text-gray-900">{application.registration_status || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Issue Date</label>
                                <p className="text-sm text-gray-900">{application.issue_date_gregorian || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Confirmation Date</label>
                                <p className="text-sm text-gray-900">{application.confirmation_date_gregorian || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">HQ City</label>
                                <p className="text-sm text-gray-900">{application.city || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">District</label>
                                <p className="text-sm text-gray-900">{application.headquarter_district_name || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Street</label>
                                <p className="text-sm text-gray-900">{application.headquarter_street_name || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Building Number</label>
                                <p className="text-sm text-gray-900">{application.headquarter_building_number || 'Not specified'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">CR Capital</label>
                                <p className="text-sm text-gray-900">{formatMoney(application.cr_capital)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Cash Capital</label>
                                <p className="text-sm text-gray-900">{formatMoney(application.cash_capital)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">In-Kind Capital</label>
                                <p className="text-sm text-gray-900">{formatMoney(application.in_kind_capital)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Average Capital</label>
                                <p className="text-sm text-gray-900">{formatMoney(application.avg_capital)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Has eCommerce</label>
                                <p className="text-sm text-gray-900">
                                    {application.has_ecommerce === null || application.has_ecommerce === undefined
                                        ? 'Not specified'
                                        : application.has_ecommerce ? 'Yes' : 'No'}
                                    {application.store_url ? ` — ${application.store_url}` : ''}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Management Structure</label>
                                <p className="text-sm text-gray-900">{application.management_structure || 'Not specified'}</p>
                            </div>
                        </div>
                        {application.management_managers && Array.isArray(application.management_managers) && application.management_managers.length > 0 && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Management Managers</label>
                                <div className="mt-1 space-y-1">
                                    {application.management_managers.map((m, i) => (
                                        <p key={i} className="text-sm text-gray-900">
                                            {m.name || 'Not specified'}{m.role ? ` — ${m.role}` : ''}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {application.activities && Array.isArray(application.activities) && application.activities.length > 0 && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Activities</label>
                                <div className="mt-1 space-y-1">
                                    {application.activities.map((a, i) => (
                                        <p key={i} className="text-sm text-gray-900">{a || 'Not specified'}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {application.contact_info && typeof application.contact_info === 'object' && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Registered Contact Info</label>
                                <div className="mt-1 space-y-1">
                                    {application.contact_info.email && <p className="text-sm text-gray-900">Email: {application.contact_info.email}</p>}
                                    {application.contact_info.mobile && <p className="text-sm text-gray-900">Mobile: {application.contact_info.mobile}</p>}
                                    {application.contact_info.phone && <p className="text-sm text-gray-900">Phone: {application.contact_info.phone}</p>}
                                </div>
                            </div>
                        )}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Is Verified</label>
                                <p className="text-sm text-gray-900">
                                    {application.is_verified === null || application.is_verified === undefined
                                        ? 'Not specified'
                                        : application.is_verified ? 'Yes' : 'No'}
                                </p>
                            </div>
                            {application.verification_date && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Verification Date</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(application.verification_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Financing Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Financing Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {application.financing_type && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Financing Type</label>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                        {formatFinancingType(application.financing_type, 'en')}
                                    </span>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Requested Amount</label>
                                <p className="text-sm text-gray-900">
                                    {formatAmountRange(application.amount_range_code, 'en', application.approximate_financing_amount)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Annual Revenue</label>
                                <p className="text-sm text-gray-900">
                                    {formatRevenueRange(application.annual_revenue_code, 'en', { isPreRevenue: application.is_pre_revenue === true })}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Business Age</label>
                                <p className="text-sm text-gray-900">
                                    {formatAgeRange(application.business_age_range_code, 'en')}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Sales via POS Devices</label>
                                <p className="text-sm text-gray-900">
                                    {formatHasPos(application.own_pos_system, 'en')}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <p className="text-sm text-gray-900">
                                    {formatCity(application.city_code, 'en', application.city_of_operation)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Sector</label>
                                <p className="text-sm text-gray-900">
                                    {formatSector(application.sector_code, 'en', application.sector)}
                                </p>
                            </div>
                        </div>

                        {/* Internal prioritization indicator — admin/partner only. Never
                            shown to the applicant, and explicitly not a credit decision. */}
                        {application.lead_tier && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label className="text-sm font-medium text-gray-700">Lead Priority</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${TIER_BADGE_CLASSES[application.lead_tier]}`}>
                                        {TIER_LABELS[application.lead_tier].en}
                                    </span>
                                    {application.lead_score != null && (
                                        <span className="text-xs text-gray-500 font-mono">{application.lead_score}/100</span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-400">{SCORE_DISCLAIMER.en}</p>
                            </div>
                        )}
                        {application.notes && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-700">Purpose of Financing</label>
                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{application.notes}</p>
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
