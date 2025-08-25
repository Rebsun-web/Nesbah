'use client'

import { useState, useEffect } from 'react'
import { 
    DocumentArrowDownIcon, 
    EyeIcon, 
    PhoneIcon, 
    EnvelopeIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function BoughtLeadsDisplay({ userInfo }) {
    const [purchasedLeads, setPurchasedLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (userInfo?.user_id) {
            fetchPurchasedLeads()
        }
    }, [userInfo])

    const fetchPurchasedLeads = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/leads/purchased', {
                headers: { 'x-user-id': userInfo.user_id }
            })
            const data = await response.json()
            
            if (data.success) {
                setPurchasedLeads(data.data)
            } else {
                setError('Failed to load purchased leads')
            }
        } catch (err) {
            console.error('Failed to fetch purchased leads:', err)
            setError('Failed to load purchased leads')
        } finally {
            setLoading(false)
        }
    }

    const handleExportXLSX = async () => {
        try {
            setExporting(true)
            const response = await fetch('/api/leads/purchased/export', {
                headers: { 'x-user-id': userInfo.user_id }
            })
            
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `purchased-leads-${new Date().toISOString().split('T')[0]}.xlsx`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                setError('Failed to export leads')
            }
        } catch (err) {
            console.error('Export failed:', err)
            setError('Failed to export leads')
        } finally {
            setExporting(false)
        }
    }

    const getStatusInfo = (status) => {
        const statusConfig = {
            'live_auction': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                icon: '⏰'
            },
            'approved_leads': {
                label: 'Approved Leads',
                color: 'bg-purple-100 text-purple-800',
                icon: '💰'
            },
            'complete': {
                label: 'Complete',
                color: 'bg-green-100 text-green-800',
                icon: '✅'
            },
            'ignored': {
                label: 'Ignored',
                color: 'bg-gray-100 text-gray-800',
                icon: '❌'
            }
        }
        return statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            icon: '❓'
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    if (purchasedLeads.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                    <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No purchased leads</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        You haven't purchased any leads yet.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Purchased Leads
                        </h3>
                        <p className="text-sm text-gray-500">
                            {purchasedLeads.length} lead{purchasedLeads.length !== 1 ? 's' : ''} purchased
                        </p>
                    </div>
                    <button
                        onClick={handleExportXLSX}
                        disabled={exporting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        {exporting ? 'Exporting...' : 'Export XLSX'}
                    </button>
                </div>
            </div>

            {/* Leads List */}
            <div className="divide-y divide-gray-200">
                {purchasedLeads.map((lead, index) => (
                    <div key={lead.application_id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {/* Header Row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {lead.trade_name}
                                        </h4>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(lead.status).color}`}>
                                            {getStatusInfo(lead.status).icon} {getStatusInfo(lead.status).label}
                                        </span>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        <div>App ID: {lead.application_id}</div>
                                        <div>Submitted: {new Date(lead.submitted_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {/* Business Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">CR Number:</span>
                                        <span className="ml-2 text-sm text-gray-600">{lead.cr_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Sector:</span>
                                        <span className="ml-2 text-sm text-gray-600">{lead.sector}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Capital:</span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {lead.cr_capital ? `SAR ${lead.cr_capital.toLocaleString()}` : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Address:</span>
                                        <span className="ml-2 text-sm text-gray-600">{lead.address}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">E-commerce:</span>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {lead.has_ecommerce ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">POS Devices:</span>
                                        <span className="ml-2 text-sm text-gray-600">{lead.number_of_pos_devices}</span>
                                    </div>
                                </div>

                                {/* Business Owner Personal Details */}
                                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                    <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                                        <UserIcon className="h-4 w-4 mr-1" />
                                        Business Owner Contact Details
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="flex items-center">
                                            <UserIcon className="h-4 w-4 text-blue-600 mr-2" />
                                            <span className="text-sm text-blue-800">
                                                {lead.business_contact_person || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <PhoneIcon className="h-4 w-4 text-blue-600 mr-2" />
                                            <span className="text-sm text-blue-800">
                                                {lead.business_contact_telephone || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <EnvelopeIcon className="h-4 w-4 text-blue-600 mr-2" />
                                            <span className="text-sm text-blue-800">
                                                {lead.business_contact_email || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Offer Information */}
                                {lead.offer_device_setup_fee && (
                                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                                        <h5 className="text-sm font-medium text-green-900 mb-2 flex items-center">
                                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                            Your Offer Details
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div>
                                                <span className="text-sm font-medium text-green-700">Setup Fee:</span>
                                                <span className="ml-2 text-sm text-green-800">
                                                    SAR {lead.offer_device_setup_fee}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-green-700">Mada Fee:</span>
                                                <span className="ml-2 text-sm text-green-800">
                                                    {lead.offer_transaction_fee_mada}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-green-700">Visa/MC Fee:</span>
                                                <span className="ml-2 text-sm text-green-800">
                                                    {lead.offer_transaction_fee_visa_mc}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-green-700">Settlement:</span>
                                                <span className="ml-2 text-sm text-green-800">
                                                    {lead.offer_settlement_time_mada} days
                                                </span>
                                            </div>
                                        </div>
                                        {lead.offer_comment && (
                                            <div className="mt-2">
                                                <span className="text-sm font-medium text-green-700">Comment:</span>
                                                <span className="ml-2 text-sm text-green-800">{lead.offer_comment}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Additional Details */}
                                <div className="text-xs text-gray-500 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <span>Revenue: {lead.revenue_collected ? `SAR ${lead.revenue_collected}` : 'N/A'}</span>
                                        <span>Offers: {lead.offers_count}</span>
                                        {lead.uploaded_filename && (
                                            <span>Document: {lead.uploaded_filename}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        {lead.auction_end_time && new Date(lead.auction_end_time).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
