'use client'

import { useState } from 'react'
import BusinessInfoModal from './BusinessInfoModal'

export default function BankLeadsTable({ data, onLeadSubmitSuccess }) {
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [offerForm, setOfferForm] = useState({
        approvedAmount: '',
        repaymentPeriod: '',
        interestRate: '',
        monthlyInstallment: '',
        gracePeriod: '',
        relationshipManagerContact: '',
        comment: '',
        files: []
    })

    const handleRowClick = async (lead) => {
        try {
            // Fetch detailed lead information including comments and files
            const response = await fetch(`/api/leads/${lead.application_id}`, {
                credentials: 'include',
                headers: {
                    'x-user-id': JSON.parse(localStorage.getItem('user') || '{}').user_id,
                    'x-user-type': JSON.parse(localStorage.getItem('user') || '{}').user_type || 'bank_user'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSelectedBusiness(data.data);
                    setIsModalOpen(true);
                } else {
                    console.error('Failed to fetch lead details:', data.error);
                    // Fallback to basic data
                    setSelectedBusiness(lead);
                    setIsModalOpen(true);
                }
            } else {
                console.error('Failed to fetch lead details:', response.status);
                // Fallback to basic data
                setSelectedBusiness(lead);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching lead details:', error);
            // Fallback to basic data
            setSelectedBusiness(lead);
            setIsModalOpen(true);
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedBusiness(null)
    }

    const handleSubmitOffer = async (businessData) => {
        // Close the business info modal and open the offer modal
        setIsModalOpen(false)
        setShowOfferModal(true)
    }

    const handleOfferSubmit = async (e) => {
        e.preventDefault()
        
        try {
            // Create FormData for the API call
            const formData = new FormData()
            formData.append('leadId', selectedBusiness.application_id)
            formData.append('bankUserId', JSON.parse(localStorage.getItem('user') || '{}').bank_user_id)
            formData.append('approvedAmount', offerForm.approvedAmount)
            formData.append('repaymentPeriod', offerForm.repaymentPeriod)
            formData.append('interestRate', offerForm.interestRate)
            formData.append('monthlyInstallment', offerForm.monthlyInstallment)
            formData.append('gracePeriod', offerForm.gracePeriod)
            formData.append('relationshipManagerContact', offerForm.relationshipManagerContact)
            formData.append('comment', offerForm.comment)
            
            // Add files if any
            if (offerForm.files.length > 0) {
                offerForm.files.forEach((file, index) => {
                    formData.append('supportingDocuments', file)
                })
            }

            // Submit the offer
            const response = await fetch('/api/bank/submit-offer', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })

            const result = await response.json()

            if (result.success) {
                // Show success message with navigation guidance
                alert('Offer submitted successfully! The lead has been moved to approved leads. You can view it in the "Leads" section.')
                
                // Close the modal
                setShowOfferModal(false)
                setSelectedBusiness(null)
                
                // Reset the form
                setOfferForm({
                    approvedAmount: '',
                    repaymentPeriod: '',
                    interestRate: '',
                    monthlyInstallment: '',
                    gracePeriod: '',
                    relationshipManagerContact: '',
                    comment: '',
                    files: []
                })
                
                // Refresh the data using the callback
                if (onLeadSubmitSuccess) {
                    onLeadSubmitSuccess()
                }
            } else {
                // Show error message
                alert(`Failed to submit offer: ${result.message}`)
            }
        } catch (error) {
            console.error('Error submitting offer:', error)
            alert('An error occurred while submitting the offer. Please try again.')
        }
    }

    const formatCountdown = (submittedAt, auctionEndTime) => {
        // If auction_end_time is available, use it; otherwise calculate 48 hours from submission
        const endTime = auctionEndTime ? new Date(auctionEndTime) : new Date(new Date(submittedAt).getTime() + 48 * 60 * 60 * 1000);
        const now = new Date();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            return '⛔ Expired';
        } else {
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return `${hoursLeft}h ${minutesLeft}m left`;
        }
    };

    const formatMoney = (amount) => {
        if (!amount) return 'N/A'
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return 'N/A'
        return `SAR ${num.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        })}`
    }

    const sortedData = [...data].sort((a, b) => {
        // Sort by countdown time (closest to expiry first)
        const aEndTime = a.auction_end_time ? new Date(a.auction_end_time) : new Date(new Date(a.submitted_at).getTime() + 48 * 60 * 60 * 1000);
        const bEndTime = b.auction_end_time ? new Date(b.auction_end_time) : new Date(new Date(b.submitted_at).getTime() + 48 * 60 * 60 * 1000);
        const now = new Date();
        
        const aTimeLeft = aEndTime - now;
        const bTimeLeft = bEndTime - now;
        
        // If both are expired, show most recently expired first
        if (aTimeLeft <= 0 && bTimeLeft <= 0) {
            return new Date(b.submitted_at) - new Date(a.submitted_at);
        }
        
        // If only one is expired, show expired one first
        if (aTimeLeft <= 0) return 1;
        if (bTimeLeft <= 0) return -1;
        
        // Otherwise, show closest to expiry first
        return aTimeLeft - bTimeLeft;
    });

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden">
                        <table className="w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 rounded-tl-md w-24">
                                        POS Provider
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-20">
                                        POS Age
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-28">
                                        Monthly Sales
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-28">
                                        Financing Amount
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-24">
                                        Repayment
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-24">
                                        Submitted
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 rounded-tr-md w-20">
                                        Countdown
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedData.map((lead) => {
                                    // Use the same logic as formatCountdown for consistency
                                    const endTime = lead.auction_end_time ? new Date(lead.auction_end_time) : new Date(new Date(lead.submitted_at).getTime() + 48 * 60 * 60 * 1000);
                                    const now = new Date();
                                    const timeLeft = endTime - now;
                                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

                                    return (
                                        <tr
                                            key={lead.application_id}
                                            onClick={() => handleRowClick(lead)}
                                            className={`cursor-pointer hover:bg-gray-50 ${
                                                hoursLeft < 2 ? 'bg-red-50' : hoursLeft < 6 ? 'bg-yellow-50' : ''
                                            }`}
                                        >
                                            <td className="px-3 py-3 text-xs text-start text-gray-900 font-medium truncate" title={lead.pos_provider || 'N/A'}>
                                                {lead.pos_provider || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700">
                                                {lead.pos_age || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={formatMoney(lead.monthly_sales)}>
                                                {formatMoney(lead.monthly_sales)}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={formatMoney(lead.financing_amount)}>
                                                {formatMoney(lead.financing_amount)}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700">
                                                {lead.repayment_period ? `${lead.repayment_period}m` : 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={new Date(lead.submitted_at).toLocaleString()}>
                                                {new Date(lead.submitted_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start font-semibold text-red-600">
                                                ⏳ {formatCountdown(lead.submitted_at, lead.auction_end_time)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden mt-4 space-y-4">
                {sortedData.map((lead) => {
                    const endTime = lead.auction_end_time ? new Date(lead.auction_end_time) : new Date(new Date(lead.submitted_at).getTime() + 48 * 60 * 60 * 1000);
                    const now = new Date();
                    const timeLeft = endTime - now;
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

                    return (
                        <div
                            key={lead.application_id}
                            onClick={() => handleRowClick(lead)}
                            className={`cursor-pointer bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow ${
                                hoursLeft < 2 ? 'border-red-200 bg-red-50' : hoursLeft < 6 ? 'border-yellow-200 bg-yellow-50' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {lead.pos_provider || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1 text-xs font-semibold text-red-600">
                                    <span>⏳</span>
                                    <span>{formatCountdown(lead.submitted_at, lead.auction_end_time)}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-gray-500">Monthly Sales:</span>
                                    <div className="font-medium text-gray-900">{formatMoney(lead.monthly_sales)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Financing Amount:</span>
                                    <div className="font-medium text-gray-900">{formatMoney(lead.financing_amount)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">POS Age:</span>
                                    <div className="font-medium text-gray-900">{lead.pos_age || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Repayment:</span>
                                    <div className="font-medium text-gray-900">{lead.repayment_period ? `${lead.repayment_period}m` : 'N/A'}</div>
                                </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                    Submitted: {new Date(lead.submitted_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Business Info Modal */}
            <BusinessInfoModal
                isOpen={isModalOpen}
                onClose={closeModal}
                businessData={selectedBusiness}
                onSubmitOffer={handleSubmitOffer}
            />

            {/* Bank Offer Submission Modal */}
            {showOfferModal && selectedBusiness && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Submit Bank Offer - {selectedBusiness.trade_name}
                                </h3>
                                <button
                                    onClick={() => setShowOfferModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleOfferSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Approved Financing Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Approved Financing Amount (SAR) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={offerForm.approvedAmount}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, approvedAmount: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Proposed Repayment Period */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Proposed Repayment Period (months) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={offerForm.repaymentPeriod}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, repaymentPeriod: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="12"
                                        />
                                    </div>

                                    {/* Interest Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Interest Rate (%) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={offerForm.interestRate}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Monthly Installment Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monthly Installment Amount (SAR) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={offerForm.monthlyInstallment}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, monthlyInstallment: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Grace Period */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Grace Period (months)
                                        </label>
                                        <input
                                            type="number"
                                            value={offerForm.gracePeriod}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, gracePeriod: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Relationship Manager Contact Details */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Relationship Manager Contact Details *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={offerForm.relationshipManagerContact}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerContact: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="Name, Phone, Email"
                                        />
                                    </div>
                                </div>

                                {/* File Upload Section */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Supporting Documents
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, files: Array.from(e.target.files) }))}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="mt-1 text-sm text-gray-600">
                                                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                                    Upload files
                                                </span>
                                                {' '}or drag and drop
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                PDF, DOC, DOCX, JPG, PNG up to 10MB
                                            </p>
                                        </label>
                                    </div>
                                    
                                    {/* File List */}
                                    {offerForm.files.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                                            <div className="space-y-1">
                                                {offerForm.files.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                                        <span className="text-sm text-gray-600">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOfferForm(prev => ({ 
                                                                ...prev, 
                                                                files: prev.files.filter((_, i) => i !== index) 
                                                            }))}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Comments
                                    </label>
                                    <textarea
                                        value={offerForm.comment}
                                        onChange={(e) => setOfferForm(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Any additional terms, conditions, or special requirements..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowOfferModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        Submit Offer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
