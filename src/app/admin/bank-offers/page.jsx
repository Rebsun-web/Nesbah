'use client'

import { useState, useEffect } from 'react'
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    EyeIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline'
import AdminNavbar from '@/components/admin/AdminNavbar'
import { NewFooter } from '@/components/NewFooter'
import BankOfferForm from '@/components/admin/BankOfferForm'
import BankOfferDetails from '@/components/admin/BankOfferDetails'

export default function AdminBankOffersPage() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [bankFilter, setBankFilter] = useState('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [banks, setBanks] = useState([])
    const [applications, setApplications] = useState([])

    useEffect(() => {
        fetchOffers()
        fetchBanks()
        fetchApplications()
        
        // Test API directly
        console.log('🧪 Testing bank API directly...')
        fetch('/api/admin/users/bank-users', { credentials: 'include' })
            .then(res => {
                console.log('🧪 Direct API test - Status:', res.status)
                return res.json()
            })
            .then(data => {
                console.log('🧪 Direct API test - Data:', data)
            })
            .catch(err => {
                console.error('🧪 Direct API test - Error:', err)
            })
    }, [])

    const fetchOffers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/bank-offers', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setOffers(data.offers || [])
                } else {
                    setError('Failed to fetch offers')
                }
            } else {
                setError('Failed to fetch offers')
            }
        } catch (err) {
            console.error('Error fetching offers:', err)
            setError('Failed to fetch offers')
        } finally {
            setLoading(false)
        }
    }

    const fetchBanks = async () => {
        try {
            console.log('🏦 Fetching banks from /api/admin/users/bank-users...')
            const response = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            })
            
            console.log('🏦 Response status:', response.status)
            console.log('🏦 Response ok:', response.ok)
            
            if (response.ok) {
                const data = await response.json()
                console.log('🏦 Response data:', data)
                
                if (data.success) {
                    setBanks(data.banks || [])
                    console.log('🏦 Fetched banks:', data.banks)
                    console.log('🏦 Banks count:', data.banks?.length || 0)
                } else {
                    console.error('🏦 API returned success: false:', data.error)
                }
            } else {
                console.error('🏦 Response not ok:', response.status, response.statusText)
                const errorText = await response.text()
                console.error('🏦 Error response body:', errorText)
            }
        } catch (err) {
            console.error('🏦 Error fetching banks:', err)
        }
    }

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/admin/applications', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setApplications(data.applications || [])
                }
            }
        } catch (err) {
            console.error('Error fetching applications:', err)
        }
    }

    const handleDeleteOffer = async (offerId) => {
        if (!confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/bank-offers/${offerId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    alert('Offer deleted successfully')
                    fetchOffers()
                } else {
                    alert('Failed to delete offer: ' + data.message)
                }
            } else {
                alert('Failed to delete offer')
            }
        } catch (err) {
            console.error('Error deleting offer:', err)
            alert('Error deleting offer')
        }
    }

    const handleEditOffer = (offer) => {
        setSelectedOffer(offer)
        setShowEditModal(true)
    }

    const handleViewOffer = (offer) => {
        setSelectedOffer(offer)
        setShowViewModal(true)
    }

    const handleCreateOffer = () => {
        setSelectedOffer(null)
        setShowCreateModal(true)
    }

    const handleOfferSuccess = () => {
        setShowCreateModal(false)
        setShowEditModal(false)
        fetchOffers()
    }

    // Filter offers based on search and filters
    const filteredOffers = offers.filter(offer => {
        const matchesSearch = 
            offer.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.relationship_manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.offer_id?.toString().includes(searchTerm)
        
        const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
        const matchesBank = bankFilter === 'all' || offer.bank_user_id?.toString() === bankFilter

        return matchesSearch && matchesStatus && matchesBank
    })

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800'
            case 'accepted': return 'bg-green-100 text-green-800'
            case 'rejected': return 'bg-red-100 text-red-800'
            case 'expired': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bank offers...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchOffers}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Bank Offers Management</h1>
                            <p className="text-gray-600">Manage all bank offers and financing proposals</p>
                        </div>
                        <button
                            onClick={handleCreateOffer}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create New Offer
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search offers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">All Statuses</option>
                                <option value="submitted">Submitted</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {/* Bank Filter */}
                        <div>
                            <select
                                value={bankFilter}
                                onChange={(e) => setBankFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="all">All Banks</option>
                                {banks.map(bank => (
                                    <option key={bank.user_id} value={bank.user_id}>
                                        {bank.entity_name || bank.contact_person || `Bank ${bank.user_id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Offers Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {filteredOffers.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No bank offers found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Offer Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bank & Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Financial Terms
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status & Dates
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOffers.map((offer) => (
                                        <tr key={offer.offer_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    Offer #{offer.offer_id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Application #{offer.submitted_application_id}
                                                </div>
                                                {offer.bank_name && (
                                                    <div className="text-sm text-gray-500">
                                                        {offer.bank_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {offer.relationship_manager_name && (
                                                    <div className="text-sm text-gray-900">
                                                        {offer.relationship_manager_name}
                                                    </div>
                                                )}
                                                {offer.relationship_manager_phone && (
                                                    <div className="text-sm text-gray-500">
                                                        {offer.relationship_manager_phone}
                                                    </div>
                                                )}
                                                {offer.relationship_manager_email && (
                                                    <div className="text-sm text-gray-500">
                                                        {offer.relationship_manager_email}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {offer.approved_financing_amount && (
                                                    <div className="text-sm text-gray-900">
                                                        SAR {parseFloat(offer.approved_financing_amount).toLocaleString()}
                                                    </div>
                                                )}
                                                {offer.proposed_repayment_period_months && (
                                                    <div className="text-sm text-gray-500">
                                                        {offer.proposed_repayment_period_months} months
                                                    </div>
                                                )}
                                                {offer.interest_rate && (
                                                    <div className="text-sm text-gray-500">
                                                        {offer.interest_rate}% rate
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(offer.status)}`}>
                                                    {offer.status || 'Unknown'}
                                                </span>
                                                {offer.submitted_at && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {new Date(offer.submitted_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewOffer(offer)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditOffer(offer)}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOffer(offer.offer_id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-6 text-sm text-gray-600">
                    Showing {filteredOffers.length} of {offers.length} total offers
                </div>
            </div>

            {/* Create Offer Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Create New Bank Offer</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <BankOfferForm
                                banks={banks}
                                applications={[]}
                                onSubmit={async (formData) => {
                                    try {
                                        console.log('📤 Submitting FormData:', formData)
                                        console.log('📤 FormData entries:')
                                        for (let [key, value] of formData.entries()) {
                                            console.log(`  ${key}:`, value)
                                        }
                                        
                                        console.log('🌐 Sending request to /api/admin/bank-offers...')
                                        const response = await fetch('/api/admin/bank-offers', {
                                            method: 'POST',
                                            credentials: 'include',
                                            body: formData
                                        })
                                        
                                        console.log('📥 Response received:', response.status, response.statusText)
                                        
                                        if (!response.ok) {
                                            const errorText = await response.text()
                                            console.error('❌ Error response body:', errorText)
                                            throw new Error(`HTTP ${response.status}: ${errorText}`)
                                        }
                                        
                                        const data = await response.json()
                                        console.log('✅ Response data:', data)
                                        
                                        if (data.success) {
                                            alert('Bank offer created successfully!')
                                            handleOfferSuccess()
                                        } else {
                                            alert('Failed to create offer: ' + data.error)
                                        }
                                    } catch (error) {
                                        console.error('❌ Error creating offer:', error)
                                        alert('Error creating offer: ' + error.message)
                                    }
                                }}
                                onCancel={() => setShowCreateModal(false)}
                                isEditing={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Offer Modal */}
            {showEditModal && selectedOffer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Edit Bank Offer #{selectedOffer.offer_id}</h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <BankOfferForm
                                offer={selectedOffer}
                                banks={banks}
                                applications={[]}
                                onSubmit={async (formData) => {
                                    try {
                                        const response = await fetch(`/api/admin/bank-offers/${selectedOffer.offer_id}`, {
                                            method: 'PUT',
                                            credentials: 'include',
                                            body: formData
                                        })
                                        
                                        const data = await response.json()
                                        if (data.success) {
                                            alert('Bank offer updated successfully!')
                                            handleOfferSuccess()
                                        } else {
                                            alert('Failed to update offer: ' + data.error)
                                        }
                                    } catch (error) {
                                        console.error('Error updating offer:', error)
                                        alert('Error updating offer')
                                    }
                                }}
                                onCancel={() => setShowEditModal(false)}
                                isEditing={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View Offer Modal */}
            {showViewModal && selectedOffer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">View Bank Offer #{selectedOffer.offer_id}</h3>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <BankOfferDetails
                                offer={selectedOffer}
                                onClose={() => setShowViewModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <NewFooter />
        </div>
    )
}
