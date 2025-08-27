'use client'

import { useState, useEffect } from 'react'
import { 
    BuildingOfficeIcon, 
    BanknotesIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline'
import NewOfferModal from './NewOfferModal'

export default function OfferManagement() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedOffer, setSelectedOffer] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showNewOfferModal, setShowNewOfferModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [bankFilter, setBankFilter] = useState('all')

    useEffect(() => {
        fetchOffers()
    }, [])

    const fetchOffers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/offers', {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setOffers(data.offers || [])
            } else {
                setError(data.error || 'Failed to fetch offers')
            }
        } catch (err) {
            setError('Network error while fetching offers')
        } finally {
            setLoading(false)
        }
    }

    const handleViewOffer = (offer) => {
        setSelectedOffer(offer)
        setShowModal(true)
    }

    const handleEditOffer = (offer) => {
        // TODO: Implement edit functionality
        console.log('Edit offer:', offer)
    }

    const handleDeleteOffer = async (offerId) => {
        if (!confirm('Are you sure you want to delete this offer?')) return

        try {
            const response = await fetch(`/api/admin/offers/${offerId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setOffers(offers.filter(offer => offer.offer_id !== offerId))
            } else {
                alert('Failed to delete offer: ' + data.error)
            }
        } catch (err) {
            alert('Error deleting offer')
        }
    }

    const handleNewOfferSuccess = (newOffer) => {
        // Add the new offer to the list
        setOffers(prev => [newOffer, ...prev])
        // Close the modal
        setShowNewOfferModal(false)
    }

    const getStatusInfo = (status) => {
        switch (status) {
            case 'submitted':
                return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <ClockIcon className="h-4 w-4" /> }
            case 'accepted':
                return { color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircleIcon className="h-4 w-4" /> }
            case 'rejected':
                return { color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircleIcon className="h-4 w-4" /> }
            case 'expired':
                return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <XCircleIcon className="h-4 w-4" /> }
            default:
                return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <ClockIcon className="h-4 w-4" /> }
        }
    }

    const filteredOffers = offers.filter(offer => {
        const matchesSearch = offer.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            offer.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            offer.application_id?.toString().includes(searchTerm)
        
        const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
        const matchesBank = bankFilter === 'all' || offer.bank_name === bankFilter

        return matchesSearch && matchesStatus && matchesBank
    })

    const uniqueBanks = [...new Set(offers.map(offer => offer.bank_name))]

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
                    <button 
                        onClick={fetchOffers}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => setShowNewOfferModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Offer
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search offers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                    </select>

                    <select
                        value={bankFilter}
                        onChange={(e) => setBankFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Banks</option>
                        {uniqueBanks.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                        ))}
                    </select>

                    <div className="flex items-center space-x-2">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            {filteredOffers.length} of {offers.length} offers
                        </span>
                    </div>
                </div>
            </div>

            {/* Offers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Application
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Offer Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOffers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <p className="text-lg font-medium">No offers found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOffers.map((offer) => {
                                    const statusInfo = getStatusInfo(offer.status)
                                    return (
                                        <tr key={offer.offer_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{offer.application_id}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {offer.application_type || 'POS Finance'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {offer.business_name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {offer.business_email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {offer.bank_name || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {offer.offer_device_setup_fee && (
                                                        <div>Setup: SAR {offer.offer_device_setup_fee}</div>
                                                    )}
                                                    {offer.offer_transaction_fee_mada && (
                                                        <div>Mada: {offer.offer_transaction_fee_mada}%</div>
                                                    )}
                                                    {offer.offer_transaction_fee_visa_mc && (
                                                        <div>Visa/MC: {offer.offer_transaction_fee_visa_mc}%</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    <span className="ml-1 capitalize">{offer.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {offer.submitted_at ? new Date(offer.submitted_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewOffer(offer)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditOffer(offer)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit Offer"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOffer(offer.offer_id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Offer"
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
            </div>

            {/* Offer Details Modal */}
            {showModal && selectedOffer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Offer Details
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Application ID</label>
                                        <p className="mt-1 text-sm text-gray-900">#{selectedOffer.application_id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bank</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedOffer.bank_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Business</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedOffer.business_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedOffer.status}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Offer Terms</label>
                                    <div className="mt-2 bg-gray-50 p-4 rounded-md">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedOffer.offer_device_setup_fee && (
                                                <div>
                                                    <span className="font-medium">Setup Fee:</span>
                                                    <span className="ml-2">SAR {selectedOffer.offer_device_setup_fee}</span>
                                                </div>
                                            )}
                                            {selectedOffer.offer_transaction_fee_mada && (
                                                <div>
                                                    <span className="font-medium">Mada Fee:</span>
                                                    <span className="ml-2">{selectedOffer.offer_transaction_fee_mada}%</span>
                                                </div>
                                            )}
                                            {selectedOffer.offer_transaction_fee_visa_mc && (
                                                <div>
                                                    <span className="font-medium">Visa/MC Fee:</span>
                                                    <span className="ml-2">{selectedOffer.offer_transaction_fee_visa_mc}%</span>
                                                </div>
                                            )}
                                            {selectedOffer.offer_settlement_time_mada && (
                                                <div>
                                                    <span className="font-medium">Mada Settlement:</span>
                                                    <span className="ml-2">{selectedOffer.offer_settlement_time_mada} days</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedOffer.offer_comment && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedOffer.offer_comment}</p>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => handleEditOffer(selectedOffer)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        Edit Offer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Offer Modal */}
            <NewOfferModal
                isOpen={showNewOfferModal}
                onClose={() => setShowNewOfferModal(false)}
                onSuccess={handleNewOfferSuccess}
            />
        </div>
    )
}
