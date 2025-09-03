'use client'

import { useState, useEffect } from 'react'
import { 
    UserGroupIcon, 
    BuildingOfficeIcon,
    BanknotesIcon,
    UserIcon
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
            const response = await fetch('/api/admin/users/stats', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminJWT')}` }
        })
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
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
            case 'bank':
                return 'bg-green-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <div className="space-y-8">
            {/* User Types Breakdown */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-8 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Users by Type</h3>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                        {stats.summary.total_employees} active employees
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
                                        {stats.summary.total_banks_with_employees} banks have employees
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
