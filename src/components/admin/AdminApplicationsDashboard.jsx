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
    InformationCircleIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { calculateApplicationStatus, getStatusInfo, formatCountdown, safeTextFormat } from '@/lib/application-status'
import { getCorrectStatus } from '@/lib/client-status-utils'
import NewApplicationModal from './NewApplicationModal'
import ViewApplicationModal from './ViewApplicationModal'
import EditApplicationModal from './EditApplicationModal'
import DeleteApplicationModal from './DeleteApplicationModal'

// Build a compact, windowed list of page numbers (with '...' gaps) so the pager
// stays usable even with many pages. Always includes first, last, and a window
// around the current page.
function getPageWindow(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const pages = new Set([1, total, current, current - 1, current + 1])
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

    const result = []
    let prev = 0
    for (const page of sorted) {
        if (page - prev > 1) result.push('...')
        result.push(page)
        prev = page
    }
    return result
}

export default function AdminApplicationsDashboard() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [financingFilter, setFinancingFilter] = useState('all')
    const [sortBy, setSortBy] = useState('submitted_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalApplications, setTotalApplications] = useState(0)
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false)
    const [statusUpdateInfo, setStatusUpdateInfo] = useState(null)
    const [showNewApplicationModal, setShowNewApplicationModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [exporting, setExporting] = useState(false)

    // Export the full application record (all fields) to Excel, honouring the
    // active search/status/financing filters. Fetches as a blob so the httpOnly
    // admin cookie is sent and the download is triggered client-side.
    const handleExport = async () => {
        try {
            setExporting(true)
            const params = new URLSearchParams({
                search: searchTerm,
                status: statusFilter,
                financing_type: financingFilter
            })
            const response = await fetch(`/api/admin/applications/export?${params}`, {
                credentials: 'include'
            })
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.error || 'Export failed')
            }
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `applications-${new Date().toISOString().slice(0, 10)}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            setError(err.message || 'Failed to export applications')
        } finally {
            setExporting(false)
        }
    }

    const fetchApplications = async () => {
        try {
            setLoading(true)
            setError('')
            
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
                search: searchTerm,
                status: statusFilter,
                financing_type: financingFilter,
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
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data && data.data.needs_update > 0) {
                    setStatusUpdateInfo({
                        needsUpdate: data.data.needs_update,
                        applications: data.data.applications_needing_update || []
                    })
                    setShowStatusUpdateModal(true)
                }
            } else {
                console.warn('Status update check failed:', response.status, response.statusText)
            }
        } catch (err) {
            console.error('Error checking status updates:', err)
            // Don't show error to user for background status checks
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
    }, [currentPage, pageSize, searchTerm, statusFilter, financingFilter, sortBy, sortOrder])

    // Reset to the first page whenever filters or page size change.
    useEffect(() => {
        setCurrentPage(1)
    }, [pageSize, searchTerm, statusFilter, financingFilter, sortBy, sortOrder])

    const handleNewApplicationSuccess = (newApplication) => {
        fetchApplications()
        setCurrentPage(1)
    }

    const handleViewApplication = (application) => {
        setSelectedApplication(application)
        setShowViewModal(true)
    }

    const handleEditApplication = (application) => {
        setSelectedApplication(application)
        setShowEditModal(true)
    }

    const handleDeleteApplication = (application) => {
        setSelectedApplication(application)
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = (applicationId) => {
        // This function is called by the modal after successful deletion
        setShowDeleteModal(false)
        setSelectedApplication(null)
        fetchApplications() // Refresh the applications list
    }

    const getApplicationStatusInfo = (application) => {
        // Always use the correct calculated status - there should be only one status
        const correctStatus = getCorrectStatus(application);
        return getStatusInfo(correctStatus);
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
                </div>
                
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-600 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {exporting ? 'Exporting...' : 'Export to Excel'}
                    </button>

                    <button
                        onClick={() => setShowNewApplicationModal(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Application
                    </button>

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
                        value={financingFilter}
                        onChange={(e) => setFinancingFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="all">All Types</option>
                        <option value="business">Business</option>
                        <option value="working_capital">Working Capital</option>
                        <option value="expansion">Expansion</option>
                        <option value="equipment">Equipment</option>
                        <option value="project">Project</option>
                        <option value="real_estate">Real Estate</option>
                        <option value="pos">POS</option>
                        <option value="general">General</option>
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

                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        title="Applications per page"
                    >
                        <option value="10">10 / page</option>
                        <option value="25">25 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                    </select>
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
                                    Financing
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
                                            {application.reference_number && (
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {application.reference_number}
                                                </div>
                                            )}
                                        </td>

                                        {/* Business Information */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {safeTextFormat(application.trade_name, 30)}
                                            </div>
                                            {application.city_of_operation && (
                                                <div className="text-sm text-gray-500">{application.city_of_operation}</div>
                                            )}
                                            {application.sector && (
                                                <div className="text-xs text-gray-400">{application.sector}</div>
                                            )}
                                        </td>

                                        {/* Financing Details */}
                                        <td className="px-6 py-4">
                                            {application.financing_type ? (
                                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full capitalize">
                                                    {application.financing_type.replace(/_/g, ' ')}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                            {application.approximate_financing_amount && (
                                                <div className="text-xs text-gray-500 mt-1">{application.approximate_financing_amount}</div>
                                            )}
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
                                                    onClick={() => handleViewApplication(application)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditApplication(application)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit Application"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteApplication(application)}
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
                {totalApplications > pageSize && (
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
                                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * pageSize, totalApplications)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalApplications}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-3 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Prev
                                    </button>
                                    {getPageWindow(currentPage, totalPages).map((page, idx) => (
                                        page === '...' ? (
                                            <span
                                                key={`ellipsis-${idx}`}
                                                className="relative inline-flex items-center px-4 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-400"
                                            >
                                                …
                                            </span>
                                        ) : (
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
                                        )
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-3 py-2 border text-sm font-medium bg-white border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
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
                                                • {app.trade_name || 'N/A'} (CR: {app.cr_number || 'N/A'})
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

            {/* Modals */}
            {showNewApplicationModal && (
                <NewApplicationModal
                    isOpen={showNewApplicationModal}
                    onClose={() => setShowNewApplicationModal(false)}
                    onSuccess={handleNewApplicationSuccess}
                />
            )}

            {showViewModal && selectedApplication && (
                <ViewApplicationModal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    application={selectedApplication}
                    onRefresh={fetchApplications}
                />
            )}

            {showEditModal && selectedApplication && (
                <EditApplicationModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    application={selectedApplication}
                    onSuccess={fetchApplications}
                />
            )}

            {showDeleteModal && selectedApplication && (
                <DeleteApplicationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    application={selectedApplication}
                    onDelete={handleDeleteConfirm}
                />
            )}
        </div>
    )
}
