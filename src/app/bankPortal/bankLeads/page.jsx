'use client'

import { useEffect, useState } from 'react'

import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import UnmaskedContactInfo from '@/components/UnmaskedContactInfo'

function BankLeadsPage() {
    const [purchasedLeads, setPurchasedLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [selectedLead, setSelectedLead] = useState(null)
    const [showUnmaskedInfo, setShowUnmaskedInfo] = useState(false)
    const [showOfferModal, setShowOfferModal] = useState(false)
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
        setSubmittingOffer(true)
        
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const formData = new FormData()
            
            // Add form fields
            Object.keys(offerForm).forEach(key => {
                if (key === 'supportingDocuments') {
                    offerForm[key].forEach((file, index) => {
                        formData.append(`supportingDocuments[${index}]`, file)
                    })
                } else {
                    formData.append(key, offerForm[key])
                }
            })
            
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
                    alert('Offer submitted successfully!')
                    setShowOfferModal(false)
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading approved leads...</p>
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
                        onClick={fetchPurchasedLeads}
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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Approved Leads</h2>
                            <p className="text-gray-600">{purchasedLeads.length} lead{purchasedLeads.length !== 1 ? 's' : ''} approved</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export XLSX
                        </button>
                    </div>
                </div>

                {/* Leads Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {purchasedLeads.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No purchased leads found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-hidden">
                                <table className="w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-40">
                                                Company & Business Info
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                                                Contact
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                                                Phone
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-24">
                                                Email
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
                                                Date
                                            </th>
                                            <th className="px-3 py-3 text-start text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.map((lead) => (
                                            <tr key={lead.application_id} className="hover:bg-gray-50">
                                                <td className="px-3 py-3">
                                                    <div className="text-xs font-medium text-gray-900 truncate" title={lead.trade_name}>{lead.trade_name}</div>
                                                    <div className="text-xs text-gray-500">ID: {lead.application_id}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs text-gray-900 truncate" title={lead.contact_person || 'Not provided'}>{lead.contact_person || 'Not provided'}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs text-gray-900 truncate" title={lead.contact_person_number || 'Not provided'}>{lead.contact_person_number || 'Not provided'}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-xs text-gray-900 truncate">business@nesbah.com</div>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-gray-500">
                                                    {new Date(lead.submitted_at).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-3 py-3 text-xs font-medium">
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
                                                        View Details
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
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    Lead Details - {selectedLead.trade_name}
                                                </h3>
                                                <button
                                                    onClick={() => setShowUnmaskedInfo(false)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            


                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Application Details */}
                                                <div className="space-y-4">
                                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Application Details
                                                    </h4>
                                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Application ID:</span>
                                                            <span className="text-sm text-gray-900">#{selectedLead.application_id}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Submitted:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {new Date(selectedLead.submitted_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">POS Provider Name:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.pos_provider_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">POS Age Duration:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.pos_age_duration_months ? `${selectedLead.pos_age_duration_months} months` : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Average Monthly POS Sales:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {selectedLead.avg_monthly_pos_sales ? `SAR ${parseFloat(selectedLead.avg_monthly_pos_sales).toLocaleString()}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Requested Financing Amount:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {selectedLead.requested_financing_amount ? `SAR ${parseFloat(selectedLead.requested_financing_amount).toLocaleString()}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Preferred Repayment Period:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {selectedLead.preferred_repayment_period_months ? `${selectedLead.preferred_repayment_period_months} months` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Number of POS Devices:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.number_of_pos_devices || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Own POS System:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.own_pos_system ? 'Yes' : 'No'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Has E-commerce:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.has_ecommerce ? 'Yes' : 'No'}</span>
                                                        </div>
                                                        {selectedLead.store_url && (
                                                            <div className="flex justify-between">
                                                                <span className="text-sm font-medium text-gray-700">Store URL:</span>
                                                                <span className="text-sm text-gray-900">
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
                                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        Business Information
                                                    </h4>
                                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Company Name:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.trade_name || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">CR Number:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.cr_number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">City:</span>
                                                            <span className="text-sm text-gray-900">{selectedLead.city_of_operation || selectedLead.city || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Sector:</span>
                                                            <div className="text-sm text-gray-900 text-right max-w-xs">
                                                                {selectedLead.sector ? (
                                                                    selectedLead.sector.split(',').map((item, index) => (
                                                                        <div key={index} className="mb-1 last:mb-0">
                                                                            {item.trim()}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    'N/A'
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Activities:</span>
                                                            <span className="text-sm text-gray-900">
                                                                {Array.isArray(selectedLead.activities) 
                                                                    ? selectedLead.activities.slice(0, 3).join(', ') 
                                                                    : selectedLead.activities || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Offers Section */}
                                            {selectedLead.offers && selectedLead.offers.length > 0 && (
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        Submitted Offers ({selectedLead.offers.length})
                                                    </h4>
                                                    <div className="space-y-3">
                                                                                                                 {selectedLead.offers.map((offer, index) => {
                                                             // Parse offer terms to extract individual values
                                                             const parseOfferTerms = (terms) => {
                                                                 if (!terms) return {};
                                                                 const result = {};
                                                                 
                                                                 // Extract Approved Amount
                                                                 const amountMatch = terms.match(/Approved Amount: ([^,]+)/);
                                                                 if (amountMatch) result.approvedAmount = amountMatch[1].trim();
                                                                 
                                                                 // Extract Repayment Period
                                                                 const repaymentMatch = terms.match(/Repayment Period: (\d+) months/);
                                                                 if (repaymentMatch) result.repaymentPeriod = repaymentMatch[1];
                                                                 
                                                                 // Extract Interest Rate
                                                                 const interestMatch = terms.match(/Interest Rate: ([\d.]+)%/);
                                                                 if (interestMatch) result.interestRate = interestMatch[1];
                                                                 
                                                                 // Extract Monthly Installment
                                                                 const installmentMatch = terms.match(/Monthly Installment: ([^,]+)/);
                                                                 if (installmentMatch) result.monthlyInstallment = installmentMatch[1].trim();
                                                                 
                                                                 // Extract Grace Period
                                                                 const graceMatch = terms.match(/Grace Period: (\d+) months/);
                                                                 if (graceMatch) result.gracePeriod = graceMatch[1];
                                                                 
                                                                 return result;
                                                             };
                                                             
                                                             const parsedTerms = parseOfferTerms(offer.offer_terms);
                                                             
                                                             return (
                                                                 <div key={offer.offer_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                     <div className="flex items-center justify-between mb-3">
                                                                         <h5 className="text-sm font-semibold text-gray-900">
                                                                             Offer #{offer.offer_id} by {offer.bank_name || 'Unknown Bank'}
                                                                         </h5>
                                                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                             offer.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                         }`}>
                                                                             {offer.status}
                                                                         </span>
                                                                     </div>
                                                                     
                                                                     {/* Offer Details Grid */}
                                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                                                         <div className="flex justify-between">
                                                                             <span className="font-medium text-gray-700">Approved Amount:</span>
                                                                             <span className="text-gray-900">
                                                                                 {parsedTerms.approvedAmount || (offer.offer_amount ? `SAR ${parseFloat(offer.offer_amount).toLocaleString()}` : 'N/A')}
                                                                             </span>
                                                                         </div>
                                                                         <div className="flex justify-between">
                                                                             <span className="font-medium text-gray-700">Repayment Period:</span>
                                                                             <span className="text-gray-900">
                                                                                 {parsedTerms.repaymentPeriod ? `${parsedTerms.repaymentPeriod} months` : 'N/A'}
                                                                             </span>
                                                                         </div>
                                                                         <div className="flex justify-between">
                                                                             <span className="font-medium text-gray-700">Interest Rate:</span>
                                                                             <span className="text-gray-900">
                                                                                 {parsedTerms.interestRate ? `${parsedTerms.interestRate}%` : 'N/A'}
                                                                             </span>
                                                                         </div>
                                                                         <div className="flex justify-between">
                                                                             <span className="text-sm font-medium text-gray-700">Monthly Installment:</span>
                                                                             <span className="text-sm text-gray-900">
                                                                                 {parsedTerms.monthlyInstallment || 'N/A'}
                                                                             </span>
                                                                         </div>
                                                                         <div className="flex justify-between">
                                                                             <span className="text-sm font-medium text-gray-700">Grace Period:</span>
                                                                             <span className="text-sm text-gray-900">
                                                                                 {parsedTerms.gracePeriod ? `${parsedTerms.gracePeriod} months` : 'N/A'}
                                                                             </span>
                                                                         </div>
                                                                         <div className="flex justify-between">
                                                                             <span className="text-sm font-medium text-gray-700">Submitted:</span>
                                                                             <span className="text-sm text-gray-900">
                                                                                 {new Date(offer.submitted_at).toLocaleDateString()}
                                                                             </span>
                                                                         </div>
                                                                     </div>

                                                                     {/* Relationship Manager Details */}
                                                                     {offer.bank_contact_person && (
                                                                         <div className="border-t pt-3 mb-3">
                                                                             <h6 className="text-sm font-medium text-gray-700 mb-2">Relationship Manager:</h6>
                                                                             <div className="text-sm text-gray-900">
                                                                                 {offer.bank_contact_person}
                                                                             </div>
                                                                         </div>
                                                                     )}

                                                                     {/* Offer Terms and Comments */}
                                                                     {offer.offer_terms && (
                                                                         <div className="border-t pt-3 mb-3">
                                                                             <h6 className="text-sm font-medium text-gray-700 mb-2">Full Offer Terms:</h6>
                                                                             <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                                                                 {offer.offer_terms}
                                                                             </div>
                                                                         </div>
                                                                     )}
                                                                     
                                                                     {offer.offer_comment && (
                                                                         <div className="border-t pt-3">
                                                                             <h6 className="text-sm font-medium text-gray-700 mb-2">Additional Comments:</h6>
                                                                             <div className="text-sm text-gray-900">
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
                                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Contact Information
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">Contact Person:</span>
                                                            <p className="text-sm text-gray-900">{selectedLead.contact_person || 'Not provided'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">Phone:</span>
                                                            <p className="text-sm text-gray-900">{selectedLead.contact_person_number || 'Not provided'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">Email:</span>
                                                            <p className="text-sm text-gray-900">business@nesbah.com</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes Section */}
                                            {selectedLead.notes && (
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                        <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Application Notes
                                                    </h4>
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                                            {selectedLead.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Uploaded Files Section */}
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Uploaded Files
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    {/* Application Files */}
                                                    <div className="mb-4">
                                                        <h5 className="text-md font-medium text-gray-800 mb-3">Application Documents</h5>
                                                        {selectedLead.uploaded_filename ? (
                                                            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                                                                <div className="flex items-center space-x-3">
                                                                    <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{selectedLead.uploaded_filename}</p>
                                                                        <p className="text-xs text-gray-500">Application Document</p>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    href={`/api/files/download/${selectedLead.application_id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                                >
                                                                    Download
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No application documents uploaded</p>
                                                        )}
                                                    </div>

                                                                                                        {/* Offer Files */}
                                                    <div>
                                                        <h5 className="text-md font-medium text-gray-800 mb-3">Offer Documents</h5>
                                                        {selectedLead.offers && selectedLead.offers.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {selectedLead.offers.map((offer, index) => (
                                                                    offer.uploaded_filename && (
                                                                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                                                                            <div className="flex items-center space-x-3">
                                                                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-gray-900">{offer.uploaded_filename}</p>
                                                                                    <p className="text-xs text-gray-500">Offer #{offer.id} - {offer.submitted_by_bank_name || 'Bank Offer'}</p>
                                                                                </div>
                                                                            </div>
                                                                            <a
                                                                                href={`/api/files/download/offer/${offer.id}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                                            >
                                                                                Download
                                                                            </a>
                                                                        </div>
                                                                    )
                                                                ))}
                                                                {!selectedLead.offers.some(offer => offer.uploaded_filename) && (
                                                                    <p className="text-sm text-gray-500 italic">No offer documents uploaded</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No offers submitted yet</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="mt-8 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                                    onClick={() => setShowUnmaskedInfo(false)}
                                                >
                                                    Close
                                                </button>
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
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    Submit Bank Offer - {selectedLead.trade_name}
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

                                                    {/* Repayment Period */}
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
                                                            Interest/Profit Rate (%) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={offerForm.interestRate}
                                                            onChange={(e) => setOfferForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="5.50"
                                                        />
                                                    </div>

                                                    {/* Monthly Installment */}
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
                                                            Grace Period (months) - Optional
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={offerForm.gracePeriod || ''}
                                                            onChange={(e) => setOfferForm(prev => ({ ...prev, gracePeriod: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                            placeholder="0 (if applicable)"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Relationship Manager Details */}
                                                <div className="border-t pt-6">
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Relationship Manager Contact Details</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={offerForm.relationshipManagerName}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerName: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="Full Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Phone Number *
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                required
                                                                value={offerForm.relationshipManagerPhone}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerPhone: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                                placeholder="+966 50 123 4567"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Email *
                                                            </label>
                                                            <input
                                                                type="email"
                                                                required
                                                                value={offerForm.relationshipManagerEmail}
                                                                onChange={(e) => setOfferForm(prev => ({ ...prev, relationshipManagerEmail: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={submittingOffer}
                                                        className="px-4 py-2 bg-purple-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(indexOfLastItem, purchasedLeads.length)}
                                                </span>{' '}
                                                of <span className="font-medium">{purchasedLeads.length}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Previous</span>
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
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="sr-only">Next</span>
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
        </div>
    )
}

import BankNavbar from '@/components/bankNavbar'
import { NewFooter } from '@/components/NewFooter'

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
