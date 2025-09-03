'use client'

import { useState, useEffect } from 'react'
import { 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon,
    ArrowPathIcon,
    ChartBarIcon,
    CalendarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function ApplicationFlowTracking() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchFlowTrackingData()
    }, [timeRange])

    const fetchFlowTrackingData = async () => {
        try {
            const response = await fetch(`/api/admin/analytics/application-flow?timeRange=${timeRange}`, {
                credentials: 'include'
            })
            
            if (!response.ok) {
                throw new Error('Failed to fetch flow tracking data')
            }
            
            const result = await response.json()
            console.log('🔍 ApplicationFlowTracking: API response:', result)
            console.log('🔍 ApplicationFlowTracking: Data structure:', result.data)
            console.log('🔍 ApplicationFlowTracking: Total applications:', result.data?.total_applications)
            setData(result)
        } catch (error) {
            console.error('Error fetching flow tracking data:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-12">
                Error: {error}
            </div>
        )
    }

    if (!data) return null

    // Extract data from the API response structure
    const analyticsData = data.data || data
    const { status_progression, auction_performance, abandonment_rate, status_duration, total_applications } = analyticsData

    return (
        <div className="p-8">
            {/* Header with time range selector */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">Application Flow Tracking</h1>
                </div>
                
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm antialiased"
                    >
                        <option value="7d" className="font-medium">Last 7 days</option>
                        <option value="30d" className="font-medium">Last 30 days</option>
                        <option value="90d" className="font-medium">Last 90 days</option>
                        <option value="1y" className="font-medium">Last year</option>
                    </select>
                    <button
                        onClick={fetchFlowTrackingData}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Progression Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Applications Card */}
                <div className="bg-yellow-100 rounded-lg p-6 border border-yellow-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-700 text-sm font-medium">Total Applications</p>
                            <p className="text-3xl font-bold text-yellow-800">{analyticsData.total_applications || 0}</p>
                            <p className="text-yellow-600 text-sm mt-1">
                                In selected period
                            </p>
                        </div>
                        <ChartBarIcon className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>

                {/* Live Auction Card */}
                <div className="bg-blue-100 rounded-lg p-6 border border-blue-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-700 text-sm font-medium">Live Auction</p>
                            <p className="text-3xl font-bold text-blue-800">{analyticsData.status_progression?.live_auction || 0}</p>
                            <p className="text-blue-600 text-sm mt-1">
                                {analyticsData.status_progression?.live_auction_percentage || 0}% of total
                            </p>
                        </div>
                        <ArrowPathIcon className="h-12 w-12 text-blue-500" />
                    </div>
                </div>

                {/* Completed Card */}
                <div className="bg-green-100 rounded-lg p-6 border border-green-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-700 text-sm font-medium">Completed</p>
                            <p className="text-3xl font-bold text-green-800">{analyticsData.status_progression?.completed || 0}</p>
                            <p className="text-green-600 text-sm mt-1">
                                {analyticsData.status_progression?.completed_percentage || 0}% completion rate
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    </div>
                </div>

                {/* Ignored Card */}
                <div className="bg-red-100 rounded-lg p-6 border border-red-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-700 text-sm font-medium">Ignored</p>
                            <p className="text-3xl font-bold text-red-800">{analyticsData.status_progression?.ignored || 0}</p>
                            <p className="text-red-600 text-sm mt-1">
                                {analyticsData.status_progression?.ignored_percentage || 0}% ignored rate
                            </p>
                        </div>
                        <XCircleIcon className="h-12 w-12 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Additional Status Cards */}
            {analyticsData.status_progression?.expired > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-orange-100 rounded-lg p-6 border border-orange-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-700 text-sm font-medium">Expired</p>
                                <p className="text-3xl font-bold text-orange-800">{analyticsData.status_progression?.expired || 0}</p>
                                <p className="text-orange-600 text-sm mt-1">
                                    {analyticsData.status_progression?.expired_percentage || 0}% expired rate
                                </p>
                            </div>
                            <ExclamationTriangleIcon className="h-12 w-12 text-orange-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Analytics Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Auction Performance */}
                {analyticsData.auction_performance && (
                    <div className="rounded-lg p-6 border">
                        <h3 className="text-lg font-semibold text-black-800 mb-4">Auction Performance</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">Total Applications:</span>
                                <span className="font-semibold text-black-800">{analyticsData.auction_performance.total_applications || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">With Offers:</span>
                                <span className="font-semibold text-black-800">{analyticsData.auction_performance.applications_with_offers || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">Offer Rate:</span>
                                <span className="font-semibold text-black-800">{analyticsData.auction_performance.offer_rate || 0}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ignored Rate */}
                {analyticsData.abandonment_rate && (
                    <div className="rounded-lg p-6 border">
                        <h3 className="text-lg font-semibold text-black-800 mb-4">Ignored Analysis</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">Total Applications:</span>
                                <span className="font-semibold text-black-800">{analyticsData.abandonment_rate.total_applications || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">Ignored:</span>
                                <span className="font-semibold text-black-800">{analyticsData.abandonment_rate.abandoned_applications || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-black-700">Ingore Rate:</span>
                                <span className="font-semibold text-black-800">{analyticsData.abandonment_rate.abandonment_rate || 0}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
