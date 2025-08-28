'use client'

import { useState, useEffect } from 'react'
import { 
    CheckCircleIcon, 
    DocumentIcon, 
    BanknotesIcon, 
    EyeIcon,
    ClockIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

export default function BankOffersDisplay({ userInfo, applicationStatus }) {
    const { t } = useLanguage()
    const router = useRouter()
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

    const handleViewOfferDetails = (offer) => {
        // Navigate to offer details page
        router.push(`/offers/${offer.offer_id}`)
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
                                            <button
                                                onClick={() => handleViewOfferDetails(offer)}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-2" />
                                                {t('offers.viewDetails')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="px-6 py-4">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                            <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                            {t('offers.financialSummary')}
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {offer.offer_device_setup_fee && (
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                                                    <div className="text-xs font-medium text-blue-700 mb-1">{t('offers.setupFee')}</div>
                                                    <div className="text-sm font-bold text-blue-900">
                                                        SAR {offer.offer_device_setup_fee}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {offer.offer_transaction_fee_mada && (
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                                                    <div className="text-xs font-medium text-green-700 mb-1">{t('offers.madaFee')}</div>
                                                    <div className="text-sm font-bold text-green-900">
                                                        {offer.offer_transaction_fee_mada}%
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {offer.offer_transaction_fee_visa_mc && (
                                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                                                    <div className="text-xs font-medium text-purple-700 mb-1">{t('offers.visaMcFee')}</div>
                                                    <div className="text-sm font-bold text-purple-900">
                                                        {offer.offer_transaction_fee_visa_mc}%
                                                    </div>
                                                </div>
                                            )}

                                            {offer.deal_value && (
                                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                                                    <div className="text-xs font-medium text-orange-700 mb-1">{t('offers.dealValue')}</div>
                                                    <div className="text-sm font-bold text-orange-900">
                                                        SAR {offer.deal_value}
                                                    </div>
                                                </div>
                                            )}
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
