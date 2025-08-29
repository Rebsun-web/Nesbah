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

    // Debug logging
    useEffect(() => {
        if (revenueData) {
            console.log('Revenue Data:', revenueData)
            console.log('Daily Trend:', revenueData.daily_trend)
            console.log('Bank Performance:', revenueData.bank_performance)
        }
    }, [revenueData])

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
            name: 'Offers Submitted',
            value: revenueData.metrics?.revenue_generating_applications || 0,
            change: `${(revenueData.changes?.apps_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.apps_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.apps_change || 0) >= 0 ? 'positive' : 'negative',
            icon: ChartBarIcon,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            name: 'Offer Conversion Rate',
            value: `${revenueData.conversion_rate ? revenueData.conversion_rate.toFixed(1) : 0}%`,
            change: `${(revenueData.changes?.completed_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.completed_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.completed_change || 0) >= 0 ? 'positive' : 'negative',
            icon: BanknotesIcon,
            color: 'bg-purple-100 text-purple-600'
        },
        {
            name: 'Revenue per Lead',
            value: `SAR ${(Number(revenueData.metrics?.avg_revenue_per_application) || 0).toFixed(2)}`,
            change: `${(revenueData.changes?.avg_revenue_change || 0) >= 0 ? '+' : ''}${(revenueData.changes?.avg_revenue_change || 0).toFixed(1)}%`,
            changeType: (revenueData.changes?.avg_revenue_change || 0) >= 0 ? 'positive' : 'negative',
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
                    <p className="text-sm text-gray-600 mt-1">Daily revenue and lead sales</p>
                </div>
                <div className="p-6">
                    {/* Enhanced Summary section */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    SAR {(revenueData.daily_trend.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0)).toFixed(0)}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Total Revenue</div>
                                <div className="text-xs text-gray-500 mt-1">Period total</div>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                                    <ChartBarIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {revenueData.daily_trend.reduce((sum, day) => sum + (Number(day.applications) || 0), 0)}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Total Applications</div>
                                <div className="text-xs text-gray-500 mt-1">Applications sold</div>
                            </div>
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                                    <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    SAR 25.00
                                </div>
                                <div className="text-sm text-gray-600 font-medium">Revenue per Lead</div>
                                <div className="text-xs text-gray-500 mt-1">Fixed rate</div>
                            </div>
                        </div>
                    </div>
                    
                    {revenueData.daily_trend && revenueData.daily_trend.length > 0 ? (
                        (() => {
                            // Check if all days have zero revenue and zero leads
                            const allZero = revenueData.daily_trend.every(day => 
                                (Number(day.revenue) || 0) === 0 && (Number(day.applications) || 0) === 0
                            );
                            
                            if (allZero) {
                                return (
                                    <div className="h-64 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Revenue Data Yet</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Revenue data will appear here once applications are purchased and revenue is generated.
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="space-y-3">
                                    {/* Chart Header */}
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-700">Daily Breakdown</h4>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                                                Revenue
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                                                Leads
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Chart */}
                                    <div className="h-32 flex items-end justify-between space-x-3">
                                        {revenueData.daily_trend.map((day, index) => {
                                            const maxRevenue = Math.max(...revenueData.daily_trend.map(d => Number(d.revenue) || 0))
                                            const height = maxRevenue > 0 ? ((Number(day.revenue) || 0) / maxRevenue) * 100 : 0
                                            const minHeight = 2 // Minimum height for visibility
                                            const displayHeight = Math.max(height, minHeight)
                                            const revenue = Number(day.revenue) || 0
                                            const leads = Number(day.applications) || 0
                                            
                                            return (
                                                <div key={index} className="flex-1 flex flex-col items-center group">
                                                    {/* Revenue Bar */}
                                                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: `${displayHeight}%` }}>
                                                        <div 
                                                            className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg transition-all duration-200 group-hover:from-blue-700 group-hover:to-blue-600" 
                                                            style={{ height: '100%' }}
                                                        ></div>
                                                        {/* Tooltip */}
                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                                            SAR {revenue.toFixed(0)} • {leads} leads
                                                        </div>
                                                    </div>
                                                    
                                                                                                                                            {/* Labels */}
                                                    <div className="mt-2 text-center space-y-1">
                                                        <div className="text-xs font-semibold text-gray-900">
                                                            SAR {revenue.toFixed(0)}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {leads} lead{leads !== 1 ? 's' : ''}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(day.date).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    {/* Chart Footer */}
                                    <div className="text-center text-xs text-gray-500 pt-1 border-t border-gray-100">
                                        Showing {revenueData.daily_trend.length} day{revenueData.daily_trend.length !== 1 ? 's' : ''} of data
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="h-64 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-gray-400 mb-2">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Revenue Data Yet</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Revenue data will appear here once applications are purchased and revenue is generated.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lead Performance Metrics */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Lead Performance Metrics</h3>
                    <p className="text-sm text-gray-600 mt-1">Key metrics for lead generation and sales</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {revenueData.metrics?.total_applications || 0}
                            </div>
                            <div className="text-sm text-gray-600">Total Applications</div>
                            <div className="text-xs text-gray-500 mt-1">Lead generation volume</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {revenueData.metrics?.revenue_generating_applications || 0}
                            </div>
                            <div className="text-sm text-gray-600">Leads Sold</div>
                            <div className="text-xs text-gray-500 mt-1">Successful lead sales</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {revenueData.conversion_rate ? revenueData.conversion_rate.toFixed(1) : 0}%
                            </div>
                            <div className="text-sm text-gray-600">Lead Conversion Rate</div>
                            <div className="text-xs text-gray-500 mt-1">Applications to sales ratio</div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Revenue Breakdown</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Revenue:</span>
                                    <span className="font-medium">SAR {(Number(revenueData.metrics?.total_revenue) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Leads Sold:</span>
                                    <span className="font-medium">{revenueData.metrics?.revenue_generating_applications || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Revenue per Lead:</span>
                                    <span className="font-medium">SAR 25.00</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Indicators</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Auctions:</span>
                                    <span className="font-medium">{revenueData.metrics?.active_auctions || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Active Selections:</span>
                                    <span className="font-medium">{revenueData.metrics?.active_selections || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Abandonment Rate:</span>
                                    <span className="font-medium">{revenueData.abandonment_rate ? revenueData.abandonment_rate.toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank Performance */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Bank Performance</h3>
                    <p className="text-sm text-gray-600 mt-1">Lead purchases and success rates by bank</p>
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
                                            LEADS PURCHASED
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
                                                {bank.applications || 0} leads
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
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bank Performance Data</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Bank performance data will appear here once banks start placing offers and purchasing leads.
                                            </p>
                                            <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                                                <h4 className="text-sm font-medium text-blue-900 mb-2">What you&apos;ll see here:</h4>
                                                <ul className="text-xs text-blue-800 space-y-1">
                                                    <li>• Bank names and email addresses</li>
                                                    <li>• Revenue generated per bank</li>
                                                    <li>• Number of leads purchased</li>
                                                    <li>• Success rates for each bank</li>
                                                </ul>
                                            </div>
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
                                    <li>• Monitoring performance metrics</li>
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
                                    <li>• System performing within expected parameters</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
