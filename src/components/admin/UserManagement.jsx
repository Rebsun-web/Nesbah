'use client'

import { useState, useEffect } from 'react'
import { 
    MagnifyingGlassIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon,
    EyeIcon,
    FunnelIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/solid'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedUserType, setSelectedUserType] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [selectedOfferStatus, setSelectedOfferStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)
    const [selectedUsers, setSelectedUsers] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    
    // Form states
    const [formData, setFormData] = useState({
        user_type: 'business',
        email: '',
        entity_name: '',
        first_name: '',
        last_name: '',
        cr_number: '',
        national_id: '',
        city: '',
        cr_capital: '',
        contact_person: '',
        contact_person_number: '',
        contact_number: '',
        registration_status: 'active'
    })

    const [bulkOperation, setBulkOperation] = useState({
        operation: 'update_status',
        registration_status: 'active'
    })

    const itemsPerPage = 10

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const params = new URLSearchParams({
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage
            })
            
            if (selectedUserType !== 'all') {
                params.append('user_type', selectedUserType)
            }
            
            if (selectedStatus !== 'all') {
                params.append('registration_status', selectedStatus)
            }
            
            if (selectedUserType === 'bank' && selectedOfferStatus !== 'all') {
                params.append('offer_status', selectedOfferStatus)
            }
            
            if (searchTerm) {
                params.append('search', searchTerm)
            }

            const response = await fetch(`/api/admin/users?${params}`)
            const data = await response.json()
            
            if (data.success) {
                setUsers(data.data.users)
                setTotalUsers(data.data.pagination.total)
                setTotalPages(Math.ceil(data.data.pagination.total / itemsPerPage))
            } else {
                setError(data.error || 'Failed to fetch users')
            }
        } catch (err) {
            setError('Network error while fetching users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [currentPage, selectedUserType, selectedStatus, selectedOfferStatus, searchTerm])

    // Reset offer status filter when user type changes
    useEffect(() => {
        if (selectedUserType !== 'bank') {
            setSelectedOfferStatus('all')
        }
    }, [selectedUserType])

    // Reset form
    const resetForm = () => {
        setFormData({
            user_type: 'business',
            email: '',
            entity_name: '',
            first_name: '',
            last_name: '',
            cr_number: '',
            national_id: '',
            city: '',
            cr_capital: '',
            contact_person: '',
            contact_person_number: '',
            contact_number: '',
            registration_status: 'active'
        })
    }

    const resetFilters = () => {
        setSelectedUserType('all')
        setSelectedStatus('all')
        setSelectedOfferStatus('all')
        setSearchTerm('')
        setCurrentPage(1)
        setSelectedUsers([])
    }

    // Create user
    const handleCreateUser = async () => {
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowCreateModal(false)
                resetForm()
                fetchUsers()
                // Show success message
            } else {
                setError(data.error || 'Failed to create user')
            }
        } catch (err) {
            setError('Network error while creating user')
        }
    }

    // Update user
    const handleUpdateUser = async () => {
        try {
            const response = await fetch(`/api/admin/users/${currentUser.user_id}?user_type=${currentUser.user_type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowEditModal(false)
                setCurrentUser(null)
                resetForm()
                fetchUsers()
                // Show success message
            } else {
                setError(data.error || 'Failed to update user')
            }
        } catch (err) {
            setError('Network error while updating user')
        }
    }

    // Delete user
    const handleDeleteUser = async () => {
        try {
            const response = await fetch(`/api/admin/users/${currentUser.user_id}?user_type=${currentUser.user_type}`, {
                method: 'DELETE'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowDeleteModal(false)
                setCurrentUser(null)
                fetchUsers()
                // Show success message
            } else {
                setError(data.error || 'Failed to delete user')
            }
        } catch (err) {
            setError('Network error while deleting user')
        }
    }

    // Bulk operations
    const handleBulkOperation = async () => {
        try {
            const response = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bulkOperation,
                    user_ids: selectedUsers,
                    user_type: selectedUserType === 'all' ? 'business' : selectedUserType
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setShowBulkModal(false)
                setSelectedUsers([])
                setBulkOperation({ operation: 'update_status', registration_status: 'active' })
                fetchUsers()
                // Show success message
            } else {
                setError(data.error || 'Failed to perform bulk operation')
            }
        } catch (err) {
            setError('Network error while performing bulk operation')
        }
    }

    // Handle user selection
    const handleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    // Handle select all
    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users.map(user => user.user_id))
        }
    }

    // Open edit modal
    const openEditModal = (user) => {
        setCurrentUser(user)
        setFormData({
            user_type: user.user_type,
            email: user.email || '',
            entity_name: user.entity_name || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            cr_number: user.cr_number || '',
            national_id: user.national_id || '',
            city: user.city || '',
            cr_capital: user.cr_capital || '',
            contact_person: user.contact_person || '',
            contact_person_number: user.contact_person_number || '',
            contact_number: user.contact_number || '',
            registration_status: user.registration_status || 'active'
        })
        setShowEditModal(true)
    }

    // Open view modal
    const openViewModal = (user) => {
        setCurrentUser(user)
        setShowViewModal(true)
    }

    // Open delete modal
    const openDeleteModal = (user) => {
        setCurrentUser(user)
        setShowDeleteModal(true)
    }

    // Get status badge
    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
            suspended: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon },
            inactive: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon }
        }
        
        const config = statusConfig[status] || statusConfig.inactive
        const Icon = config.icon
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </span>
        )
    }

    // Get user type badge
    const getUserTypeBadge = (type) => {
        const typeConfig = {
            business: { color: 'bg-blue-100 text-blue-800', label: 'Business' },
            individual: { color: 'bg-purple-100 text-purple-800', label: 'Individual' },
            bank: { color: 'bg-green-100 text-green-800', label: 'Bank' }
        }
        
        const config = typeConfig[type] || typeConfig.business
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        )
    }

    if (loading && users.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                        <p className="text-gray-600">Manage business, individual, and bank users</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            disabled={selectedUsers.length === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Bulk Actions ({selectedUsers.length})
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <PlusIcon className="w-4 h-4 mr-2 inline" />
                            Add User
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <FunnelIcon className="w-4 h-4 mr-2 inline" />
                        Filters
                        {showFilters ? (
                            <ChevronUpIcon className="w-4 h-4 ml-2 inline" />
                        ) : (
                            <ChevronDownIcon className="w-4 h-4 ml-2 inline" />
                        )}
                    </button>
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ml-2"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Advanced filters */}
                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                            <select
                                value={selectedUserType}
                                onChange={(e) => setSelectedUserType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="business">Business</option>
                                <option value="individual">Individual</option>
                                <option value="bank">Bank</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        {selectedUserType === 'bank' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Status</label>
                                <select
                                    value={selectedOfferStatus || 'all'}
                                    onChange={(e) => setSelectedOfferStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Offer Statuses</option>
                                    <option value="has_offers">Has Sent Offers</option>
                                    <option value="no_offers">No Offers Sent</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Activity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.user_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.user_id)}
                                            onChange={() => handleUserSelection(user.user_id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.entity_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getUserTypeBadge(user.user_type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(user.registration_status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.user_type === 'bank' ? (
                                            <div>
                                                <div className="font-medium">
                                                    {user.has_sent_offer ? 'Sent Offer' : 'No Offers'}
                                                </div>
                                                {user.has_sent_offer && (
                                                    <div className="text-xs text-gray-500">
                                                        {user.total_offers_sent} offer{user.total_offers_sent !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium">
                                                    {user.has_sent_application ? 'Sent Application' : 'No Application'}
                                                </div>
                                                {user.has_sent_application && user.last_application_date && (
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(user.last_application_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openViewModal(user)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(user)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
                                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-medium">
                                    {Math.min(currentPage * itemsPerPage, totalUsers)}
                                </span>{' '}
                                of <span className="font-medium">{totalUsers}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            currentPage === i + 1
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <UserFormModal
                    title="Create New User"
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateUser}
                    onClose={() => {
                        setShowCreateModal(false)
                        resetForm()
                    }}
                />
            )}

            {/* Edit User Modal */}
            {showEditModal && currentUser && (
                <UserFormModal
                    title="Edit User"
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleUpdateUser}
                    onClose={() => {
                        setShowEditModal(false)
                        setCurrentUser(null)
                        resetForm()
                    }}
                />
            )}

            {/* View User Modal */}
            {showViewModal && currentUser && (
                <UserViewModal
                    user={currentUser}
                    onClose={() => {
                        setShowViewModal(false)
                        setCurrentUser(null)
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && currentUser && (
                <DeleteConfirmationModal
                    user={currentUser}
                    onConfirm={handleDeleteUser}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setCurrentUser(null)
                    }}
                />
            )}

            {/* Bulk Operations Modal */}
            {showBulkModal && (
                <BulkOperationsModal
                    operation={bulkOperation}
                    setOperation={setBulkOperation}
                    selectedCount={selectedUsers.length}
                    onConfirm={handleBulkOperation}
                    onClose={() => {
                        setShowBulkModal(false)
                        setBulkOperation({ operation: 'update_status', registration_status: 'active' })
                    }}
                />
            )}
        </div>
    )
}

// User Form Modal Component
function UserFormModal({ title, formData, setFormData, onSubmit, onClose }) {
    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit()
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mx-4 max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Basic Information Section */}
                        <div className="border-b pb-4">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                                    <select
                                        value={formData.user_type}
                                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="business">Business</option>
                                        <option value="individual">Individual</option>
                                        <option value="bank">Bank</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.registration_status}
                                        onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Business User Specific Fields */}
                        {formData.user_type === 'business' && (
                            <>
                                {/* Business Basic Information */}
                                <div className="border-b pb-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Business Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name</label>
                                            <input
                                                type="text"
                                                value={formData.entity_name}
                                                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CR Number</label>
                                            <input
                                                type="text"
                                                value={formData.cr_number}
                                                onChange={(e) => setFormData({ ...formData, cr_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CR National Number</label>
                                            <input
                                                type="text"
                                                value={formData.cr_national_number}
                                                onChange={(e) => setFormData({ ...formData, cr_national_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                                            <input
                                                type="text"
                                                value={formData.sector}
                                                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                            <input
                                                type="text"
                                                value={formData.contact_person}
                                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                            <input
                                                type="text"
                                                value={formData.contact_person_number}
                                                onChange={(e) => setFormData({ ...formData, contact_person_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">E-commerce</label>
                                            <select
                                                value={formData.has_ecommerce ? 'true' : 'false'}
                                                onChange={(e) => setFormData({ ...formData, has_ecommerce: e.target.value === 'true' })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Wathiq API Registration Details */}
                                <div className="border-b pb-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Registration Details (Wathiq API)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
                                            <input
                                                type="text"
                                                value={formData.form_name}
                                                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                                            <input
                                                type="text"
                                                value={formData.issue_date_gregorian}
                                                onChange={(e) => setFormData({ ...formData, issue_date_gregorian: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Date</label>
                                            <input
                                                type="text"
                                                value={formData.confirmation_date_gregorian}
                                                onChange={(e) => setFormData({ ...formData, confirmation_date_gregorian: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Management Structure</label>
                                            <input
                                                type="text"
                                                value={formData.management_structure}
                                                onChange={(e) => setFormData({ ...formData, management_structure: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                                            <input
                                                type="url"
                                                value={formData.store_url}
                                                onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div className="border-b pb-4">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CR Capital (SAR)</label>
                                            <input
                                                type="number"
                                                value={formData.cr_capital}
                                                onChange={(e) => setFormData({ ...formData, cr_capital: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Capital (SAR)</label>
                                            <input
                                                type="number"
                                                value={formData.cash_capital}
                                                onChange={(e) => setFormData({ ...formData, cash_capital: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">In-Kind Capital (SAR)</label>
                                            <input
                                                type="number"
                                                value={formData.in_kind_capital}
                                                onChange={(e) => setFormData({ ...formData, in_kind_capital: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Individual User Specific Fields */}
                        {formData.user_type === 'individual' && (
                            <div className="border-b pb-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Individual Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                                        <input
                                            type="text"
                                            value={formData.national_id}
                                            onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contact_number}
                                            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bank User Specific Fields */}
                        {formData.user_type === 'bank' && (
                            <div className="border-b pb-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Bank Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                                        <input
                                            type="text"
                                            value={formData.entity_name}
                                            onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (SAR)</label>
                                        <input
                                            type="number"
                                            value={formData.credit_limit}
                                            onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="10000.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={formData.contact_person}
                                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contact_person_number}
                                            onChange={(e) => setFormData({ ...formData, contact_person_number: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// User View Modal Component
function UserViewModal({ user, onClose }) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mx-4 max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
                    
                    {/* Basic Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <p className="text-sm text-gray-900">{user.entity_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="text-sm text-gray-900">{user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <p className="text-sm text-gray-900 capitalize">{user.user_type}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <p className="text-sm text-gray-900 capitalize">{user.registration_status}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sent Application</label>
                                <p className="text-sm text-gray-900">{user.has_sent_application ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Created</label>
                                <p className="text-sm text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Business User Specific Fields */}
                        {user.user_type === 'business' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                    <p className="text-sm text-gray-900">{user.cr_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR National Number</label>
                                    <p className="text-sm text-gray-900">{user.cr_national_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sector</label>
                                    <p className="text-sm text-gray-900">{user.sector || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <p className="text-sm text-gray-900">{user.city || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <p className="text-sm text-gray-900">{user.address || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">E-commerce</label>
                                    <p className="text-sm text-gray-900">{user.has_ecommerce ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        )}

                        {/* Bank User Specific Fields */}
                        {user.user_type === 'bank' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                                    <p className="text-sm text-gray-900">SAR {user.credit_limit?.toLocaleString() || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                    <p className="text-sm text-gray-900">{user.contact_person || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <p className="text-sm text-gray-900">{user.contact_person_number || 'N/A'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extended Business Information (Wathiq API Fields) */}
                    {user.user_type === 'business' && (
                        <div className="border-t pt-6 mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Business Registration Details (Wathiq API)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Form Name</label>
                                    <p className="text-sm text-gray-900">{user.form_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                    <p className="text-sm text-gray-900">{user.issue_date_gregorian || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirmation Date</label>
                                    <p className="text-sm text-gray-900">{user.confirmation_date_gregorian || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Management Structure</label>
                                    <p className="text-sm text-gray-900">{user.management_structure || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Store URL</label>
                                    <p className="text-sm text-gray-900">
                                        {user.store_url ? (
                                            <a href={user.store_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                {user.store_url}
                                            </a>
                                        ) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                    <p className="text-sm text-gray-900">{user.contact_person || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <p className="text-sm text-gray-900">{user.contact_person_number || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Information */}
                    {user.user_type === 'business' && (
                        <div className="border-t pt-6 mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR Capital</label>
                                    <p className="text-sm text-gray-900">SAR {user.cr_capital?.toLocaleString() || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cash Capital</label>
                                    <p className="text-sm text-gray-900">SAR {user.cash_capital?.toLocaleString() || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">In-Kind Capital</label>
                                    <p className="text-sm text-gray-900">SAR {user.in_kind_capital?.toLocaleString() || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Management Information */}
                    {user.user_type === 'business' && user.management_managers && (
                        <div className="border-t pt-6 mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Management Team</h4>
                            <div className="space-y-2">
                                {Array.isArray(user.management_managers) ? (
                                    user.management_managers.map((manager, index) => (
                                        <div key={index} className="flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            <span className="text-sm text-gray-900">{manager}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No management information available</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Information */}
                    {user.user_type === 'business' && user.contact_info && (
                        <div className="border-t pt-6 mb-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.contact_info.phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <p className="text-sm text-gray-900">{user.contact_info.phone}</p>
                                    </div>
                                )}
                                {user.contact_info.email && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Business Email</label>
                                        <p className="text-sm text-gray-900">{user.contact_info.email}</p>
                                    </div>
                                )}
                                {user.contact_info.website && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Website</label>
                                        <p className="text-sm text-gray-900">
                                            <a href={user.contact_info.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                {user.contact_info.website}
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ user, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white mx-4">
                <div className="mt-3">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 text-center mt-4">Delete User</h3>
                    <p className="text-sm text-gray-500 text-center mt-2">
                        Are you sure you want to delete {user.entity_name}? This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-2 pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Bulk Operations Modal Component
function BulkOperationsModal({ operation, setOperation, selectedCount, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white mx-4">
                <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Operations</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Perform operations on {selectedCount} selected users
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                            <select
                                value={operation.operation}
                                onChange={(e) => setOperation({ ...operation, operation: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="update_status">Update Status</option>
                                <option value="delete">Delete Users</option>
                            </select>
                        </div>

                        {operation.operation === 'update_status' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                <select
                                    value={operation.registration_status}
                                    onChange={(e) => setOperation({ ...operation, registration_status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        )}

                        {operation.operation === 'delete' && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-700">
                                    ⚠️ This will permanently delete {selectedCount} users. This action cannot be undone.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                                operation.operation === 'delete' 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {operation.operation === 'delete' ? 'Delete' : 'Update'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
