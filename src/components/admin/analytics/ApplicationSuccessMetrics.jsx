'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    CheckCircleIcon, 
    StarIcon
} from '@heroicons/react/24/outline'

export default function ApplicationSuccessMetrics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    const fetchSuccessMetricsData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null) // Clear any previous errors
            setData(null) // Clear any previous data
            console.log('🔍 ApplicationSuccessMetrics: Fetching data for timeRange:', timeRange)
            
            const response = await fetch(`/api/admin/analytics/application-success?timeRange=${timeRange}`, {
                credentials: 'include'
            })
            const result = await response.json()
            
            console.log('🔍 ApplicationSuccessMetrics: API response:', result)
            console.log('🔍 ApplicationSuccessMetrics: Response success:', result.success)
            console.log('🔍 ApplicationSuccessMetrics: Response data:', result.data)
            
            if (result.success) {
                setData(result.data)
                console.log('✅ ApplicationSuccessMetrics: Data set successfully')
            } else {
                console.log('❌ ApplicationSuccessMetrics: API returned error:', result.error)
                setError(result.error || 'Failed to fetch success metrics data')
            }
        } catch (err) {
            console.error('❌ ApplicationSuccessMetrics: Network error:', err)
            setError('Network error while fetching success metrics data')
        } finally {
            setLoading(false)
        }
    }, [timeRange])

    useEffect(() => {
        console.log('🔍 ApplicationSuccessMetrics: useEffect triggered, timeRange:', timeRange)
        fetchSuccessMetricsData()
    }, [fetchSuccessMetricsData])

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Success Metrics</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchSuccessMetricsData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!data) return null

    const { 
        offer_fulfillment, 
        multi_offer_rate, 
        multi_offer_breakdown
    } = data

    // Debug: Log the multi-offer breakdown data
    console.log('🔍 ApplicationSuccessMetrics: multi_offer_breakdown:', multi_offer_breakdown)
    console.log('🔍 ApplicationSuccessMetrics: multi_offer_rate:', multi_offer_rate)
    console.log('🔍 ApplicationSuccessMetrics: offer_fulfillment:', offer_fulfillment)

    return (
        <div className="p-8">
            {/* Header with back button and time range selector */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">Application Success Metrics</h1>
                </div>
                
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="all">All time</option>
                    </select>
                    <button
                        onClick={fetchSuccessMetricsData}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Success Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Offer Fulfillment Rate</p>
                            <p className="text-3xl font-bold">{(() => {
                                const rate = offer_fulfillment?.fulfillment_rate;
                                return (rate !== null && rate !== undefined && !isNaN(rate) && isFinite(rate)) ? `${rate}%` : '0%';
                            })()}</p>
                            <p className="text-green-100 text-sm mt-1">
                                {(() => {
                                    const offers = offer_fulfillment?.applications_with_offers;
                                    const total = offer_fulfillment?.total_applications;
                                    const safeOffers = (offers !== null && offers !== undefined && !isNaN(offers) && isFinite(offers)) ? offers : 0;
                                    const safeTotal = (total !== null && total !== undefined && !isNaN(total) && isFinite(total)) ? total : 0;
                                    return `${safeOffers} of ${safeTotal}`;
                                })()}
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Multi-Offer Rate</p>
                            <p className="text-3xl font-bold">{(() => {
                                const rate = multi_offer_rate?.multi_offer_rate;
                                return (rate !== null && rate !== undefined && !isNaN(rate) && isFinite(rate)) ? `${rate}%` : '0%';
                            })()}</p>
                            <p className="text-blue-100 text-sm mt-1">
                                {(() => {
                                    const count = multi_offer_rate?.applications_with_multiple_offers;
                                    const safeCount = (count !== null && count !== undefined && !isNaN(count) && isFinite(count)) ? count : 0;
                                    return `${safeCount} applications`;
                                })()}
                            </p>
                        </div>
                        <StarIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>


                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Success Rate</p>
                            <p className="text-3xl font-bold">{(() => {
                                const rate = offer_fulfillment?.success_rate;
                                return (rate !== null && rate !== undefined && !isNaN(rate) && isFinite(rate)) ? `${rate}%` : '0%';
                            })()}</p>
                            <p className="text-orange-100 text-sm mt-1">
                                Completed applications
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Offer Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Multi-Offer Applications */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <StarIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Multi-Offer Applications
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Applications with Multiple Offers</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {(() => {
                                    const count = multi_offer_rate?.applications_with_multiple_offers;
                                    return (count !== null && count !== undefined && !isNaN(count) && isFinite(count)) ? count : 0;
                                })()}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">2 Offers</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {(() => {
                                        const item = multi_offer_breakdown?.find(item => item.offers_count === 2);
                                        const count = item?.application_count;
                                        return (count !== null && count !== undefined && !isNaN(count) && isFinite(count)) ? count : 0;
                                    })()}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600">3+ Offers</p>
                                <p className="text-lg font-semibold text-purple-700">
                                    {multi_offer_breakdown?.filter(item => item.offers_count >= 3).reduce((sum, item) => {
                                        const count = parseInt(item.application_count) || 0;
                                        return sum + (isNaN(count) ? 0 : count);
                                    }, 0) || 0}
                                </p>
                            </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Multi-Offer Rate</p>
                            <p className="text-lg font-semibold text-orange-700">
                                {(() => {
                                    const rate = multi_offer_rate?.multi_offer_rate;
                                    return (rate !== null && rate !== undefined && !isNaN(rate) && isFinite(rate)) ? `${rate}%` : '0%';
                                })()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Single-Offer Applications */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Single-Offer Applications
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Applications with 1 Offer</p>
                            <p className="text-2xl font-bold text-green-700">
                                {(() => {
                                    const totalOffers = offer_fulfillment?.applications_with_offers || 0;
                                    const multiOffers = multi_offer_rate?.applications_with_multiple_offers || 0;
                                    const singleOffers = totalOffers - multiOffers;
                                    return singleOffers < 0 ? 0 : singleOffers;
                                })()}
                            </p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600">Single-Offer Rate</p>
                            <p className="text-lg font-semibold text-blue-700">
                                {(() => {
                                    const totalApps = offer_fulfillment?.total_applications || 0;
                                    const singleOfferApps = (offer_fulfillment?.applications_with_offers || 0) - (multi_offer_rate?.applications_with_multiple_offers || 0);
                                    if (totalApps === 0) return '0%';
                                    const rate = Math.round((singleOfferApps / totalApps) * 100);
                                    return isNaN(rate) || !isFinite(rate) ? '0%' : `${rate}%`;
                                })()}
                            </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Applications without Offers</p>
                            <p className="text-lg font-semibold text-gray-700">
                                {(() => {
                                    const count = offer_fulfillment?.applications_without_offers;
                                    return (count !== null && count !== undefined && !isNaN(count) && isFinite(count)) ? count : 0;
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>






        </div>
    )
}
