'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    CheckCircleIcon, 
    StarIcon, 
    ClockIcon
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
        multi_offer_breakdown,
        completion_velocity
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
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Offer Fulfillment Rate</p>
                            <p className="text-3xl font-bold">{offer_fulfillment?.fulfillment_rate || 0}%</p>
                            <p className="text-green-100 text-sm mt-1">
                                {offer_fulfillment?.applications_with_offers || 0} of {offer_fulfillment?.total_applications || 0}
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Multi-Offer Rate</p>
                            <p className="text-3xl font-bold">{multi_offer_rate?.multi_offer_rate || 0}%</p>
                            <p className="text-blue-100 text-sm mt-1">
                                {multi_offer_rate?.applications_with_multiple_offers || 0} applications
                            </p>
                        </div>
                        <StarIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Avg Completion Time</p>
                            <p className="text-3xl font-bold">{completion_velocity?.avg_completion_hours || 0}h</p>
                            <p className="text-purple-100 text-sm mt-1">
                                Fastest: {completion_velocity?.min_completion_hours || 0}h
                            </p>
                        </div>
                        <ClockIcon className="h-12 w-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Success Rate</p>
                            <p className="text-3xl font-bold">{offer_fulfillment?.success_rate || 0}%</p>
                            <p className="text-orange-100 text-sm mt-1">
                                Completed applications
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Offer Fulfillment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Offer Fulfillment Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-900">Applications with Offers</span>
                            <span className="text-lg font-semibold text-green-700">
                                {offer_fulfillment?.applications_with_offers || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">Applications without Offers</span>
                            <span className="text-lg font-semibold text-blue-700">
                                {offer_fulfillment?.applications_without_offers || 0}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-900">Total Applications</span>
                            <span className="text-lg font-semibold text-purple-700">
                                {offer_fulfillment?.total_applications || 0}
                            </span>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Fulfillment Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {offer_fulfillment?.fulfillment_rate || 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Multi-Offer Analysis */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <StarIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Multi-Offer Analysis
                    </h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Applications with Multiple Offers</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {multi_offer_rate?.applications_with_multiple_offers || 0}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">2 Offers</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {multi_offer_breakdown?.find(item => item.offers_count === 2)?.application_count || 0}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600">3+ Offers</p>
                                <p className="text-lg font-semibold text-purple-700">
                                    {multi_offer_breakdown?.filter(item => item.offers_count >= 3).reduce((sum, item) => sum + parseInt(item.application_count), 0) || 0}
                                </p>
                            </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600">Multi-Offer Rate</p>
                            <p className="text-lg font-semibold text-orange-700">
                                {multi_offer_rate?.multi_offer_rate || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Completion Velocity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Application Completion Velocity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Average Completion Time</p>
                        <p className="text-xl font-bold text-blue-700">
                            {completion_velocity?.avg_completion_hours || 0} hours
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            From submission to completion
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Fastest Completion</p>
                        <p className="text-xl font-bold text-green-700">
                            {completion_velocity?.min_completion_hours || 0} hours
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            Best performance
                        </p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">Slowest Completion</p>
                        <p className="text-xl font-bold text-red-700">
                            {completion_velocity?.max_completion_hours || 0} hours
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            Needs attention
                        </p>
                    </div>
                </div>
            </div>





        </div>
    )
}
