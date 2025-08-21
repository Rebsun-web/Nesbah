'use client'

import { useState, useEffect } from 'react'
import { 
    MagnifyingGlassIcon,
    FunnelIcon,
    EyeIcon,
    Cog6ToothIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import NewApplicationModal from './NewApplicationModal'
import ViewApplicationModal from './ViewApplicationModal'
import EditApplicationModal from './EditApplicationModal'
import DeleteApplicationModal from './DeleteApplicationModal'

export default function ApplicationsTable() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('submitted_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const [selectedApplications, setSelectedApplications] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalApplications, setTotalApplications] = useState(0)
    const [showNewApplicationModal, setShowNewApplicationModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState(null)
    const [error, setError] = useState('')

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
            
            const data = await response.json()
            
            if (data.success) {
                setApplications(data.data.applications)
                setTotalPages(data.data.pagination.totalPages)
                setTotalApplications(data.data.pagination.total)
            } else {
                setError(data.error || 'Failed to fetch applications')
            }
        } catch (err) {
            setError('Network error while fetching applications')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchApplications()
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

    const handleNewApplicationSuccess = (newApplication) => {
        // Refresh the applications list
        fetchApplications()
        // Reset to first page
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

    const handleApplicationSaved = (updatedApplication) => {
        // Update the application in the list
        setApplications(prev => 
            prev.map(app => 
                app.application_id === updatedApplication.application_id 
                    ? updatedApplication 
                    : app
            )
        )
        setShowEditModal(false)
        setSelectedApplication(null)
    }

    const handleApplicationDeleted = (applicationId) => {
        // Remove the application from the list
        setApplications(prev => prev.filter(app => app.application_id !== applicationId))
        setShowDeleteModal(false)
        setSelectedApplication(null)
        // Update total count
        setTotalApplications(prev => prev - 1)
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
                icon: ClockIcon
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
                color: 'bg-gray-100 text-gray-800',
                icon: XCircleIcon
            },
            'deal_expired': {
                label: 'Deal Expired',
                color: 'bg-red-100 text-red-800',
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
            },
            'normal': {
                label: 'Normal',
                color: 'bg-green-100 text-green-800'
            }
        }
        return urgencyConfig[urgencyLevel] || {
            label: 'Normal',
            color: 'bg-green-100 text-green-800'
        }
    }

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedApplications(applications.map(app => app.application_id))
        } else {
            setSelectedApplications([])
        }
    }

    const handleSelectApplication = (applicationId, checked) => {
        if (checked) {
            setSelectedApplications([...selectedApplications, applicationId])
        } else {
            setSelectedApplications(selectedApplications.filter(id => id !== applicationId))
        }
    }

    const handleBulkAction = (action) => {
        console.log(`Bulk action: ${action} for applications:`, selectedApplications)
        // TODO: Implement bulk actions
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Applications Management</h3>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Applications Management</h3>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setShowNewApplicationModal(true)}
                                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                New Application
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search applications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="pending_offers">Live Auction</option>
                                <option value="purchased">Purchased</option>
                                <option value="offer_received">Offer Received</option>
                                <option value="completed">Completed</option>
                                <option value="abandoned">Abandoned</option>
                                <option value="deal_expired">Deal Expired</option>
                            </select>
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-')
                                    setSortBy(field)
                                    setSortOrder(order)
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="submitted_at-desc">Newest First</option>
                                <option value="submitted_at-asc">Oldest First</option>
                                <option value="trade_name-asc">Name A-Z</option>
                                <option value="trade_name-desc">Name Z-A</option>
                                <option value="revenue_collected-desc">Revenue High-Low</option>
                                <option value="revenue_collected-asc">Revenue Low-High</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedApplications.length > 0 && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">
                                {selectedApplications.length} application{selectedApplications.length !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleBulkAction('extend')}
                                    className="px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                                >
                                    Extend Deadlines
                                </button>
                                <button
                                    onClick={() => handleBulkAction('abandon')}
                                    className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded hover:bg-red-200"
                                >
                                    Force Abandon
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedApplications.length === applications.length && applications.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Application
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Offers
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="text-gray-500">
                                            <p className="text-lg font-medium">No applications found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((application) => {
                                    const statusInfo = getStatusInfo(application.status)
                                    const urgencyInfo = getUrgencyInfo(application.urgency_level)
                                    const StatusIcon = statusInfo.icon
                                    
                                    return (
                                        <tr key={application.application_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApplications.includes(application.application_id)}
                                                    onChange={(e) => handleSelectApplication(application.application_id, e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {application.trade_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        #{application.application_id}
                                                    </div>
                                                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgencyInfo.color}`}>
                                                        {urgencyInfo.label}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {statusInfo.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(application.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {application.assigned_trade_name ? (
                                                    <div>
                                                        <div className="font-medium">{application.assigned_trade_name}</div>
                                                        <div className="text-xs text-gray-500">{application.assigned_email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {application.offers_count || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                SAR {application.revenue_collected || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewApplication(application)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditApplication(application)}
                                                        className="text-gray-600 hover:text-gray-900"
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
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalApplications)} of {totalApplications} results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Application Modal */}
            <NewApplicationModal
                isOpen={showNewApplicationModal}
                onClose={() => setShowNewApplicationModal(false)}
                onSuccess={handleNewApplicationSuccess}
            />

            {/* View Application Modal */}
            <ViewApplicationModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false)
                    setSelectedApplication(null)
                }}
                applicationId={selectedApplication?.application_id}
            />

            {/* Edit Application Modal */}
            <EditApplicationModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setSelectedApplication(null)
                }}
                application={selectedApplication}
                onSave={handleApplicationSaved}
            />

            {/* Delete Application Modal */}
            <DeleteApplicationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setSelectedApplication(null)
                }}
                application={selectedApplication}
                onDelete={handleApplicationDeleted}
            />
        </>
    )
}
