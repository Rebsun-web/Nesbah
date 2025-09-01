'use client'

import { useState, useEffect } from 'react'
import { 
    CheckCircleIcon, 
    DocumentIcon, 
    BanknotesIcon, 
    ClockIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BankOffersDisplay({ userInfo, applicationStatus }) {
    const { t } = useLanguage()
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastRefreshed, setLastRefreshed] = useState(null)
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [offersPerPage] = useState(10)

    useEffect(() => {
        if (userInfo?.user_id) {
            fetchOffers()
        }
    }, [userInfo])

    const fetchOffers = async () => {
        try {
            setLoading(true)
            console.log('🔍 Fetching offers for user:', userInfo.user_id)
            
            const response = await fetch(`/api/posApplication/${userInfo.user_id}/response`)
            console.log('📡 Response status:', response.status)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('📊 Offers data:', data)
            
            if (data.offers && Array.isArray(data.offers)) {
                console.log(`✅ Received ${data.offers.length} offers from API`)
                setOffers(data.offers)
                setLastRefreshed(new Date())
            } else {
                console.log('⚠️ No offers data received from API')
                setOffers([])
            }
        } catch (err) {
            console.error('❌ Failed to fetch offers:', err)
            setError(t('offers.failedToLoad'))
            setOffers([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    // Pagination logic
    const indexOfLastOffer = currentPage * offersPerPage
    const indexOfFirstOffer = indexOfLastOffer - offersPerPage
    const currentOffers = offers.slice(indexOfFirstOffer, indexOfLastOffer)
    const totalPages = Math.ceil(offers.length / offersPerPage)

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="w-full">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-8"></div>
                    <div className="space-y-6">
                        <div className="h-32 bg-slate-200 rounded-xl"></div>
                        <div className="h-32 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                            <BanknotesIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Offers</h3>
                        <p className="text-slate-600 mb-6">{error}</p>
                        <button
                            onClick={fetchOffers}
                            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (offers.length === 0) {
        return (
            <div className="w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                    <BanknotesIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Bank Offers</h1>
                                    <p className="text-indigo-100 text-sm">Review and compare offers</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={fetchOffers}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                                >
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    Refresh
                                </button>
                                {applicationStatus === 'live_auction' && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-xs font-medium text-yellow-900">
                                        {t('offers.liveAuction')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
                                <BuildingOfficeIcon className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {applicationStatus === 'live_auction' 
                                    ? t('offers.liveAuctionInProgress')
                                    : t('offers.noOffersAvailable')
                                }
                            </h3>
                            <p className="text-slate-600 max-w-md mx-auto">
                                {applicationStatus === 'live_auction' 
                                    ? t('offers.banksReviewing')
                                    : t('offers.noOffersSubmitted')
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <BanknotesIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{t('offers.bankOffersReceived')}</h1>
                                <p className="text-indigo-100">{t('offers.compareOffers')}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchOffers}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
                            >
                                <ClockIcon className="h-4 w-4 mr-2" />
                                {t('common.refresh')}
                            </button>
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center rounded-full bg-green-400 px-3 py-1 text-sm font-medium text-white">
                                    {offers.length} {offers.length === 1 ? t('offers.offer') : t('offers.offers')}
                                </span>
                                {applicationStatus === 'live_auction' && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-400 px-3 py-1 text-sm font-medium text-yellow-900">
                                        {t('offers.liveAuction')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            {applicationStatus === 'live_auction' 
                                ? t('offers.liveAuctionDescription')
                                : t('offers.reviewOffersDescription')
                            }
                        </p>
                        {lastRefreshed && (
                            <p className="text-xs text-slate-500">
                                {t('common.lastUpdated')}: {lastRefreshed.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Offers Content */}
                <div className="px-8 py-6">
                    <div className="space-y-6">
                        {currentOffers.map((offer, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                                {/* Offer Header */}
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {offer.bank_name || t('offers.bankOffer')}
                                                </h3>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <span className="text-sm text-slate-500">
                                                        {t('offers.submitted')}: {new Date(offer.submitted_at).toLocaleDateString()}
                                                    </span>
                                                    {offer.offer_validity_days && (
                                                        <span className="text-sm text-slate-500">
                                                            {t('offers.validFor')}: {offer.offer_validity_days} {t('offers.days')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {offer.is_featured && (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                                                    ⭐ {t('offers.featured')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Financing Terms - Required Fields Only */}
                                <div className="px-6 py-6 bg-white">
                                    <h4 className="text-lg font-semibold text-black mb-6 flex items-center">
                                        <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        Required Financing Fields
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Approved Financing Amount */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Approved Financing Amount (SAR)</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.approved_financing_amount ? 
                                                        `SAR ${parseFloat(offer.approved_financing_amount).toLocaleString()}` : 
                                                        'SAR 0'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Repayment Period */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Proposed Repayment Period (months)</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.proposed_repayment_period_months ? 
                                                        `${offer.proposed_repayment_period_months} months` : 
                                                        'N/A'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Interest Rate */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Interest/Profit Rate (%)</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.interest_rate ? 
                                                        `${offer.interest_rate}%` : 
                                                        '0.00%'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Monthly Installment */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Monthly Installment (SAR)</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.monthly_installment_amount ? 
                                                        `SAR ${parseFloat(offer.monthly_installment_amount).toLocaleString()}` : 
                                                        'SAR 0'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Grace Period */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Grace Period (optional)</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.grace_period_months && offer.grace_period_months > 0 ? 
                                                        `${offer.grace_period_months} months` : 
                                                        'Not applicable'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Relationship Manager */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Relationship Manager Contact</div>
                                                <div className="text-lg font-semibold text-black mb-1">
                                                    {offer.relationship_manager_name || offer.bank_contact_person || 'N/A'}
                                                </div>
                                                {offer.relationship_manager_phone && (
                                                    <div className="text-sm text-gray-600">📞 {offer.relationship_manager_phone}</div>
                                                )}
                                                {offer.relationship_manager_email && (
                                                    <div className="text-sm text-gray-600">✉️ {offer.relationship_manager_email}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Document Upload */}
                                        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-600">Supporting Documents</div>
                                                <div className="text-lg font-semibold text-black">
                                                    {offer.uploaded_filename ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm text-gray-700">{offer.uploaded_filename}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => window.open(`/api/offers/${offer.offer_id}/document`, '_blank')}
                                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                                                            >
                                                                Download
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No documents uploaded</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    {t('offers.showing')} {indexOfFirstOffer + 1} {t('offers.to')} {Math.min(indexOfLastOffer, offers.length)} {t('offers.of')} {offers.length} {offers.length === 1 ? t('offers.offer') : t('offers.offers')}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4" />
                                        {t('common.previous')}
                                    </button>
                                    
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                                    currentPage === page
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-slate-500 bg-white border border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {t('common.next')}
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-start space-x-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                            <DocumentIcon className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 mb-1">{t('offers.nextSteps')}</h4>
                            <p className="text-sm text-slate-600">
                                {t('offers.nextStepsDescription')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
