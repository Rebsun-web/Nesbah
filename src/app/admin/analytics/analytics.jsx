'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/container'
import AdminNavbar from '@/components/admin/AdminNavbar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { 
    ChartBarIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AnalyticsDashboard() {
    const { adminUser, logout } = useAdminAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [analyticsData, setAnalyticsData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState('30d')

    // Fetch analytics data
    const fetchAnalyticsData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await fetch(`/api/admin/analytics/comprehensive?timeRange=${timeRange}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setAnalyticsData(data.data)
            } else {
                setError(data.error || 'Failed to fetch analytics data')
            }
        } catch (err) {
            setError('Network error while fetching analytics data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalyticsData()
    }, [timeRange])

    // Refresh data every 60 seconds
    useEffect(() => {
        const interval = setInterval(fetchAnalyticsData, 60000)
        return () => clearInterval(interval)
    }, [timeRange])

    const renderLoadingState = () => (
        <div className="space-y-6">
            {/* Header Loading */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </div>
                </div>
            </div>

            {/* Metrics Loading */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="animate-pulse">
                                <div className="h-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderErrorState = () => (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600 mt-1">Error loading analytics data</p>
            </div>
            <div className="p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                    <button 
                        onClick={fetchAnalyticsData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </div>
    )

    const renderAnalyticsContent = () => {
        if (!analyticsData) return null

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                                <p className="text-sm text-gray-600 mt-1">Comprehensive analytics for applications and offers</p>
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
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.totalApplications || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Leads Sold</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.leadsSold || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ChartBarIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.conversionRate ? analyticsData.conversionRate.toFixed(1) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserGroupIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Banks</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analyticsData.activeBanks || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-gray-900">Revenue Trend</h4>
                            <p className="text-sm text-gray-600 mt-1">Daily revenue and lead sales</p>
                        </div>
                        <div className="p-6">
                            {analyticsData.revenueTrend && analyticsData.revenueTrend.length > 0 ? (
                                <div className="h-64 flex items-end justify-between space-x-2">
                                    {analyticsData.revenueTrend.map((day, index) => {
                                        const maxRevenue = Math.max(...analyticsData.revenueTrend.map(d => d.revenue))
                                        const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                                        
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center">
                                                <div className="w-full bg-gray-200 rounded-t" style={{ height: `${height}%` }}>
                                                    <div className="w-full bg-blue-500 rounded-t" style={{ height: '100%' }}></div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 text-center">
                                                    <div className="font-medium">SAR {(Number(day.revenue) || 0).toFixed(0)}</div>
                                                    <div>{day.leads || 0} leads</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    No revenue data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Application Status Distribution */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-gray-900">Application Status</h4>
                            <p className="text-sm text-gray-600 mt-1">Distribution by status</p>
                        </div>
                        <div className="p-6">
                            {analyticsData.statusDistribution && analyticsData.statusDistribution.length > 0 ? (
                                <div className="space-y-4">
                                    {analyticsData.statusDistribution.map((status, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                                    status.status === 'completed' ? 'bg-green-500' :
                                                    status.status === 'live_auction' ? 'bg-yellow-500' :
                                                    status.status === 'ignored' ? 'bg-red-500' :
                                                    'bg-gray-500'
                                                }`}></div>
                                                <span className="text-sm font-medium text-gray-900 capitalize">
                                                    {status.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-600">{status.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    No status data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-lg font-medium text-gray-900">Performance Metrics</h4>
                        <p className="text-sm text-gray-600 mt-1">Key performance indicators</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {analyticsData.avgResponseTime ? analyticsData.avgResponseTime.toFixed(1) : 0}
                                </div>
                                <div className="text-sm text-gray-600">Avg Response Time (hours)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {analyticsData.avgAuctionDuration ? analyticsData.avgAuctionDuration.toFixed(1) : 0}
                                </div>
                                <div className="text-sm text-gray-600">Avg Auction Duration (days)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {analyticsData.avgOffersPerApplication ? analyticsData.avgOffersPerApplication.toFixed(1) : 0}
                                </div>
                                <div className="text-sm text-gray-600">Avg Offers per Application</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar onMenuClick={() => setSidebarOpen(true)} adminUser={adminUser} onLogout={logout} />
                <div className="flex">
                    <AdminSidebar 
                        isOpen={sidebarOpen} 
                        onClose={() => setSidebarOpen(false)}
                        activeTab="analytics"
                    />
                    <div className="flex-1">
                        <Container>
                            <div className="py-6">
                                {loading ? renderLoadingState() : 
                                 error ? renderErrorState() : 
                                 renderAnalyticsContent()}
                            </div>
                        </Container>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
