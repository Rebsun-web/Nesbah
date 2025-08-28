'use client'

import { useState } from 'react'
import { 
    ClockIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    UsersIcon,
    DocumentTextIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline'

export default function DashboardOverview({ data, loading }) {
    const [isHovering, setIsHovering] = useState(false);
    
    if (loading) {
        return (
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
                    <div className="mb-6">
                        <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-lg w-full text-center">
                            <span className="text-lg font-medium">Total Applications:</span>
                            <span className="text-2xl font-bold ml-2">{totalApplications}</span>
                        </div>
                    </div>
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


        </div>
    )
}
