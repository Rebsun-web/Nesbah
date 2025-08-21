'use client'

import { useState, useEffect } from 'react'
import { 
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline'

export default function RevenueMetrics({ data, detailed = false }) {
    const [revenueData, setRevenueData] = useState(null)
    const [timeRange, setTimeRange] = useState('7d')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchRevenueData = async (range = timeRange) => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await fetch(`/api/admin/revenue/analytics?timeRange=${range}`, {
                credentials: 'include'
            })
            
            const result = await response.json()
            
            if (result.success) {
                setRevenueData(result.data)
            } else {
                setError(result.error || 'Failed to fetch revenue data')
            }
        } catch (err) {
            setError('Network error while fetching revenue data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!data) {
            fetchRevenueData()
        } else {
            setRevenueData(data)
            setLoading(false)
        }
    }, [data])

    useEffect(() => {
        if (!data) {
            fetchRevenueData(timeRange)
        }
    }, [timeRange])

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Revenue Analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">Loading revenue data...</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="text-center animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto"></div>
                                <div className="mt-2 h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                                <div className="mt-1 h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                <div className="mt-1 h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Revenue Analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">Error loading revenue data</p>
                </div>
                <div className="p-6">
                    <div className="text-center text-red-600">
                        <p>{error}</p>
                        <button 
                            onClick={() => fetchRevenueData()}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!revenueData) {
        return null
    }

    const metrics = [
        {
            name: 'Total Revenue',
            value: `SAR ${(Number(revenueData.metrics?.total_revenue) || 0).toFixed(2)}`,
            change: `${(revenueData.changes?.revenue_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.revenue_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.revenue_change || 0) >= 0 ? 'positive' : 'negative',
            icon: CurrencyDollarIcon,
            color: 'bg-green-100 text-green-600'
        },
        {
            name: 'Revenue Generating Apps',
            value: revenueData.metrics?.revenue_generating_applications || 0,
            change: `${(revenueData.changes?.apps_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.apps_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.apps_change || 0) >= 0 ? 'positive' : 'negative',
            icon: ChartBarIcon,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            name: 'Avg Revenue per App',
            value: `SAR ${(Number(revenueData.metrics?.avg_revenue_per_application) || 0).toFixed(2)}`,
            change: `${(revenueData.changes?.avg_revenue_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.avg_revenue_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.avg_revenue_change || 0) >= 0 ? 'positive' : 'negative',
            icon: BanknotesIcon,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            name: 'Completed Applications',
            value: revenueData.metrics?.completed_applications || 0,
            change: `${(revenueData.changes?.completed_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.completed_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.completed_change || 0) >= 0 ? 'positive' : 'negative',
            icon: ArrowTrendingUpIcon,
            color: 'bg-emerald-100 text-emerald-600'
        }
    ]

    if (!detailed) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Revenue Overview</h3>
                    <p className="text-sm text-gray-600 mt-1">Financial performance and revenue tracking</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((metric) => {
                            const Icon = metric.icon
                            return (
                                <div key={metric.name} className="text-center">
                                    <div className={`inline-flex p-3 rounded-lg ${metric.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-gray-600">{metric.name}</p>
                                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                                    <div className="mt-1 flex items-center justify-center">
                                        <span className={`text-sm font-medium ${
                                            metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {metric.change}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-1">vs last period</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Revenue Metrics */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Revenue Analytics</h3>
                            <p className="text-sm text-gray-600 mt-1">Detailed financial performance analysis</p>
                        </div>
                        <div className="flex space-x-2">
                            {['7d', '30d', '90d'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                                        timeRange === range
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((metric) => {
                            const Icon = metric.icon
                            return (
                                <div key={metric.name} className="text-center">
                                    <div className={`inline-flex p-3 rounded-lg ${metric.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-gray-600">{metric.name}</p>
                                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                                    <div className="mt-1 flex items-center justify-center">
                                        <span className={`text-sm font-medium ${
                                            metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {metric.change}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-1">vs last period</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
                    <p className="text-sm text-gray-600 mt-1">Daily revenue and application volume</p>
                </div>
                <div className="p-6">
                    {revenueData.daily_trend && revenueData.daily_trend.length > 0 ? (
                        <div className="h-64 flex items-end justify-between space-x-2">
                            {revenueData.daily_trend.map((day, index) => {
                                const maxRevenue = Math.max(...revenueData.daily_trend.map(d => d.revenue))
                                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                                
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="w-full bg-gray-200 rounded-t" style={{ height: `${height}%` }}>
                                            <div className="w-full bg-blue-500 rounded-t" style={{ height: '100%' }}></div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 text-center">
                                            <div className="font-medium">SAR {(Number(day.revenue) || 0).toFixed(0)}</div>
                                            <div>{day.applications || 0} apps</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No revenue data available for this period
                        </div>
                    )}
                </div>
            </div>

            {/* Bank Performance */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Bank Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">Revenue and success rates by bank</p>
                </div>
                <div className="p-6">
                    {revenueData.bank_performance && revenueData.bank_performance.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            BANK
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            REVENUE
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            APPLICATIONS
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SUCCESS RATE
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenueData.bank_performance.map((bank, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {bank.bank_name || 'Unknown Bank'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                SAR {(Number(bank.revenue) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {bank.applications || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(Number(bank.success_rate) || 0).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            No bank performance data available
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue Insights */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Revenue Insights</h3>
                    <p className="text-sm text-gray-600 mt-1">Key insights and recommendations</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
                                <h4 className="text-sm font-medium text-green-800">Positive Trends</h4>
                            </div>
                            <ul className="mt-2 text-sm text-green-700 space-y-1">
                                {revenueData.insights?.positive && revenueData.insights.positive.length > 0 ? (
                                    revenueData.insights.positive.map((insight, index) => (
                                        <li key={index}>• {insight}</li>
                                    ))
                                ) : (
                                    <li>• No significant positive trends detected</li>
                                )}
                            </ul>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                            <div className="flex items-center">
                                <ArrowTrendingDownIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                <h4 className="text-sm font-medium text-yellow-800">Areas for Improvement</h4>
                            </div>
                            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                                {revenueData.insights?.improvement && revenueData.insights.improvement.length > 0 ? (
                                    revenueData.insights.improvement.map((insight, index) => (
                                        <li key={index}>• {insight}</li>
                                    ))
                                ) : (
                                    <li>• All metrics are performing well</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
