'use client'

import { useState } from 'react'
import BusinessInfoModal from './BusinessInfoModal'
import OfferSuccessModal from './OfferSuccessModal'
import { collectErrors, checkNumber, checkLength } from '@/lib/validators'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatFinancingType } from '@/lib/apply-options'

const ITEMS_PER_PAGE = 10

export default function BankLeadsTable({ data, onLeadSubmitSuccess }) {
    const { t, currentLanguage } = useLanguage()
    const [selectedBusiness, setSelectedBusiness] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [offerFormError, setOfferFormError] = useState('')
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
        setOfferFormError('')
    }

    const handleOfferSubmit = async (e) => {
        e.preventDefault()

        const { valid, firstError } = collectErrors({
            approvedAmount: () => checkNumber(offerForm.approvedAmount, { min: 0, label: 'Approved amount' }),
            repaymentPeriod: () => checkNumber(offerForm.repaymentPeriod, { min: 1, integer: true, label: 'Repayment period' }),
            interestRate: () => checkNumber(offerForm.interestRate, { min: 0, label: 'Interest rate' }),
            monthlyInstallment: () => checkNumber(offerForm.monthlyInstallment, { min: 0, label: 'Monthly installment' }),
            gracePeriod: () => (offerForm.gracePeriod ? checkNumber(offerForm.gracePeriod, { min: 0, integer: true, label: 'Grace period' }) : null),
            relationshipManagerContact: () => checkLength(offerForm.relationshipManagerContact, { max: 255, label: 'Relationship manager contact' }),
            comment: () => (offerForm.comment ? checkLength(offerForm.comment, { max: 2000, label: 'Comment' }) : null),
        })
        if (!valid) {
            setOfferFormError(firstError)
            return
        }
        setOfferFormError('')

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
                                    <th className="bg-[hsl(var(--muted))] px-3 py-3 text-start text-sm font-semibold text-[hsl(var(--ink-soft))] rounded-tl-md w-28">
                                        {t('leads.type')}
                                    </th>
                                    <th className="bg-[hsl(var(--muted))] px-3 py-3 text-start text-sm font-semibold text-[hsl(var(--ink-soft))] w-32">
                                        {t('common.city')}
                                    </th>
                                    <th className="bg-[hsl(var(--muted))] px-3 py-3 text-start text-sm font-semibold text-[hsl(var(--ink-soft))] w-28">
                                        {t('leads.financingAmount')}
                                    </th>
                                    <th className="bg-[hsl(var(--muted))] px-3 py-3 text-start text-sm font-semibold text-[hsl(var(--ink-soft))] rounded-tr-md w-24">
                                        {t('offers.submitted')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pageData.map((lead) => {
                                    return (
                                        <tr
                                            key={lead.application_id}
                                            onClick={() => handleRowClick(lead)}
                                            className="cursor-pointer hover:bg-[hsl(var(--secondary))]"
                                        >
                                            <td className="px-3 py-3 text-xs text-start">
                                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                                    {formatFinancingType(lead.financing_type, currentLanguage)}
                                                </span>
                                                {lead.reference_number && (
                                                    <div className="text-xs text-purple-600 font-mono mt-0.5">{lead.reference_number}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-[hsl(var(--ink-soft))] truncate" title={lead.city || '—'}>
                                                {lead.city || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-[hsl(var(--ink-soft))] truncate" title={lead.approximate_financing_amount || '—'}>
                                                {lead.approximate_financing_amount || '—'}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-start text-[hsl(var(--ink-soft))] truncate" title={new Date(lead.submitted_at).toLocaleString()}>
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
                            className="cursor-pointer bg-white rounded-lg border border-[hsl(var(--border))] p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                                            {lead.city || lead.company_name || '—'}
                                        </span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                                {formatFinancingType(lead.financing_type, currentLanguage)}
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
                                    <span className="text-[hsl(var(--muted-foreground))]">{t('common.city')}:</span>
                                    <div className="font-medium text-[hsl(var(--foreground))]">{lead.city || '—'}</div>
                                </div>
                                <div>
                                    <span className="text-[hsl(var(--muted-foreground))]">{t('leads.financingAmount')}:</span>
                                    <div className="font-medium text-[hsl(var(--foreground))]">{lead.approximate_financing_amount || '—'}</div>
                                </div>
                                <div>
                                    <span className="text-[hsl(var(--muted-foreground))]">{t('leads.contact')}:</span>
                                    <div className="font-medium text-[hsl(var(--foreground))]">{lead.contact_person || '—'}</div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                    {t('offers.submitted')}: {new Date(lead.submitted_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {sortedData.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-[hsl(var(--ink-soft))]">
                        {t('offers.showing')} <span className="font-medium">{indexOfFirst + 1}</span> {t('offers.to')}{' '}
                        <span className="font-medium">{Math.min(indexOfLast, sortedData.length)}</span> {t('offers.of')}{' '}
                        <span className="font-medium">{sortedData.length}</span> requests
                    </p>
                    <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium border border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.previous')}
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                    page === safePage
                                        ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                        : 'bg-white border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium border border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.next')}
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
                                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                                    {t('leads.submitBankOffer')} - {selectedBusiness.trade_name}
                                </h3>
                                <button
                                    onClick={() => setShowOfferModal(false)}
                                    className="text-gray-400 hover:text-[hsl(var(--muted-foreground))]"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <form onSubmit={handleOfferSubmit} className="space-y-6">
                                {offerFormError && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                        <p className="text-sm text-red-600">{offerFormError}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Approved Financing Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.approvedFinancingAmount')} *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={offerForm.approvedAmount}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, approvedAmount: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Proposed Repayment Period */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.proposedRepaymentPeriod')} *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={offerForm.repaymentPeriod}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, repaymentPeriod: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="12"
                                        />
                                    </div>

                                    {/* Interest Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.interestRate')} *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={offerForm.interestRate}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Monthly Installment Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.monthlyInstallmentAmount')} *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={offerForm.monthlyInstallment}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, monthlyInstallment: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Grace Period */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.gracePeriod')}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={offerForm.gracePeriod}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, gracePeriod: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Relationship Manager Contact Details */}
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                            {t('leads.relationshipManagerContact')} *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={offerForm.relationshipManagerContact}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerContact: e.target.value }))}
                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder={t('leads.namePhoneEmail')}
                                        />
                                    </div>
                                </div>

                                {/* File Upload Section */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                        {t('leads.supportingDocuments')}
                                    </label>
                                    <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                                            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                                                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                                    {t('leads.uploadFiles')}
                                                </span>
                                                {' '}{t('leads.orDragAndDrop')}
                                            </p>
                                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                {t('leads.fileTypesUpTo10MB')}
                                            </p>
                                        </label>
                                    </div>
                                    
                                    {/* File List */}
                                    {offerForm.files.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.selectedFiles')}:</p>
                                            <div className="space-y-1">
                                                {offerForm.files.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-[hsl(var(--secondary))] px-3 py-2 rounded-md">
                                                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setOfferForm(prev => ({ 
                                                                ...prev, 
                                                                files: prev.files.filter((_, i) => i !== index) 
                                                            }))}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            {t('leads.remove')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                        {t('leads.additionalComments')}
                                    </label>
                                    <textarea
                                        value={offerForm.comment}
                                        onChange={(e) => setOfferForm(prev => ({ ...prev, comment: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder={t('leads.additionalTermsPlaceholder')}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowOfferModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-[hsl(var(--ink-soft))] bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        {t('leads.submitOffer')}
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
