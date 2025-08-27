'use client'

import { useState, useEffect } from 'react'
import { 
    BuildingOfficeIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    BanknotesIcon,
    StarIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'
import { ArrowUpIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { animatedNumber } from '@/components/animated-number'

export default function OffersAnalytics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    useEffect(() => {
        fetchOffersData()
    }, [timeRange])

    const fetchOffersData = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/offers/analytics', {
                credentials: 'include'
            })
            const result = await response.json()
            
            if (result.success) {
                setData(result.data)
            } else {
                setError(result.error || 'Failed to fetch offers data')
            }
        } catch (err) {
            setError('Network error while fetching offers data')
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
                    onClick={fetchOffersData}
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
        by_bank, 
        by_business, 
        trends, 
        average_metrics, 
        offer_processing_time = {}, 
        bank_response_time = {}, 
        user_acceptance_time = {}, 
        offer_window_times = {}, 
        recent_activity = [], 
        featured_offers = [] 
    } = data

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Offers Analytics</h2>
                    <p className="text-gray-600 mt-1">Bank offer performance and conversion rate analysis</p>
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
                        onClick={fetchOffersData}
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
                            <p className="text-blue-100 text-sm font-medium">Total Offers</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_offers)}</p>
                            <p className="text-blue-100 text-sm mt-1">
                                +{summary.recent_offers} this month
                            </p>
                        </div>
                        <BuildingOfficeIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Won Deals</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_won_offers)}</p>
                            <p className="text-green-100 text-sm mt-1">
                                {summary.overall_win_rate}% win rate
                            </p>
                        </div>
                        <CheckCircleIcon className="h-12 w-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Lost Deals</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_lost_offers)}</p>
                            <p className="text-red-100 text-sm mt-1">
                                {Math.round((summary.total_lost_offers / summary.total_offers) * 100)}% loss rate
                            </p>
                        </div>
                        <XCircleIcon className="h-12 w-12 text-red-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold">{animatedNumber(summary.total_pending_offers)}</p>
                            <p className="text-yellow-100 text-sm mt-1">
                                Awaiting response
                            </p>
                        </div>
                        <ClockIcon className="h-12 w-12 text-yellow-200" />
                    </div>
                </div>
            </div>

            {/* Average Metrics and Time Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Average Offer Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Average Offer Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Setup Fee</p>
                            <p className="text-xl font-bold text-blue-700">
                                SAR {average_metrics.avg_setup_fee || 0}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Mada Fee</p>
                            <p className="text-xl font-bold text-green-700">
                                {average_metrics.avg_mada_fee || 0}%
                            </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Visa/MC Fee</p>
                            <p className="text-xl font-bold text-purple-700">
                                {average_metrics.avg_visa_mc_fee || 0}%
                            </p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-600 font-medium">Settlement Time</p>
                            <p className="text-xl font-bold text-orange-700">
                                {average_metrics.avg_settlement_time || 0} days
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Status Distribution</h3>
                    <div className="space-y-4">
                        {by_status.map((status) => {
                            const percentage = Math.round((status.count / summary.total_offers) * 100)
                            const color = status.status === 'deal_won' ? 'bg-green-500' :
                                         status.status === 'deal_lost' ? 'bg-red-500' :
                                         status.status === 'submitted' ? 'bg-yellow-500' : 'bg-gray-500'
                            
                            return (
                                <div key={status.status} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                            {status.status.replace('_', ' ')}
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
            </div>

            {/* Time Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Offer Processing Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Processing Time</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Average Processing Time</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {offer_processing_time.avg_offer_processing_hours || 0} hours
                                </p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {offer_processing_time.min_offer_processing_hours || 0} hours
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {offer_processing_time.max_offer_processing_hours || 0} hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Response Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Response Time</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-green-900">Average Response Time</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {bank_response_time.avg_bank_response_hours || 0} hours
                                </p>
                            </div>
                            <ArrowUpIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {bank_response_time.min_bank_response_hours || 0} hours
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {bank_response_time.max_bank_response_hours || 0} hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Time Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* User Acceptance Time */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Acceptance Time</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-purple-900">Average Acceptance Time</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {user_acceptance_time.avg_user_acceptance_hours || 0} hours
                                </p>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Fastest</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {user_acceptance_time.min_user_acceptance_hours || 0} hours
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Slowest</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {user_acceptance_time.max_user_acceptance_hours || 0} hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Window Times */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Selection Window</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-orange-900">Average Window Duration</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {offer_window_times.avg_offer_window_hours || 0} hours
                                </p>
                            </div>
                            <CalendarIcon className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Min</p>
                                <p className="text-lg font-semibold text-green-700">
                                    {offer_window_times.min_offer_window_hours || 0} hours
                                </p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Max</p>
                                <p className="text-lg font-semibold text-red-700">
                                    {offer_window_times.max_offer_window_hours || 0} hours
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank and Business Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Performing Banks */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BanknotesIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Top Performing Banks
                    </h3>
                    <div className="space-y-3">
                        {by_bank.slice(0, 8).map((bank, index) => (
                            <div key={bank.bank_user_id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{bank.bank_name}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {bank.win_rate}% win rate
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {bank.total_offers}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Businesses by Offers */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Businesses with Most Offers
                    </h3>
                    <div className="space-y-3">
                        {by_business.slice(0, 8).map((business, index) => (
                            <div key={business.application_id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                                    <span className="text-sm font-medium text-gray-900">{business.business_name}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {business.won_offers} won
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {business.total_offers}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Offers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <StarIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Featured Offers
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Featured Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {featured_offers.map((offer) => (
                                <tr key={offer.offer_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {offer.business_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {offer.bank_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`
                                            inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                            ${offer.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                              offer.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'}
                                        `}>
                                            {offer.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {offer.featured_reason || 'High value deal'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(offer.submitted_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ArrowUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Recent Offer Activity
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Business
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Setup Fee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mada Fee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recent_activity.map((offer) => (
                                <tr key={offer.offer_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {offer.business_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {offer.bank_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`
                                            inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                            ${offer.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                              offer.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'}
                                        `}>
                                            {offer.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {offer.offer_device_setup_fee ? `SAR ${offer.offer_device_setup_fee}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {offer.offer_transaction_fee_mada ? `${offer.offer_transaction_fee_mada}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(offer.submitted_at).toLocaleDateString()}
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
