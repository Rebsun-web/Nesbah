'use client'

import { useState } from 'react'
import BusinessInfoModal from './BusinessInfoModal'
import OfferSuccessModal from './OfferSuccessModal'

const ITEMS_PER_PAGE = 10

export default function BankLeadsTable({ data, onLeadSubmitSuccess }) {
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
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
            formData.append('bankUserId', JSON.parse(localStorage.getItem('user') || '{}').user_id)
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
                // Close the offer modal
                setShowOfferModal(false)
                setSelectedBusiness(null)
                
                // Show success modal
                setShowSuccessModal(true)
                
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

    // Newest applications first (auction time-frame disabled — no countdown sorting).
    const sortedData = [...data].sort(
        (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
    )

    // Client-side pagination over the already-fetched leads.
    const totalPages = Math.max(1, Math.ceil(sortedData.length / ITEMS_PER_PAGE))
    const safePage = Math.min(currentPage, totalPages)
    const indexOfLast = safePage * ITEMS_PER_PAGE
    const indexOfFirst = indexOfLast - ITEMS_PER_PAGE
    const pageData = sortedData.slice(indexOfFirst, indexOfLast)

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden lg:block mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden">
                        <table className="w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 rounded-tl-md w-28">
                                        Type
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-32">
                                        City
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 w-28">
                                        Financing Amount
                                    </th>
                                    <th className="bg-gray-100 px-3 py-3 text-start text-sm font-semibold text-gray-700 rounded-tr-md w-24">
                                        Submitted
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pageData.map((lead) => {
                                    return (
                                        <tr
                                            key={lead.application_id}
                                            onClick={() => handleRowClick(lead)}
                                            className="cursor-pointer hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-3 text-xs text-start">
                                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                                    {lead.financing_type ? lead.financing_type.replace('_', ' ') : 'POS'}
                                                </span>
                                                {lead.reference_number && (
                                                    <div className="text-xs text-purple-600 font-mono mt-0.5">{lead.reference_number}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={lead.city || '—'}>
                                                {lead.city || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={lead.approximate_financing_amount || '—'}>
                                                {lead.approximate_financing_amount || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-gray-700 truncate" title={new Date(lead.submitted_at).toLocaleString()}>
                                                {new Date(lead.submitted_at).toLocaleDateString()}
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
                {pageData.map((lead) => {
                    return (
                        <div
                            key={lead.application_id}
                            onClick={() => handleRowClick(lead)}
                            className="cursor-pointer bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {lead.city || lead.company_name || '—'}
                                        </span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                                {lead.financing_type ? lead.financing_type.replace('_', ' ') : 'POS'}
                                            </span>
                                            {lead.reference_number && (
                                                <span className="text-xs text-purple-600 font-mono">{lead.reference_number}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-gray-500">City:</span>
                                    <div className="font-medium text-gray-900">{lead.city || '—'}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Financing Amount:</span>
                                    <div className="font-medium text-gray-900">{lead.approximate_financing_amount || '—'}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Contact:</span>
                                    <div className="font-medium text-gray-900">{lead.contact_person || '—'}</div>
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

            {/* Pagination */}
            {sortedData.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirst + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(indexOfLast, sortedData.length)}</span> of{' '}
                        <span className="font-medium">{sortedData.length}</span> requests
                    </p>
                    <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                    page === safePage
                                        ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}

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

            {/* Success Modal */}
            <OfferSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onViewLeads={() => {
                    setShowSuccessModal(false)
                    // Navigate to leads section or refresh data
                    if (onLeadSubmitSuccess) {
                        onLeadSubmitSuccess()
                    }
                }}
            />
        </>
    )
}
