'use client'

import { useState, useEffect } from 'react'
import { 
    DocumentTextIcon, 
    BuildingOfficeIcon,
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    TrendingUpIcon,
    BanknotesIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ArrowPathIcon,
    CalendarIcon,
    StarIcon,
    EyeIcon,
    BoltIcon
} from '@heroicons/react/24/outline'
import { AnimatedNumber } from '@/components/animated-number'

export default function EnhancedAnalytics() {
    const [applicationsData, setApplicationsData] = useState(null)
    const [offersData, setOffersData] = useState(null)
    const [timeMetricsData, setTimeMetricsData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        fetchAllData()
    }, [timeRange, selectedDate])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const [applicationsResponse, offersResponse, timeMetricsResponse] = await Promise.all([
                fetch('/api/admin/applications/analytics', { credentials: 'include' }),
                fetch('/api/admin/offers/analytics', { credentials: 'include' }),
                fetch(`/api/admin/time-metrics?date=${selectedDate}`, { credentials: 'include' })
            ])
            
            const applicationsResult = await applicationsResponse.json()
            const offersResult = await offersResponse.json()
            const timeMetricsResult = await timeMetricsResponse.json()
            
            if (applicationsResult.success && offersResult.success && timeMetricsResult.success) {
                setApplicationsData(applicationsResult.data)
                setOffersData(offersResult.data)
                setTimeMetricsData(timeMetricsResult.data)
            } else {
                const errorMessage = applicationsResult.error || offersResult.error || timeMetricsResult.error || 'Failed to fetch analytics data'
                setError(errorMessage)
            }
        } catch (err) {
            console.error('Network error:', err)
            setError('Network error while fetching analytics data')
        } finally {
            setLoading(false)
        }
    }

    const calculateConversionRate = () => {
        if (!applicationsData || !offersData) return 0
        const totalApplications = applicationsData.total_applications || 0
        const totalOffers = offersData.total_offers || 0
        return totalApplications > 0 ? ((totalOffers / totalApplications) * 100).toFixed(1) : 0
    }

    const getAverageResponseTime = () => {
        if (!timeMetricsData || timeMetricsData.length === 0) return 0
        const totalTime = timeMetricsData.reduce((sum, bank) => sum + (bank.avg_response_time_minutes || 0), 0)
        return (totalTime / timeMetricsData.length).toFixed(1)
    }

    const getAverageOfferTime = () => {
        if (!timeMetricsData || timeMetricsData.length === 0) return 0
        const totalTime = timeMetricsData.reduce((sum, bank) => sum + (bank.avg_offer_submission_time_minutes || 0), 0)
        return (totalTime / timeMetricsData.length).toFixed(1)
    }

    const getTopPerformingBank = () => {
        if (!timeMetricsData || timeMetricsData.length === 0) return null
        return timeMetricsData.reduce((top, bank) => 
            (bank.conversion_rate || 0) > (top.conversion_rate || 0) ? bank : top
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
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
            <div className="text-center py-12">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchAllData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics Dashboard</h2>
                    <p className="text-gray-600">Comprehensive insights into application performance and bank behavior</p>
                </div>
                <div className="flex items-center space-x-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={fetchAllData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Application Conversion Rate */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {calculateConversionRate()}%
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Offers submitted / Total applications
                    </p>
                </div>

                {/* Average Response Time */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <BoltIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {getAverageResponseTime()} min
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Time to view application
                    </p>
                </div>

                {/* Average Offer Time */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <ClockIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Avg Offer Time</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {getAverageOfferTime()} min
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Time to submit offer
                    </p>
                </div>

                {/* Total Applications */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Applications</p>
                            <p className="text-2xl font-bold text-gray-900">
                                <AnimatedNumber value={applicationsData?.total_applications || 0} />
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        All time applications
                    </p>
                </div>
            </div>

            {/* Bank Performance Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Bank Performance Metrics</h3>
                    <p className="text-sm text-gray-600">Detailed performance metrics for each bank</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Applications Viewed
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Offers Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Conversion Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Response Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg Offer Time
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {timeMetricsData && timeMetricsData.length > 0 ? (
                                timeMetricsData.map((bank) => (
                                    <tr key={bank.bank_user_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {bank.bank_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {bank.bank_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bank.total_applications || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bank.applications_with_offers || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                (bank.conversion_rate || 0) >= 50 ? 'bg-green-100 text-green-800' :
                                                (bank.conversion_rate || 0) >= 25 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {(bank.conversion_rate || 0).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(bank.avg_response_time_minutes || 0).toFixed(1)} min
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(bank.avg_offer_submission_time_minutes || 0).toFixed(1)} min
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <p className="text-lg font-medium">No bank metrics available</p>
                                        <p className="text-sm">Bank performance data will appear here once available</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Performing Bank Highlight */}
            {getTopPerformingBank() && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                🏆 Top Performing Bank
                            </h3>
                            <p className="text-gray-600">
                                <strong>{getTopPerformingBank().bank_name}</strong> leads with a{' '}
                                <strong>{(getTopPerformingBank().conversion_rate || 0).toFixed(1)}%</strong> conversion rate
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                                {(getTopPerformingBank().conversion_rate || 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">Conversion Rate</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status Distribution</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">Live Auctions</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {applicationsData?.status_distribution?.live_auction || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">Approved Leads</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {applicationsData?.status_distribution?.approved_leads || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-600">Completed</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {applicationsData?.status_distribution?.complete || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Offers Submitted</span>
                            <span className="text-sm font-medium text-gray-900">
                                {offersData?.total_offers || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Average Offers per Application</span>
                            <span className="text-sm font-medium text-gray-900">
                                {applicationsData?.total_applications > 0 ? 
                                    (offersData?.total_offers / applicationsData?.total_applications).toFixed(1) : 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Banks</span>
                            <span className="text-sm font-medium text-gray-900">
                                {timeMetricsData?.length || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
