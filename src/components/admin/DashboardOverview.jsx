'use client'

import { useState, useEffect } from 'react'
import { 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    UsersIcon,
    DocumentTextIcon,
    ChartBarIcon,
    BuildingOfficeIcon,
    BanknotesIcon,
    UserIcon,
    ArrowTrendingUpIcon,
    ArrowPathIcon,
    EyeIcon,
    BoltIcon
} from '@heroicons/react/24/outline'

export default function DashboardOverview({ data, loading }) {
    const [isHovering, setIsHovering] = useState(false);
    const [userStats, setUserStats] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Fetch user stats and analytics data
    useEffect(() => {
        fetchUserStats();
        fetchAnalyticsData();
    }, [selectedDate]);

    const fetchUserStats = async () => {
        try {
            const response = await fetch('/api/admin/users/stats');
            const result = await response.json();
            if (result.success) {
                setUserStats(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch user stats:', err);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            setAnalyticsLoading(true);
            const [applicationsResponse, offersResponse, timeMetricsResponse] = await Promise.all([
                fetch('/api/admin/applications/analytics', { credentials: 'include' }),
                fetch('/api/admin/offers/analytics', { credentials: 'include' }),
                fetch(`/api/admin/time-metrics?date=${selectedDate}`, { credentials: 'include' })
            ]);
            
            const applicationsResult = await applicationsResponse.json();
            const offersResult = await offersResponse.json();
            const timeMetricsResult = await timeMetricsResponse.json();
            
            if (applicationsResult.success && offersResult.success && timeMetricsResult.success) {
                setAnalyticsData({
                    applications: applicationsResult.data,
                    offers: offersResult.data,
                    timeMetrics: timeMetricsResult.data
                });
            }
        } catch (err) {
            console.error('Failed to fetch analytics data:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const calculateConversionRate = () => {
        if (!analyticsData) return 0;
        const totalApplications = analyticsData.applications?.summary?.total_applications || 0;
        const totalOffers = analyticsData.offers?.summary?.total_offers || 0;
        return totalApplications > 0 ? ((totalOffers / totalApplications) * 100).toFixed(1) : 0;
    };

    const getAverageResponseTime = () => {
        if (!analyticsData?.timeMetrics) return 0;
        return (analyticsData.timeMetrics.avg_response_time_hours || 0).toFixed(1);
    };

    const getAverageOfferTime = () => {
        if (!analyticsData?.timeMetrics) return 0;
        return (analyticsData.timeMetrics.avg_offer_time_hours || 0).toFixed(1);
    };

    if (loading || analyticsLoading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="ml-4 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const statusCounts = data?.statusCounts || []
    const revenueAnalytics = data?.revenueAnalytics || {}

    const getStatusInfo = (status) => {
        const statusConfig = {
            'live_auction': {
                label: 'Live Auction',
                icon: ClockIcon,
                color: 'bg-yellow-100 text-yellow-600',
                bgColor: 'bg-yellow-50'
            },
            'completed': {
                label: 'Completed',
                icon: CheckCircleIcon,
                color: 'bg-green-100 text-green-600',
                bgColor: 'bg-green-50'
            },
            'ignored': {
                label: 'Ignored',
                icon: XCircleIcon,
                color: 'bg-gray-100 text-gray-600',
                bgColor: 'bg-gray-50'
            }
        }
        
        return statusConfig[status] || {
            label: status,
            icon: DocumentTextIcon,
            color: 'bg-gray-100 text-gray-600',
            bgColor: 'bg-gray-50'
        }
    }

    const totalApplications = statusCounts.reduce((sum, s) => sum + parseInt(s.count || 0), 0);

    return (
        <div className="space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
                    <p className="text-gray-600 mt-1">Comprehensive dashboard with key metrics and insights</p>
                </div>
                <div className="flex items-center space-x-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={fetchAnalyticsData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Conversion Rate */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
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
                                {getAverageResponseTime()}h
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Time to first offer
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
                                {getAverageOfferTime()}h
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Time to complete offer
                    </p>
                </div>

                {/* Total Applications */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Applications</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {totalApplications}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        All time applications
                    </p>
                </div>
            </div>

            {/* Application Status Overview */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-8 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Application Status Overview</h3>
                                <p className="text-sm text-gray-600 mt-1">Real-time status distribution across all applications</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                            // Define the order we want to display statuses - only 3 statuses
                            const statusOrder = ['live_auction', 'completed', 'ignored'];
                            
                            // Create a map of status counts for easy lookup
                            const statusCountMap = statusCounts.reduce((acc, status) => {
                                acc[status.status] = status;
                                return acc;
                            }, {});
                            
                            // Render all 3 statuses, showing 0 for those without applications
                            return statusOrder.map((statusKey) => {
                                const status = statusCountMap[statusKey];
                                const count = status ? status.count : 0;
                                
                                const statusInfo = getStatusInfo(statusKey)
                                const Icon = statusInfo.icon
                                
                                return (
                                    <div key={statusKey} className={`p-4 rounded-lg ${statusInfo.bgColor} transition-all duration-200 hover:shadow-md`}>
                                        <div className="flex flex-col items-center text-center">
                                            <div className={`p-2 rounded-lg ${statusInfo.color} mb-2`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mb-1">{statusInfo.label}</p>
                                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                                            {count === 0 && (
                                                <p className="text-xs text-gray-500 mt-1">No applications</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </div>
            </div>

            {/* User Statistics */}
            {userStats && (
                <div className="space-y-6">
                    {/* User Types Breakdown */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Users by Type</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {userStats.by_type.map((typeStats) => {
                                    const getTypeIcon = (type) => {
                                        switch (type) {
                                            case 'business':
                                                return BuildingOfficeIcon
                                            case 'bank':
                                                return BanknotesIcon
                                            default:
                                                return UsersIcon
                                        }
                                    }
                                    
                                    const getTypeColor = (type) => {
                                        switch (type) {
                                            case 'business':
                                                return 'bg-blue-500'
                                            case 'bank':
                                                return 'bg-green-500'
                                            default:
                                                return 'bg-gray-500'
                                        }
                                    }
                                    
                                    const Icon = getTypeIcon(typeStats.user_type)
                                    const color = getTypeColor(typeStats.user_type)
                                    
                                    return (
                                        <div key={typeStats.user_type} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center mb-3">
                                                <div className={`p-2 rounded-lg ${color}`}>
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="ml-3">
                                                    <h4 className="text-lg font-medium text-gray-900 capitalize">
                                                        {typeStats.user_type}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">
                                                        {typeStats.count} total users
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bank Employees Section */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Bank Employees</h3>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 rounded-lg bg-purple-500">
                                            <UserIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-lg font-medium text-gray-900">Total Employees</h4>
                                            <p className="text-sm text-gray-500">
                                                {userStats.summary.total_employees} active employees
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 rounded-lg bg-indigo-500">
                                            <BanknotesIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-lg font-medium text-gray-900">Banks with Employees</h4>
                                            <p className="text-sm text-gray-500">
                                                {userStats.summary.total_banks_with_employees} banks have employees
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
