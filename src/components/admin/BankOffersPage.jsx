'use client'

import { useState, useEffect } from 'react'
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    EyeIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import BankOfferForm from './BankOfferForm'
import BankOfferDetails from './BankOfferDetails'
import BankOfferEditForm from './BankOfferEditForm'

export default function BankOffersPage() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
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
            const response = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setBanks(data.banks || [])
                }
            }
        } catch (err) {
            console.error('Error fetching banks:', err)
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

    // Filter offers based on search only
    const filteredOffers = offers.filter(offer => {
        const matchesSearch = !searchTerm || 
            offer.offer_id?.toString().includes(searchTerm) ||
            offer.bank_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.bank_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.relationship_manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.approved_financing_amount?.toString().includes(searchTerm) ||
            offer.business_name?.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading offers...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                    onClick={fetchOffers}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by bank name, email, offer ID, or business name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Create Button */}
                    <div>
                        <button
                            onClick={handleCreateOffer}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create New Offer
                        </button>
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
                                            {offer.bank_email && (
                                                <div className="text-sm text-gray-500">
                                                    {offer.bank_email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {offer.bank_entity_name || 'Unknown Bank'}
                                            </div>
                                            {offer.bank_email && (
                                                <div className="text-sm text-gray-500">
                                                    {offer.bank_email}
                                                </div>
                                            )}
                                            {offer.relationship_manager_name && (
                                                <div className="text-sm text-gray-600">
                                                    RM: {offer.relationship_manager_name}
                                                </div>
                                            )}
                                            {offer.relationship_manager_phone && (
                                                <div className="text-sm text-gray-500">
                                                    {offer.relationship_manager_phone}
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
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
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
            <div className="text-sm text-gray-600">
                Showing {filteredOffers.length} of {offers.length} total offers
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
                                applications={applications}
                                onSubmit={async (formData) => {
                                    try {
                                        const response = await fetch('/api/admin/bank-offers', {
                                            method: 'POST',
                                            credentials: 'include',
                                            body: formData
                                        })
                                        
                                        const data = await response.json()
                                        if (data.success) {
                                            alert('Bank offer created successfully!')
                                            handleOfferSuccess()
                                        } else {
                                            alert('Failed to create offer: ' + data.message)
                                        }
                                    } catch (error) {
                                        console.error('Error creating offer:', error)
                                        alert('Error creating offer')
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
                            
                            <BankOfferEditForm
                                offer={selectedOffer}
                                banks={banks}
                                applications={applications}
                                onSubmit={async (formData) => {
                                    try {
                                        const response = await fetch(`/api/admin/bank-offers/${selectedOffer.offer_id}`, {
                                            method: 'PUT',
                                            credentials: 'include',
                                            body: formData // FormData handles file uploads automatically
                                        })
                                        
                                        const data = await response.json()
                                        if (data.success) {
                                            alert('Bank offer updated successfully!')
                                            handleOfferSuccess()
                                        } else {
                                            alert('Failed to update offer: ' + data.message)
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
                                onEdit={() => {
                                    setShowViewModal(false)
                                    handleEditOffer(selectedOffer)
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
