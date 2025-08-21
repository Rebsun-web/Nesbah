'use client'

import { useState, useEffect } from 'react'
import { 
    UsersIcon, 
    UserGroupIcon, 
    BuildingOfficeIcon,
    BanknotesIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function UserStats() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchUserStats()
    }, [])

    const fetchUserStats = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/users/stats')
            const data = await response.json()
            
            if (data.success) {
                setStats(data.data)
            } else {
                setError(data.error || 'Failed to fetch user statistics')
            }
        } catch (err) {
            setError('Network error while fetching user statistics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
                        onClick={fetchUserStats}
                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const getTypeIcon = (type) => {
        switch (type) {
            case 'business':
                return BuildingOfficeIcon
            case 'individual':
                return UsersIcon
            case 'bank':
                return BanknotesIcon
            default:
                return UserGroupIcon
        }
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'business':
                return 'bg-blue-500'
            case 'individual':
                return 'bg-purple-500'
            case 'bank':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <UsersIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Users
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {stats.summary.total_users}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <UserGroupIcon className="h-8 w-8 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Active Users
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {stats.summary.total_active_users}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Recent Registrations
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {stats.summary.total_recent_registrations}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-purple-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Active Rate
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                    {stats.summary.active_percentage}%
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Types Breakdown */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Users by Type</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.by_type.map((typeStats) => {
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
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Active:</span>
                                            <span className="font-medium text-green-600">
                                                {typeStats.active_count}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Suspended:</span>
                                            <span className="font-medium text-yellow-600">
                                                {typeStats.suspended_count}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Inactive:</span>
                                            <span className="font-medium text-gray-600">
                                                {typeStats.inactive_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>



            {/* Registration Trends */}
            {stats.registration_trends.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Registration Trends (Last 12 Months)</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {stats.registration_trends.map((trend, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                        {new Date(trend.month).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short' 
                                        })}
                                    </span>
                                    <div className="flex items-center">
                                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ 
                                                    width: `${Math.min(100, (trend.count / Math.max(...stats.registration_trends.map(t => t.count))) * 100)}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                                            {trend.count}
                                        </span>
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
