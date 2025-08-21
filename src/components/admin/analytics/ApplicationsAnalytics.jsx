'use client'

import { useState, useEffect } from 'react'
import { 
    DocumentTextIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    TrendingUpIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    UserIcon,
    CalendarIcon
} from '@heroicons/react/24/outline'
import { animatedNumber } from '@/components/animated-number'

export default function ApplicationsAnalytics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchApplicationsData()
    }, [timeRange])

    const fetchApplicationsData = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/applications/analytics', {
                credentials: 'include'
            })
            const result = await response.json()
            
            if (result.success) {
                setData(result.data)
            } else {
                setError(result.error || 'Failed to fetch applications data')
            }
        } catch (err) {
            setError('Network error while fetching applications data')
        } finally {
            setLoading(false)
        }
    }

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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchApplicationsData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!data) return null

    const { 
        summary, 
        by_status, 
        by_city, 
        by_sector, 
        trends, 
        processing_time = {}, 
        auction_time_windows = {}, 
        purchase_to_offer_time = {}, 
        offer_window_metrics = {}, 
        recent_activity = [] 
    } = data

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Applications Analytics</h2>
                    <p className="text-gray-600 mt-1">Comprehensive insights into application performance and trends</p>
                </div>
                <div className="flex items-center space-x-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button
                        onClick={fetchApplicationsData}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_applications)}</p>
                            <p className="text-blue-100 text-sm mt-1">
                                +{summary.recent_applications} this month
                            </p>
                        </div>
                        <DocumentTextIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Approved</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_approved_applications)}</p>
                            <p className="text-green-100 text-sm mt-1">
                                {summary.overall_approval_rate}% approval rate
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Rejected</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_rejected_applications)}</p>
                            <p className="text-red-100 text-sm mt-1">
                                {Math.round((summary.total_rejected_applications / summary.total_applications) * 100)}% rejection rate
                            </p>
                        </div>
                        <XCircleIcon className="h-12 w-12 text-red-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_pending_applications)}</p>
                            <p className="text-yellow-100 text-sm mt-1">
                                Awaiting review
                            </p>
                        </div>
                        <ClockIcon className="h-12 w-12 text-yellow-200" />
                    </div>
                </div>
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Status Distribution Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Distribution</h3>
                    <div className="space-y-4">
                        {by_status.map((status) => {
                            const percentage = Math.round((status.count / summary.total_applications) * 100)
                            const color = status.status === 'completed' ? 'bg-green-500' :
                                         status.status === 'abandoned' ? 'bg-red-500' :
                                         status.status === 'submitted' ? 'bg-yellow-500' : 'bg-gray-500'
                            
                            return (
                                <div key={status.status} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                            {status.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${color.replace('bg-', 'bg-')}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Processing Time Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Time Analytics</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Average Processing Time</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {processing_time.avg_processing_days || 0} days
                                </p>
                            </div>
                            <CalendarIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {processing_time.min_processing_days || 0} days
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {processing_time.max_processing_days || 0} days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Window Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Auction Window Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Window Analytics</h3>
                    <div className="space-y-3">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Average Auction Duration</p>
                            <p className="text-xl font-bold text-purple-700">
                                {auction_time_windows.avg_auction_window_hours || 0} hours
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-green-50 rounded">
                                <p className="text-xs text-green-600">Min</p>
                                <p className="text-sm font-semibold text-green-700">
                                    {auction_time_windows.min_auction_window_hours || 0}h
                                </p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                                <p className="text-xs text-red-600">Max</p>
                                <p className="text-sm font-semibold text-red-700">
                                    {auction_time_windows.max_auction_window_hours || 0}h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase to Offer Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Response Time</h3>
                    <div className="space-y-3">
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Avg Purchase to Offer</p>
                            <p className="text-xl font-bold text-orange-700">
                                {purchase_to_offer_time.avg_purchase_to_offer_hours || 0} hours
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-green-50 rounded">
                                <p className="text-xs text-green-600">Fastest</p>
                                <p className="text-sm font-semibold text-green-700">
                                    {purchase_to_offer_time.min_purchase_to_offer_hours || 0}h
                                </p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                                <p className="text-xs text-red-600">Slowest</p>
                                <p className="text-sm font-semibold text-red-700">
                                    {purchase_to_offer_time.max_purchase_to_offer_hours || 0}h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Window Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Selection Window</h3>
                    <div className="space-y-3">
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-600 font-medium">Average Offer Window</p>
                            <p className="text-xl font-bold text-indigo-700">
                                {offer_window_metrics.avg_offer_window_hours || 0} hours
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="text-center p-2 bg-green-50 rounded">
                                <p className="text-xs text-green-600">Min</p>
                                <p className="text-sm font-semibold text-green-700">
                                    {offer_window_metrics.min_offer_window_hours || 0}h
                                </p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                                <p className="text-xs text-red-600">Max</p>
                                <p className="text-sm font-semibold text-red-700">
                                    {offer_window_metrics.max_offer_window_hours || 0}h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Geographic and Sector Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Cities */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Top Cities by Applications
                    </h3>
                    <div className="space-y-3">
                        {by_city.slice(0, 8).map((city, index) => (
                            <div key={city.city} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{city.city}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {city.completion_rate}% completion
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {city.total_applications}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Sectors */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Top Business Sectors
                    </h3>
                    <div className="space-y-3">
                        {by_sector.slice(0, 8).map((sector, index) => (
                            <div key={sector.sector} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {Math.round((sector.completed_applications / sector.total_applications) * 100)}% completion
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {sector.total_applications}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Recent Application Activity
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    City
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sector
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Offers
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recent_activity.map((app) => (
                                <tr key={app.application_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {app.business_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.city}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.sector}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`
                                            inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                            ${app.status === 'completed' ? 'bg-green-100 text-green-800' :
                                              app.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'}
                                        `}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.offers_count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.revenue_collected ? `SAR ${app.revenue_collected}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(app.submitted_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
