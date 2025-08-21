'use client'

import { useState, useEffect } from 'react'
import { 
    CurrencyDollarIcon, 
    ChartBarIcon, 
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    StarIcon,
    BuildingOfficeIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline'
import { 
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
    ClockIcon as ClockSolid
} from '@heroicons/react/24/solid'

export default function OfferAnalytics() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOfferAnalytics()
    }, [])

    const fetchOfferAnalytics = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/offers/analytics')
            const data = await response.json()
            
            if (data.success) {
                setAnalytics(data.data)
            } else {
                setError(data.error || 'Failed to fetch offer analytics')
            }
        } catch (err) {
            setError('Network error while fetching offer analytics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                    <div className="text-red-500 text-2xl mb-2">⚠️</div>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchOfferAnalytics}
                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!analytics) return null

    const getStatusIcon = (status) => {
        switch (status) {
            case 'deal_won':
                return CheckCircleSolid
            case 'deal_lost':
                return XCircleSolid
            case 'submitted':
                return ClockSolid
            default:
                return ExclamationTriangleIcon
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'deal_won':
                return 'text-green-600'
            case 'deal_lost':
                return 'text-red-600'
            case 'submitted':
                return 'text-yellow-600'
            default:
                return 'text-gray-600'
        }
    }

    const getStatusBgColor = (status) => {
        switch (status) {
            case 'deal_won':
                return 'bg-green-100'
            case 'deal_lost':
                return 'bg-red-100'
            case 'submitted':
                return 'bg-yellow-100'
            default:
                return 'bg-gray-100'
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Offers
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {analytics.summary.total_offers}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Won Offers
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {analytics.summary.total_won_offers}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Win Rate
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {analytics.summary.overall_win_rate}%
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Recent Offers
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {analytics.summary.recent_offers}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Offer Status Breakdown */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Offers by Status</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {analytics.by_status.map((status) => {
                            const Icon = getStatusIcon(status.status)
                            const color = getStatusColor(status.status)
                            const bgColor = getStatusBgColor(status.status)
                            
                            return (
                                <div key={status.status} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <div className={`p-2 rounded-lg ${bgColor}`}>
                                            <Icon className={`h-6 w-6 ${color}`} />
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-lg font-medium text-gray-900 capitalize">
                                                {status.status.replace('_', ' ')}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {status.count} total offers
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Recent (30 days):</span>
                                            <span className="font-medium text-blue-600">
                                                {status.recent_count}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Percentage:</span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.summary.total_offers > 0 
                                                    ? Math.round((status.count / analytics.summary.total_offers) * 100) 
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Top Banks by Offers */}
            {analytics.by_bank.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Top Banks by Offers</h3>
                    </div>
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Offers
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Won
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lost
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pending
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Win Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.by_bank.map((bank, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <BanknotesIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {bank.bank_name || 'Unknown Bank'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {bank.total_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            {bank.won_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            {bank.lost_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                            {bank.pending_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                bank.win_rate >= 50 ? 'bg-green-100 text-green-800' :
                                                bank.win_rate >= 25 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {bank.win_rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Businesses by Offers */}
            {analytics.by_business.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Top Businesses by Offers</h3>
                    </div>
                    <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Business
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Offers
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Won
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lost
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pending
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Offer
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.by_business.map((business, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {business.business_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {business.total_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                            {business.won_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                            {business.lost_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                            {business.pending_offers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {business.last_offer_date 
                                                ? new Date(business.last_offer_date).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Average Metrics */}
            {analytics.average_metrics && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Average Offer Metrics</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {analytics.average_metrics.avg_setup_fee || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Avg Setup Fee (SAR)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {analytics.average_metrics.avg_mada_fee || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Avg Mada Fee (%)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {analytics.average_metrics.avg_visa_mc_fee || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Avg Visa/MC Fee (%)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {analytics.average_metrics.avg_settlement_time || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">Avg Settlement Time (hours)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {analytics.recent_activity.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Offer Activity</h3>
                    </div>
                    <div className="overflow-hidden">
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
                                        Submitted
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics.recent_activity.map((activity, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {activity.business_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {activity.bank_name || 'Unknown Bank'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                activity.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                                activity.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {activity.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {activity.offer_device_setup_fee || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(activity.submitted_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Featured Offers */}
            {analytics.featured_offers.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Featured Offers</h3>
                    </div>
                    <div className="overflow-hidden">
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
                                {analytics.featured_offers.map((offer, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                                                <div className="text-sm font-medium text-gray-900">
                                                    {offer.business_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {offer.bank_name || 'Unknown Bank'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                offer.status === 'deal_won' ? 'bg-green-100 text-green-800' :
                                                offer.status === 'deal_lost' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {offer.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {offer.featured_reason || 'N/A'}
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
            )}

            {/* Offer Trends Chart */}
            {analytics.trends.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Offer Trends (Last 12 Months)</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {analytics.trends.map((trend, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        {new Date(trend.month).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short' 
                                        })}
                                    </span>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full" 
                                                    style={{ 
                                                        width: `${Math.min(100, (trend.total_offers / Math.max(...analytics.trends.map(t => t.total_offers))) * 100)}%` 
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                                {trend.total_offers}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            <span className="text-green-600">W: {trend.won_offers}</span>
                                            <span className="mx-1">|</span>
                                            <span className="text-red-600">L: {trend.lost_offers}</span>
                                            <span className="mx-1">|</span>
                                            <span className="text-yellow-600">P: {trend.pending_offers}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
