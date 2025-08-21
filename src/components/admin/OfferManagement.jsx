'use client'

import { useState, useEffect } from 'react'
import { 
    MagnifyingGlassIcon, 
    PlusIcon, 
    EyeIcon,
    FunnelIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'

export default function OfferManagement() {
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalApplications, setTotalApplications] = useState(0)
    const [selectedApplications, setSelectedApplications] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    
    // Modal states
    const [showViewModal, setShowViewModal] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [currentApplication, setCurrentApplication] = useState(null)
    
    // Offer management states
    const [showOffersTable, setShowOffersTable] = useState(false)
    const [allOffers, setAllOffers] = useState([])
    const [loadingAllOffers, setLoadingAllOffers] = useState(false)
    const [currentOffersPage, setCurrentOffersPage] = useState(1)
    const [totalOffersPages, setTotalOffersPages] = useState(1)
    const [totalOffers, setTotalOffers] = useState(0)
    const [showEditOfferModal, setShowEditOfferModal] = useState(false)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [currentOffer, setCurrentOffer] = useState(null)
    const [editOfferForm, setEditOfferForm] = useState({
        device_setup_fee: '',
        mada_transaction_fee: '',
        visa_mc_transaction_fee: '',
        mada_settlement_time: '',
        offer_comment: '',
        admin_notes: ''
    })
    
    // Offer form state
    const [offerForm, setOfferForm] = useState({
        device_setup_fee: '',
        mada_transaction_fee: '',
        visa_mc_transaction_fee: '',
        mada_settlement_time: '',
        offer_comment: '',
        admin_notes: ''
    })
    
    // Bank selection state
    const [availableBanks, setAvailableBanks] = useState([])
    const [selectedBankId, setSelectedBankId] = useState('')
    const [loadingBanks, setLoadingBanks] = useState(false)
    
    // Fetch existing offers for an application
    const [existingOffers, setExistingOffers] = useState([])
    const [loadingOffers, setLoadingOffers] = useState(false)
    
    const fetchExistingOffers = async (applicationId) => {
        if (!applicationId) return
        
        try {
            setLoadingOffers(true)
            const response = await fetch(`/api/admin/offers?application_id=${applicationId}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setExistingOffers(data.offers || [])
            } else {
                console.error('Failed to fetch existing offers:', data.error)
                setExistingOffers([])
            }
        } catch (err) {
            console.error('Error fetching existing offers:', err)
            setExistingOffers([])
        } finally {
            setLoadingOffers(false)
        }
    }

    // Fetch all offers for management
    const fetchAllOffers = async () => {
        try {
            setLoadingAllOffers(true)
            const params = new URLSearchParams({
                limit: itemsPerPage,
                offset: (currentOffersPage - 1) * itemsPerPage
            })
            
            const response = await fetch(`/api/admin/offers/all?${params}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                console.log('🔍 Fetched offers:', data.offers)
                setAllOffers(data.offers || [])
                setTotalOffers(data.pagination?.total || 0)
                setTotalOffersPages(data.pagination?.pages || 1)
            } else {
                console.error('Failed to fetch all offers:', data.error)
                setAllOffers([])
            }
        } catch (err) {
            console.error('Error fetching all offers:', err)
            setAllOffers([])
        } finally {
            setLoadingAllOffers(false)
        }
    }

    // Open edit offer modal
    const openEditOfferModal = (offer) => {
        console.log('🔍 Opening edit modal for offer:', offer)
        setCurrentOffer(offer)
        setEditOfferForm({
            device_setup_fee: offer.offer_device_setup_fee?.toString() || '',
            mada_transaction_fee: offer.offer_transaction_fee_mada?.toString() || '',
            visa_mc_transaction_fee: offer.offer_transaction_fee_visa_mc?.toString() || '',
            mada_settlement_time: offer.offer_settlement_time_mada?.toString() || '',
            offer_comment: offer.offer_comment || '',
            admin_notes: offer.admin_notes || ''
        })
        setShowEditOfferModal(true)
    }

    // Handle edit offer submission
    const handleEditOffer = async () => {
        try {
            const response = await fetch(`/api/admin/offers/${currentOffer.offer_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(editOfferForm)
            })

            const data = await response.json()

            if (data.success) {
                setShowEditOfferModal(false)
                fetchAllOffers() // Refresh the offers list
                // TODO: Show success message
            } else {
                setError(data.error || 'Failed to update offer')
            }
        } catch (err) {
            setError('Network error while updating offer')
        }
    }

    // Handle offer deletion
    const handleDeleteOffer = async () => {
        try {
            const response = await fetch(`/api/admin/offers/${currentOffer.offer_id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await response.json()

            if (data.success) {
                setShowDeleteConfirmModal(false)
                fetchAllOffers() // Refresh the offers list
                // TODO: Show success message
            } else {
                setError(data.error || 'Failed to delete offer')
            }
        } catch (err) {
            setError('Network error while deleting offer')
        }
    }

    // Open delete confirmation modal
    const openDeleteConfirmModal = (offer) => {
        console.log('🔍 Opening delete modal for offer:', offer)
        setCurrentOffer(offer)
        setShowDeleteConfirmModal(true)
    }

    const itemsPerPage = 10

    // Fetch applications available for offers
    const fetchApplications = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const params = new URLSearchParams({
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                status: 'available_for_offers' // Special filter for purchased/live auction apps
            })
            
            if (selectedStatus !== 'all') {
                params.append('status_filter', selectedStatus)
            }
            
            if (searchTerm) {
                params.append('search', searchTerm)
            }

            const response = await fetch(`/api/admin/applications/available-for-offers?${params}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setApplications(data.data.applications)
                setTotalApplications(data.data.pagination.total)
                setTotalPages(Math.ceil(data.data.pagination.total / itemsPerPage))
            } else {
                setError(data.error || 'Failed to fetch applications')
            }
        } catch (err) {
            setError('Network error while fetching applications')
        } finally {
            setLoading(false)
        }
    }

    // Fetch available bank users
    const fetchAvailableBanks = async () => {
        try {
            setLoadingBanks(true)
            const response = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            })
            const data = await response.json()
            
            console.log('🔍 Bank users API response:', data)
            
            if (data.success) {
                setAvailableBanks(data.banks)
                console.log('🔍 Available banks set:', data.banks)
                // Set the first bank as default if none selected
                if (data.banks.length > 0 && !selectedBankId) {
                    setSelectedBankId(data.banks[0].user_id.toString())
                    console.log('🔍 Default bank selected:', data.banks[0].user_id)
                }
            } else {
                console.error('Failed to fetch banks:', data.error)
            }
        } catch (err) {
            console.error('Error fetching banks:', err)
        } finally {
            setLoadingBanks(false)
        }
    }

    useEffect(() => {
        fetchApplications()
        fetchAvailableBanks() // Fetch banks when the component mounts
    }, [currentPage, selectedStatus, searchTerm])

    useEffect(() => {
        if (showOffersTable) {
            fetchAllOffers() // Fetch all offers when the offers tab is active
        }
    }, [currentOffersPage, showOffersTable])

    // Reset offer form
    const resetOfferForm = () => {
        setOfferForm({
            device_setup_fee: '',
            mada_transaction_fee: '',
            visa_mc_transaction_fee: '',
            mada_settlement_time: '',
            offer_comment: '',
            admin_notes: ''
        })
    }

    // Open view modal
    const openViewModal = (application) => {
        setCurrentApplication(application)
        setShowViewModal(true)
    }

    // Open offer modal
    const openOfferModal = (application) => {
        setCurrentApplication(application)
        setShowOfferModal(true)
        resetOfferForm()
        fetchExistingOffers(application.application_id) // Fetch existing offers when opening offer modal
    }

    // Handle offer submission
    const handleSubmitOffer = async () => {
        try {
            if (!selectedBankId) {
                setError('Please select a bank to submit the offer')
                return
            }

            const response = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...offerForm,
                    application_id: currentApplication.application_id,
                    bank_user_id: parseInt(selectedBankId)
                })
            })

            const data = await response.json()

            if (data.success) {
                setShowOfferModal(false)
                resetOfferForm()
                fetchApplications() // Refresh the list
                // TODO: Show success message
            } else {
                setError(data.error || 'Failed to submit offer')
            }
        } catch (err) {
            setError('Network error while submitting offer')
        }
    }

    // Handle input change
    const handleInputChange = (field, value) => {
        setOfferForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Handle edit form input change
    const handleEditInputChange = (field, value) => {
        setEditOfferForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Handle select all
    const handleSelectAll = () => {
        if (selectedApplications.length === applications.length) {
            setSelectedApplications([])
        } else {
            setSelectedApplications(applications.map(app => app.id))
        }
    }

    // Handle application selection
    const handleApplicationSelection = (applicationId) => {
        setSelectedApplications(prev => 
            prev.includes(applicationId) 
                ? prev.filter(id => id !== applicationId)
                : [...prev, applicationId]
        )
    }

    // Get status badge
    const getStatusBadge = (status, purchasesCount = 0) => {
        const statusConfig = {
            'pending_offers': {
                label: purchasesCount > 0 ? `Live Auction (${purchasesCount} purchased)` : 'Live Auction',
                color: purchasesCount > 0 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800',
                icon: ClockIcon
            },
            'purchased': {
                label: 'Purchased',
                color: 'bg-purple-100 text-purple-800',
                icon: CheckCircleIcon
            }
        }
        
        const config = statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            icon: ClockIcon
        }
        
        const IconComponent = config.icon
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        )
    }

    // Get urgency badge
    const getUrgencyBadge = (urgencyLevel) => {
        const urgencyConfig = {
            'auction_ending_soon': {
                label: 'Ending Soon',
                color: 'bg-orange-100 text-orange-800'
            },
            'selection_ending_soon': {
                label: 'Selection Ending',
                color: 'bg-red-100 text-red-800'
            },
            'normal': {
                label: 'Normal',
                color: 'bg-green-100 text-green-800'
            }
        }
        
        const config = urgencyConfig[urgencyLevel] || urgencyConfig.normal
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        )
    }

    // Get auction time remaining
    const getAuctionTimeRemaining = (auctionEndTime) => {
        if (!auctionEndTime) return null;
        
        const now = new Date();
        const endTime = new Date(auctionEndTime);
        const timeRemaining = endTime - now;
        
        if (timeRemaining <= 0) {
            return 'Auction ended';
        }
        
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m remaining`;
    }

    if (loading) {
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
        <div className="p-6">

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setShowOffersTable(false)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            !showOffersTable 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Applications
                    </button>
                    <button
                        onClick={() => setShowOffersTable(true)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            showOffersTable 
                                ? 'border-blue-500 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        All Offers
                    </button>
                </nav>
            </div>

            {!showOffersTable ? (
                // Applications Management Section
                <div>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">Offer Management</h2>
                                <p className="text-sm text-gray-500">
                                    Applications with status "purchased" available for banks to propose offers
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <FunnelIcon className="w-4 h-4 mr-2" />
                                    Filters
                                    {showFilters ? (
                                        <ChevronUpIcon className="w-4 h-4 ml-2" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Purchased Applications</option>
                                        <option value="purchased">Purchased Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by business name, CR number..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={fetchApplications}
                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Apply Filters
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedApplications.length === applications.length}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Business
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Urgency
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Offers
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchases
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Auction Ends
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                                                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchased Applications</h3>
                                                <p className="text-sm text-gray-500">
                                                    There are currently no applications with status "purchased". Applications will appear here once they are purchased by banks.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((application) => (
                                        <tr key={application.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApplications.includes(application.id)}
                                                    onChange={() => handleApplicationSelection(application.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {application.trade_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        CR: {application.cr_number} • {application.city}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(application.status, application.purchases_count)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getUrgencyBadge(application.urgency_level)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {application.offers_count || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {application.purchases_count || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getAuctionTimeRemaining(application.auction_end_time)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(application.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => openViewModal(application)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openOfferModal(application)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalApplications)} of {totalApplications} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-2 text-sm text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Application Modal */}
                    {showViewModal && currentApplication && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Application Details - {currentApplication.trade_name}
                                    </h3>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <p className="mt-1 text-sm text-gray-900">{getStatusBadge(currentApplication.status, currentApplication.purchases_count)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                            <p className="mt-1 text-sm text-gray-900">{currentApplication.cr_number}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">City</label>
                                            <p className="mt-1 text-sm text-gray-900">{currentApplication.city}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Revenue Collected</label>
                                            <p className="mt-1 text-sm text-gray-900">SAR {parseFloat(currentApplication.revenue_collected || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Purchases Count</label>
                                            <p className="mt-1 text-sm text-gray-900">{currentApplication.purchases_count || 0} banks</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Offers Count</label>
                                            <p className="mt-1 text-sm text-gray-900">{currentApplication.offers_count || 0} offers</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Auction End Time</label>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {currentApplication.auction_end_time ? 
                                                    `${new Date(currentApplication.auction_end_time).toLocaleString()} (${getAuctionTimeRemaining(currentApplication.auction_end_time)})` : 
                                                    'No auction end time set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {currentApplication.purchases_count > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Purchased By Banks</label>
                                            <div className="mt-1 text-sm text-gray-900">
                                                {currentApplication.purchased_by_banks && currentApplication.purchased_by_banks.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {currentApplication.purchased_by_banks.map((bankId, index) => (
                                                            <div key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-1">
                                                                Bank ID: {bankId}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">No purchase information available</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                        <p className="mt-1 text-sm text-gray-900">{currentApplication.contact_person || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                                        <p className="mt-1 text-sm text-gray-900">{currentApplication.notes || 'No notes available'}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowViewModal(false)
                                            openOfferModal(currentApplication)
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Propose Offer
                                    </button>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Propose Offer Modal */}
                    {showOfferModal && currentApplication && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Propose Offer - {currentApplication.trade_name}
                                    </h3>
                                    <button
                                        onClick={() => setShowOfferModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <form onSubmit={(e) => { e.preventDefault(); handleSubmitOffer(); }} className="space-y-4">
                                    {/* Bank Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Bank to Submit Offer
                                        </label>
                                        {loadingBanks ? (
                                            <div className="text-sm text-gray-500">Loading banks...</div>
                                        ) : (
                                            <select
                                                value={selectedBankId}
                                                onChange={(e) => setSelectedBankId(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select a bank...</option>
                                                {availableBanks.map((bank) => (
                                                    <option key={bank.user_id} value={bank.user_id}>
                                                        {bank.email}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {availableBanks.length === 0 && !loadingBanks && (
                                            <p className="mt-1 text-sm text-red-600">No bank users available</p>
                                        )}
                                    </div>

                                    {/* Existing Offers Section */}
                                    {existingOffers.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Existing Offers ({existingOffers.length})
                                            </h4>
                                            {loadingOffers ? (
                                                <div className="text-sm text-gray-500">Loading existing offers...</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {existingOffers.map((offer) => (
                                                        <div key={offer.offer_id} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium">
                                                                    {offer.bank_name || offer.bank_contact_person || offer.email}
                                                                </span>
                                                                <span className="text-gray-500">({offer.bank_contact_email || offer.email})</span>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                offer.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                                                offer.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                                                offer.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {offer.status}
                                                            </span>
                                                            <button
                                                                onClick={() => openEditOfferModal(offer)}
                                                                className="text-blue-600 hover:text-blue-900 ml-2"
                                                            >
                                                                <EyeIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteConfirmModal(offer)}
                                                                className="text-red-600 hover:text-red-900 ml-2"
                                                            >
                                                                <XCircleIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Device Setup Fee (SAR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={offerForm.device_setup_fee}
                                                onChange={(e) => handleInputChange('device_setup_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Mada Transaction Fee (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={offerForm.mada_transaction_fee}
                                                onChange={(e) => handleInputChange('mada_transaction_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Visa/MC Transaction Fee (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={offerForm.visa_mc_transaction_fee}
                                                onChange={(e) => handleInputChange('visa_mc_transaction_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Mada Settlement Time (hours)
                                                <span className="text-xs text-gray-500 ml-1">(Time to receive payment)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={offerForm.mada_settlement_time}
                                                onChange={(e) => handleInputChange('mada_settlement_time', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="24"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Number of hours it takes for Mada payments to be settled to the business account
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Offer Comment</label>
                                        <textarea
                                            value={offerForm.offer_comment}
                                            onChange={(e) => handleInputChange('offer_comment', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Additional details about your offer..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                                        <textarea
                                            value={offerForm.admin_notes}
                                            onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Internal notes..."
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowOfferModal(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Submit Offer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Offer Modal */}
                    {showEditOfferModal && currentOffer && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Edit Offer - {currentOffer.bank_name || currentOffer.bank_contact_person || currentOffer.email}
                                    </h3>
                                    <button
                                        onClick={() => setShowEditOfferModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <form onSubmit={(e) => { e.preventDefault(); handleEditOffer(); }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Device Setup Fee (SAR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editOfferForm.device_setup_fee}
                                                onChange={(e) => handleEditInputChange('device_setup_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Mada Transaction Fee (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editOfferForm.mada_transaction_fee}
                                                onChange={(e) => handleEditInputChange('mada_transaction_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Visa/MC Transaction Fee (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editOfferForm.visa_mc_transaction_fee}
                                                onChange={(e) => handleEditInputChange('visa_mc_transaction_fee', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Mada Settlement Time (hours)
                                                <span className="text-xs text-gray-500 ml-1">(Time to receive payment)</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={editOfferForm.mada_settlement_time}
                                                onChange={(e) => handleEditInputChange('mada_settlement_time', e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="24"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Number of hours it takes for Mada payments to be settled to the business account
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Offer Comment</label>
                                        <textarea
                                            value={editOfferForm.offer_comment}
                                            onChange={(e) => handleEditInputChange('offer_comment', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Additional details about your offer..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                                        <textarea
                                            value={editOfferForm.admin_notes}
                                            onChange={(e) => handleEditInputChange('admin_notes', e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Internal notes..."
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditOfferModal(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirmModal && currentOffer && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Confirm Deletion - Offer from {currentOffer.bank_name || currentOffer.bank_contact_person || currentOffer.email}
                                    </h3>
                                    <button
                                        onClick={() => setShowDeleteConfirmModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <p className="text-sm text-gray-700 mb-4">
                                    Are you sure you want to delete this offer? This action cannot be undone.
                                </p>
                                
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirmModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteOffer}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                    >
                                        Delete Offer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // All Offers Management Section
                <div>
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">All Offers</h2>
                                <p className="text-sm text-gray-500">
                                    View and manage all submitted offers
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <FunnelIcon className="w-4 h-4 mr-2" />
                                    Filters
                                    {showFilters ? (
                                        <ChevronUpIcon className="w-4 h-4 ml-2" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search by bank name, CR number..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={fetchAllOffers}
                                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Offers Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedApplications.length === applications.length}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Application
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Offer Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allOffers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                                                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Offers Being Made</h3>
                                                <p className="text-sm text-gray-500">
                                                    There are currently no offers in the system. Offers will appear here once banks submit them for applications.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    allOffers.map((offer) => (
                                        <tr key={offer.offer_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedApplications.includes(offer.application_id)}
                                                    onChange={() => handleApplicationSelection(offer.application_id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {offer.bank_name || offer.bank_contact_person || offer.bank_email}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {offer.bank_email || offer.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {offer.application_trade_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        CR: {offer.application_cr_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    offer.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                                    offer.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                                    offer.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {offer.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>Device Setup Fee: SAR {parseFloat(offer.offer_device_setup_fee || 0).toFixed(2)}</div>
                                                <div>Mada Fee: {parseFloat(offer.offer_transaction_fee_mada || 0).toFixed(2)}%</div>
                                                <div>Visa/MC Fee: {parseFloat(offer.offer_transaction_fee_visa_mc || 0).toFixed(2)}%</div>
                                                <div>Settlement Time: {offer.offer_settlement_time_mada} hours</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            console.log('🔍 Edit button clicked for offer:', offer.offer_id)
                                                            openEditOfferModal(offer)
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            console.log('🔍 Delete button clicked for offer:', offer.offer_id)
                                                            openDeleteConfirmModal(offer)
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalOffersPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((currentOffersPage - 1) * itemsPerPage) + 1} to {Math.min(currentOffersPage * itemsPerPage, totalOffers)} of {totalOffers} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentOffersPage(currentOffersPage - 1)}
                                        disabled={currentOffersPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-2 text-sm text-gray-700">
                                        Page {currentOffersPage} of {totalOffersPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentOffersPage(currentOffersPage + 1)}
                                        disabled={currentOffersPage === totalOffersPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Offer Modal */}
            {showEditOfferModal && currentOffer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Edit Offer - {currentOffer.bank_name || currentOffer.bank_contact_person || currentOffer.email}
                            </h3>
                            <button
                                onClick={() => setShowEditOfferModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleEditOffer(); }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device Setup Fee (SAR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editOfferForm.device_setup_fee}
                                        onChange={(e) => handleEditInputChange('device_setup_fee', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mada Transaction Fee (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editOfferForm.mada_transaction_fee}
                                        onChange={(e) => handleEditInputChange('mada_transaction_fee', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Visa/MC Transaction Fee (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editOfferForm.visa_mc_transaction_fee}
                                        onChange={(e) => handleEditInputChange('visa_mc_transaction_fee', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mada Settlement Time (hours)
                                        <span className="text-xs text-gray-500 ml-1">(Time to receive payment)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={editOfferForm.mada_settlement_time}
                                        onChange={(e) => handleEditInputChange('mada_settlement_time', e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="24"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Number of hours it takes for Mada payments to be settled to the business account
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Offer Comment</label>
                                <textarea
                                    value={editOfferForm.offer_comment}
                                    onChange={(e) => handleEditInputChange('offer_comment', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Additional details about your offer..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                                <textarea
                                    value={editOfferForm.admin_notes}
                                    onChange={(e) => handleEditInputChange('admin_notes', e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Internal notes..."
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditOfferModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmModal && currentOffer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Confirm Deletion - Offer from {currentOffer.bank_name || currentOffer.bank_contact_person || currentOffer.email}
                            </h3>
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">
                            Are you sure you want to delete this offer? This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteOffer}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete Offer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
