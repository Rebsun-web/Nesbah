'use client'

import { useEffect, useState } from 'react'

import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import UnmaskedContactInfo from '@/components/UnmaskedContactInfo'
import OfferSuccessModal from '@/components/OfferSuccessModal'
import { collectErrors, checkNumber, checkSaudiMobile, checkEmail, checkLength } from '@/lib/validators'
import { useLanguage } from '@/contexts/LanguageContext'

function BankLeadsPage() {
    const { t, currentLanguage } = useLanguage()
    const [purchasedLeads, setPurchasedLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [selectedLead, setSelectedLead] = useState(null)
    const [showUnmaskedInfo, setShowUnmaskedInfo] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [offerForm, setOfferForm] = useState({
        approvedAmount: '',
        repaymentPeriod: '',
        interestRate: '',
        monthlyInstallment: '',
        gracePeriod: '',
        relationshipManagerName: '',
        relationshipManagerPhone: '',
        relationshipManagerEmail: '',
        supportingDocuments: []
    })
    const [submittingOffer, setSubmittingOffer] = useState(false)
    const [offerFormError, setOfferFormError] = useState('')

    useEffect(() => {
        fetchPurchasedLeads()
    }, [])

    const fetchPurchasedLeads = async () => {
        try {
            setLoading(true)
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const response = await fetch('/api/leads/purchased', {
                credentials: 'include',
                headers: {
                    'x-user-token': JSON.stringify(user)
                }
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setPurchasedLeads(data.data || [])
                } else {
                    setError('Failed to fetch purchased leads')
                }
            } else {
                setError('Failed to fetch purchased leads')
            }
        } catch (err) {
            console.error('Error fetching purchased leads:', err)
            setError('Failed to fetch purchased leads')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const response = await fetch('/api/leads/purchased/export', {
                credentials: 'include',
                headers: {
                    'x-user-token': JSON.stringify(user)
                }
            })
            
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'purchased-leads.xlsx'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                console.error('Export failed')
            }
        } catch (err) {
            console.error('Error exporting leads:', err)
        }
    }

    const handleOfferSubmit = async (e) => {
        e.preventDefault()

        const { valid, firstError } = collectErrors({
            approvedAmount: () => checkNumber(offerForm.approvedAmount, { min: 0, label: 'Approved amount' }),
            repaymentPeriod: () => checkNumber(offerForm.repaymentPeriod, { min: 1, integer: true, label: 'Repayment period' }),
            interestRate: () => checkNumber(offerForm.interestRate, { min: 0, label: 'Interest rate' }),
            monthlyInstallment: () => checkNumber(offerForm.monthlyInstallment, { min: 0, label: 'Monthly installment' }),
            gracePeriod: () => (offerForm.gracePeriod ? checkNumber(offerForm.gracePeriod, { min: 0, integer: true, label: 'Grace period' }) : null),
            relationshipManagerName: () => checkLength(offerForm.relationshipManagerName, { max: 255, label: 'Relationship manager name' }),
            relationshipManagerPhone: () => checkSaudiMobile(offerForm.relationshipManagerPhone, { label: 'Relationship manager phone' }),
            relationshipManagerEmail: () => checkEmail(offerForm.relationshipManagerEmail, { required: false }),
        })
        if (!valid) {
            setOfferFormError(firstError)
            return
        }
        setOfferFormError('')
        setSubmittingOffer(true)

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const formData = new FormData()

            // The API only reads a single `relationshipManagerContact` field (not
            // separate name/phone/email keys) — combine them here so this data
            // actually reaches the offer record instead of being silently dropped.
            const relationshipManagerContact = [
                offerForm.relationshipManagerName,
                offerForm.relationshipManagerPhone,
                offerForm.relationshipManagerEmail,
            ].filter(Boolean).join(', ')

            formData.append('approvedAmount', offerForm.approvedAmount)
            formData.append('repaymentPeriod', offerForm.repaymentPeriod)
            formData.append('interestRate', offerForm.interestRate)
            formData.append('monthlyInstallment', offerForm.monthlyInstallment)
            formData.append('gracePeriod', offerForm.gracePeriod)
            formData.append('relationshipManagerContact', relationshipManagerContact)

            formData.append('leadId', selectedLead.application_id)
            formData.append('bankUserId', user.user_id)
            
            const response = await fetch('/api/bank/submit-offer', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'x-user-token': JSON.stringify(user)
                },
                body: formData
            })
            
            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setShowOfferModal(false)
                    setShowSuccessModal(true)
                    setOfferForm({
                        approvedAmount: '',
                        repaymentPeriod: '',
                        interestRate: '',
                        monthlyInstallment: '',
                        gracePeriod: '',
                        relationshipManagerName: '',
                        relationshipManagerPhone: '',
                        relationshipManagerEmail: '',
                        supportingDocuments: []
                    })
                } else {
                    alert('Failed to submit offer: ' + result.message)
                }
            } else {
                alert('Failed to submit offer')
            }
        } catch (err) {
            console.error('Error submitting offer:', err)
            alert('Error submitting offer')
        } finally {
            setSubmittingOffer(false)
        }
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        setOfferForm(prev => ({
            ...prev,
            supportingDocuments: [...prev.supportingDocuments, ...files]
        }))
    }

    const removeFile = (index) => {
        setOfferForm(prev => ({
            ...prev,
            supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
        }))
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        if (!amount) return 'SAR 0.00'
        return `SAR ${parseFloat(amount).toFixed(2)}`
    }

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = purchasedLeads.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(purchasedLeads.length / itemsPerPage)

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-[hsl(var(--muted-foreground))]">{t('leads.loadingApprovedLeads')}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={fetchPurchasedLeads}
                        className="mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md hover:bg-[hsl(var(--primary))]"
                    >
                        {t('leads.retry')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Card */}
                <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-card p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">{t('leads.approvedLeads')}</h2>
                            <p className="text-[hsl(var(--muted-foreground))]">{purchasedLeads.length} {purchasedLeads.length !== 1 ? t('leads.leadsApproved') : t('leads.leadApproved')}</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-md hover:bg-[hsl(var(--foreground))] transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            {t('leads.exportXlsx')}
                        </button>
                    </div>
                </div>

                {/* Leads Table */}
                <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-card overflow-hidden">
                    {purchasedLeads.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-[hsl(var(--muted-foreground))]">{t('leads.noPurchasedLeads')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-[hsl(var(--secondary))]">
                                        <tr>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('leads.companyBusinessInfo')}
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('leads.contact')}
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('leads.phone')}
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('business.email')}
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('portal.submittedDate')}
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                                {t('admin.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.map((lead) => (
                                            <tr key={lead.application_id} className="hover:bg-[hsl(var(--secondary))]">
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-[hsl(var(--foreground))]" title={lead.trade_name}>
                                                        <div className="max-w-xs truncate">{lead.trade_name}</div>
                                                    </div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">ID: {lead.application_id}</div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-[hsl(var(--foreground))]" title={lead.contact_person || t('leads.notProvided')}>
                                                        {lead.contact_person || t('leads.notProvided')}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-[hsl(var(--foreground))]" title={lead.contact_person_number || t('leads.notProvided')}>
                                                        {lead.contact_person_number || t('leads.notProvided')}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-[hsl(var(--foreground))]">business@nesbah.com</div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-[hsl(var(--muted-foreground))]">
                                                    {new Date(lead.submitted_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                // Fetch detailed lead information including offers
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
                                                                        setSelectedLead(data.data);
                                                                        setShowUnmaskedInfo(true);
                                                                    } else {
                                                                        console.error('Failed to fetch lead details:', data.error);
                                                                        // Fallback to basic data
                                                                        setSelectedLead(lead);
                                                                        setShowUnmaskedInfo(true);
                                                                    }
                                                                } else {
                                                                    console.error('Failed to fetch lead details:', response.status);
                                                                    // Fallback to basic data
                                                                    setSelectedLead(lead);
                                                                    setShowUnmaskedInfo(true);
                                                                }
                                                            } catch (error) {
                                                                console.error('Error fetching lead details:', error);
                                                                // Fallback to basic data
                                                                setSelectedLead(lead);
                                                                setShowUnmaskedInfo(true);
                                                            }
                                                        }}
                                                        className="text-indigo-600 hover:text-green-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                                                    >
                                                        {t('leads.viewDetails')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Lead Details Modal - Shows Application Details + Business Data */}
                            {showUnmaskedInfo && selectedLead && (
                                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                                                    {t('leads.leadDetails')} - {selectedLead.trade_name}
                                                </h3>
                                                <button
                                                    onClick={() => setShowUnmaskedInfo(false)}
                                                    className="text-gray-400 hover:text-[hsl(var(--muted-foreground))]"
                                                >
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            


                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Application Details */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {t('application.details')}
                                                    </h4>
                                                    <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.applicationId')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">#{selectedLead.application_id}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('offers.submitted')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">
                                                                {new Date(selectedLead.submitted_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.posProviderName')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{selectedLead.pos_provider_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.posAgeDuration')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{selectedLead.pos_age_duration_months ? `${selectedLead.pos_age_duration_months} ${t('leads.months')}` : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.avgMonthlyPosSales')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">
                                                                {selectedLead.avg_monthly_pos_sales ? `SAR ${parseFloat(selectedLead.avg_monthly_pos_sales).toLocaleString()}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.requestedFinancingAmount')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">
                                                                {formatAmountRange(selectedLead.amount_range_code, currentLanguage, selectedLead.approximate_financing_amount)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.preferredRepaymentPeriod')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">
                                                                {selectedLead.preferred_repayment_period_months ? `${selectedLead.preferred_repayment_period_months} ${t('leads.months')}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        {selectedLead.store_url && (
                                                            <div className="flex justify-between">
                                                                <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.storeUrl')}:</span>
                                                                <span className="text-sm text-[hsl(var(--foreground))]">
                                                                    <a href={selectedLead.store_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                                                        {selectedLead.store_url}
                                                                    </a>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Business Data */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {t('business.businessInformation')}
                                                    </h4>
                                                    <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.companyName')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{selectedLead.trade_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.crNumber')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{selectedLead.cr_number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.crNationalNumberWathiq')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{selectedLead.cr_national_number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.activities')}:</span>
                                                             <div className="text-sm text-[hsl(var(--foreground))] text-right max-w-xs">
                                                                 {selectedLead.activities ? (
                                                                     Array.isArray(selectedLead.activities) 
                                                                         ? selectedLead.activities.map((item, index) => (
                                                                             <div key={index} className="mb-1 last:mb-0">
                                                                                 {item.trim()}
                                                                             </div>
                                                                         ))
                                                                         : selectedLead.activities.toString().split(',').map((item, index) => (
                                                                             <div key={index} className="mb-1 last:mb-0">
                                                                                 {item.trim()}
                                                                             </div>
                                                                         ))
                                                                 ) : (
                                                                     'N/A'
                                                                 )}
                                                             </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Offers Section */}
                                            {selectedLead.offers && selectedLead.offers.length > 0 && (
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        {t('leads.submittedOffers')}
                                                    </h4>
                                                    <div className="space-y-3">
                                                                 {selectedLead.offers.map((offer, index) => {
                                                             return (
                                                                 <div key={offer.offer_id} className="bg-[hsl(var(--secondary))] rounded-lg p-4 border border-[hsl(var(--border))]">
                                                                     <div className="flex items-center justify-between mb-3">
                                                                         <h5 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                                                             {t('leads.offer')} #{offer.offer_id} {t('leads.by')} {offer.bank_name || t('leads.unknownBank')}
                                                                         </h5>
                                                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                             offer.status === 'live_auction' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                         }`}>
                                                                             {offer.status}
                                                                         </span>
                                                                     </div>
                                                                     
                                                                      {/* Offer Details Grid */}
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                                                          <div className="flex justify-between">
                                                                              <span className="font-medium text-[hsl(var(--ink-soft))]">{t('leads.approvedAmount')}:</span>
                                                                              <span className="text-[hsl(var(--foreground))]">
                                                                                  {offer.approved_financing_amount ? `SAR ${parseFloat(offer.approved_financing_amount).toLocaleString()}` : 'N/A'}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex justify-between">
                                                                              <span className="font-medium text-[hsl(var(--ink-soft))]">{t('leads.repaymentPeriod')}:</span>
                                                                              <span className="text-[hsl(var(--foreground))]">
                                                                                  {offer.proposed_repayment_period_months ? `${offer.proposed_repayment_period_months} ${t('leads.months')}` : 'N/A'}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex justify-between">
                                                                              <span className="font-medium text-[hsl(var(--ink-soft))]">{t('leads.interestRate')}:</span>
                                                                              <span className="text-[hsl(var(--foreground))]">
                                                                                  {offer.interest_rate ? `${offer.interest_rate}%` : 'N/A'}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex justify-between">
                                                                              <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.monthlyInstallmentAmount')}:</span>
                                                                              <span className="text-sm text-[hsl(var(--foreground))]">
                                                                                  {offer.monthly_installment_amount ? `SAR ${parseFloat(offer.monthly_installment_amount).toLocaleString()}` : 'N/A'}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex justify-between">
                                                                              <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.gracePeriod')}:</span>
                                                                              <span className="text-sm text-[hsl(var(--foreground))]">
                                                                                  {offer.grace_period_months ? `${offer.grace_period_months} ${t('leads.months')}` : 'N/A'}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex justify-between">
                                                                              <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('offers.submitted')}:</span>
                                                                              <span className="text-sm text-[hsl(var(--foreground))]">
                                                                                  {new Date(offer.submitted_at).toLocaleDateString()}
                                                                              </span>
                                                                          </div>
                                                                      </div>

                                                                      {/* Relationship Manager Details */}
                                                                      {offer.relationship_manager_name && (
                                                                          <div className="border-t pt-3 mb-3">
                                                                              <h6 className="text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">{t('leads.relationshipManager')}:</h6>
                                                                              <div className="text-sm text-[hsl(var(--foreground))]">
                                                                                  {offer.relationship_manager_name}
                                                                              </div>
                                                                          </div>
                                                                      )}

                                                                     {/* Offer Terms and Comments */}
                                                                     {offer.offer_terms && (
                                                                         <div className="border-t pt-3 mb-3">
                                                                             <h6 className="text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">{t('leads.fullOfferTerms')}:</h6>
                                                                             <div className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                                                                                 {offer.offer_terms}
                                                                             </div>
                                                                         </div>
                                                                     )}

                                                                     {offer.offer_comment && (
                                                                         <div className="border-t pt-3">
                                                                             <h6 className="text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">{t('leads.additionalComments')}:</h6>
                                                                             <div className="text-sm text-[hsl(var(--foreground))]">
                                                                                 {offer.offer_comment}
                                                                             </div>
                                                                         </div>
                                                                     )}
                                                                 </div>
                                                             );
                                                         })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contact Information (Unmasked) */}
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    {t('business.contactInformation')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.contactPerson')}:</span>
                                                            <p className="text-sm text-[hsl(var(--foreground))]">{selectedLead.contact_person || t('leads.notProvided')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.phone')}:</span>
                                                            <p className="text-sm text-[hsl(var(--foreground))]">{selectedLead.contact_person_number || t('leads.notProvided')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.email')}:</span>
                                                            <p className="text-sm text-[hsl(var(--foreground))]">{selectedLead.business_contact_email || t('leads.notProvided')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes Section */}
                                            {selectedLead.notes && (
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {t('leads.applicationNotes')}
                                                    </h4>
                                                    <div className="bg-[hsl(var(--secondary))] rounded-lg p-4">
                                                        <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                                                            {selectedLead.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Uploaded Files Section */}
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {t('leads.uploadedFiles')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4">
                                                    {/* Application Files */}
                                                    <div className="mb-4">
                                                        <h5 className="text-md font-medium text-gray-800 mb-3">{t('leads.applicationDocuments')}</h5>
                                                        {selectedLead.uploaded_filename ? (
                                                            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-[hsl(var(--border))]">
                                                                <div className="flex items-center space-x-3">
                                                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{selectedLead.uploaded_filename}</p>
                                                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('application.applicationDocument')}</p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={`/api/files/download/${selectedLead.application_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                                >
                                                                    {t('common.download')}
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-[hsl(var(--muted-foreground))] italic">{t('leads.noApplicationDocuments')}</p>
                                                        )}
                                                    </div>

                                                                                                        {/* Offer Files */}
                                                    <div>
                                                        <h5 className="text-md font-medium text-gray-800 mb-3">{t('leads.offerDocuments')}</h5>
                                                        {selectedLead.offers && selectedLead.offers.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {selectedLead.offers.map((offer, index) => (
                                                                    offer.uploaded_filename && (
                                                                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-[hsl(var(--border))]">
                                                                            <div className="flex items-center space-x-3">
                                                                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{offer.uploaded_filename}</p>
                                                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('leads.offer')} #{offer.id} - {offer.submitted_by_bank_name || t('leads.bankOffer')}</p>
                                                                                </div>
                                                                            </div>
                                                                            <a
                                                                                href={`/api/files/download/offer/${offer.id}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                            >
                                                                                {t('common.download')}
                                                                            </a>
                                                                        </div>
                                                                    )
                                                                ))}
                                                                {!selectedLead.offers.some(offer => offer.uploaded_filename) && (
                                                                    <p className="text-sm text-[hsl(var(--muted-foreground))] italic">{t('leads.noOfferDocuments')}</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-[hsl(var(--muted-foreground))] italic">{t('leads.noOffersSubmittedYet')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bank Offer Submission Modal */}
                            {showOfferModal && selectedLead && (
                                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                                    <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                                                    Submit Bank Offer - {selectedLead.trade_name}
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
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Approved Financing Amount */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                            Approved Financing Amount (SAR) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={offerForm.approvedAmount}
                                                            onChange={(e) => setOfferForm(prev => ({ ...prev, approvedAmount: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="0.00"
                                                        />
                                                    </div>

                                                    {/* Repayment Period */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                            Proposed Repayment Period (months) *
                                                        </label>
                                                        <input
                                                            type="number"
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
                                                            Interest/Profit Rate (%) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={offerForm.interestRate}
                                                            onChange={(e) => setOfferForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="5.50"
                                                        />
                                                    </div>

                                                    {/* Monthly Installment */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                            Monthly Installment Amount (SAR) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
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
                                                            Grace Period (months) - Optional
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={offerForm.gracePeriod || ''}
                                                            onChange={(e) => setOfferForm(prev => ({ ...prev, gracePeriod: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="0 (if applicable)"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Relationship Manager Details */}
                                                <div className="border-t pt-6">
                                                    <h4 className="text-lg font-medium text-[hsl(var(--foreground))] mb-4">Relationship Manager Contact Details</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                                Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={offerForm.relationshipManagerName}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerName: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="Full Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                                Phone Number *
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                required
                                                                value={offerForm.relationshipManagerPhone}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerPhone: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="+966 50 123 4567"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-[hsl(var(--ink-soft))] mb-2">
                                                                Email *
                                                            </label>
                                                            <input
                                                                type="email"
                                                                required
                                                                value={offerForm.relationshipManagerEmail}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerEmail: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="manager@bank.com"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Submit Button */}
                                                <div className="flex justify-end space-x-3 pt-6 border-t">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowOfferModal(false)}
                                                        className="px-4 py-2 border border-[hsl(var(--border))] rounded-md text-sm font-medium text-[hsl(var(--ink-soft))] bg-white hover:bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={submittingOffer}
                                                        className="px-4 py-2 bg-[hsl(var(--primary))] border border-transparent rounded-md text-sm font-medium text-white hover:bg-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-[hsl(var(--border))] sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-[hsl(var(--border))] text-sm font-medium rounded-md text-[hsl(var(--ink-soft))] bg-white hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('common.previous')}
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-[hsl(var(--border))] text-sm font-medium rounded-md text-[hsl(var(--ink-soft))] bg-white hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('common.next')}
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-[hsl(var(--ink-soft))]">
                                                {t('offers.showing')} <span className="font-medium">{indexOfFirstItem + 1}</span> {t('offers.to')}{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastItem, purchasedLeads.length)}
                                                </span>{' '}
                                                {t('offers.of')} <span className="font-medium">{purchasedLeads.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[hsl(var(--border))] bg-white text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">{t('common.previous')}</span>
                                                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                
                                                {/* Page Numbers */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            currentPage === page
                                                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                                                : 'bg-white border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[hsl(var(--border))] bg-white text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">{t('common.next')}</span>
                                                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            <OfferSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onViewLeads={() => {
                    setShowSuccessModal(false)
                    // Refresh the leads data
                    fetchPurchasedLeads()
                }}
            />
        </div>
    )
}

import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'
import { formatAmountRange } from '@/lib/apply-options'

export default function BankLeadsPageWrapper() {
    return (
        <div>
            <main className="pb-32">
                <BankNavbar />
                <BankLeadsPage />
            </main>
            <NewFooter />
        </div>
    )
}
