'use client'

import { useState, useEffect } from 'react'
import { 
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    ChevronDownIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'
import { calculateApplicationStatus, getStatusInfo, formatCountdown } from '@/lib/application-status'

export default function AdminApplicationsDashboard() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('submitted_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalApplications, setTotalApplications] = useState(0)
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false)
    const [statusUpdateInfo, setStatusUpdateInfo] = useState(null)

    const fetchApplications = async () => {
        try {
            setLoading(true)
            setError('')
            
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                search: searchTerm,
                status: statusFilter,
                sortBy,
                sortOrder
            })

            const response = await fetch(`/api/admin/applications?${params}`, {
                credentials: 'include'
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch applications')
            }
            
            const data = await response.json()
            
            if (data.success) {
                setApplications(data.data.applications || [])
                setTotalPages(data.data.pagination?.totalPages || 1)
                setTotalApplications(data.data.pagination?.total || 0)
            } else {
                setError(data.error || 'Failed to fetch applications')
            }
        } catch (err) {
            setError('Network error while fetching applications')
        } finally {
            setLoading(false)
        }
    }

    const checkStatusUpdates = async () => {
        try {
            const response = await fetch('/api/admin/applications/update-status', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data.needs_update > 0) {
                    setStatusUpdateInfo({
                        needsUpdate: data.data.needs_update,
                        applications: data.data.applications_needing_update
                    })
                    setShowStatusUpdateModal(true)
                }
            }
        } catch (err) {
            console.error('Error checking status updates:', err)
        }
    }

    const updateApplicationStatuses = async () => {
        try {
            if (!statusUpdateInfo?.applications) return
            
            const applicationIds = statusUpdateInfo.applications.map(app => app.application_id)
            
            const response = await fetch('/api/admin/applications/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ application_ids: applicationIds }),
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    alert(`Successfully updated ${data.data.updated_count} application statuses`)
                    setShowStatusUpdateModal(false)
                    setStatusUpdateInfo(null)
                    fetchApplications() // Refresh the list
                }
            }
        } catch (err) {
            console.error('Error updating application statuses:', err)
            alert('Failed to update application statuses')
        }
    }

    useEffect(() => {
        fetchApplications()
        checkStatusUpdates()
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

    const getApplicationStatusInfo = (application) => {
        const calculatedStatus = calculateApplicationStatus(application);
        return getStatusInfo(calculatedStatus);
    }

    // formatCountdown is now imported from application-status.js

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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Status Update Alert */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Applications Management</h2>
                    <p className="text-gray-600">Manage business applications and track auction statuses</p>
                </div>
                
                {statusUpdateInfo && statusUpdateInfo.needsUpdate > 0 && (
                    <div className="flex items-center space-x-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                        <span className="text-yellow-800 font-medium">
                            {statusUpdateInfo.needsUpdate} applications need status updates
                        </span>
                        <button
                            onClick={updateApplicationStatuses}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                        >
                            Update Now
                        </button>
                    </div>
                )}
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by trade name, CR number, or application ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="all">All Statuses</option>
                        <option value="live_auction">Live Auction</option>
                        <option value="completed">Completed</option>
                        <option value="ignored">Ignored</option>
                    </select>
                    
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="submitted_at">Submitted Date</option>
                        <option value="auction_end_time">Auction End</option>
                        <option value="trade_name">Trade Name</option>
                        <option value="offers_count">Offers Count</option>
                    </select>
                    
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Application
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    POS Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Financial
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status & Tracking
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map((application) => {
                                const statusInfo = getApplicationStatusInfo(application)
                                const openedInfo = getArrayInfo(application.opened_by, 'view')
                                const purchasedInfo = getArrayInfo(application.purchased_by, 'offer')
                                
                                return (
                                    <tr key={application.application_id} className="hover:bg-gray-50">
                                        {/* Application ID & Basic Info */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                #{application.application_id}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(application.submitted_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {formatCountdown(application.auction_end_time)}
                                            </div>
                                        </td>

                                        {/* Business Information */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {application.trade_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                CR: {application.cr_number}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {application.city}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {application.legal_form} • {application.registration_status}
                                            </div>
                                        </td>

                                        {/* POS Details */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {application.pos_provider_name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Age: {application.pos_age_duration_months || 'N/A'} months
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {application.number_of_pos_devices || 'N/A'} devices
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {application.city_of_operation}
                                            </div>
                                        </td>

                                        {/* Financial Information */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatMoney(application.requested_financing_amount)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {application.preferred_repayment_period_months || 'N/A'} months
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Sales: {formatMoney(application.avg_monthly_pos_sales)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Capital: {formatMoney(application.cr_capital)}
                                            </div>
                                        </td>

                                        {/* Status & Tracking */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <statusInfo.icon className="h-4 w-4" />
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Offers: {application.offers_count || 0}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Views: {openedInfo.display} • Purchases: {purchasedInfo.display}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {/* View details */}}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {/* Edit application */}}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit Application"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {/* Delete application */}}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Application"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * 10, totalApplications)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalApplications}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                page === currentPage
                                                    ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {showStatusUpdateModal && statusUpdateInfo && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <ExclamationTriangleIcon className="mx-auto flex items-center justify-center h-12 w-12 text-yellow-600" />
                            <h3 className="text-lg font-medium text-gray-900 mt-2">
                                Status Updates Required
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    {statusUpdateInfo.needsUpdate} applications have expired and need their status updated.
                                </p>
                                <div className="mt-4 text-left">
                                    <p className="text-xs text-gray-400 font-medium">Applications to update:</p>
                                    <ul className="mt-2 text-xs text-gray-500 space-y-1">
                                        {statusUpdateInfo.applications.slice(0, 5).map((app) => (
                                            <li key={app.application_id}>
                                                • {app.trade_name} (CR: {app.cr_number})
                                            </li>
                                        ))}
                                        {statusUpdateInfo.applications.length > 5 && (
                                            <li className="text-gray-400">
                                                ... and {statusUpdateInfo.applications.length - 5} more
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={updateApplicationStatuses}
                                    className="px-4 py-2 bg-yellow-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                >
                                    Update All Statuses
                                </button>
                                <button
                                    onClick={() => setShowStatusUpdateModal(false)}
                                    className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
