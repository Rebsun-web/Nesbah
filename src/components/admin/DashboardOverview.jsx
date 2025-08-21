'use client'

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
            'submitted': {
                label: 'Submitted',
                icon: DocumentTextIcon,
                color: 'bg-blue-100 text-blue-600',
                bgColor: 'bg-blue-50'
            },
            'pending_offers': {
                label: 'Live Auction',
                icon: ClockIcon,
                color: 'bg-yellow-100 text-yellow-600',
                bgColor: 'bg-yellow-50'
            },
            'purchased': {
                label: 'Purchased',
                icon: CheckCircleIcon,
                color: 'bg-purple-100 text-purple-600',
                bgColor: 'bg-purple-50'
            },
            'offer_received': {
                label: 'Offer Received',
                icon: CheckCircleIcon,
                color: 'bg-green-100 text-green-600',
                bgColor: 'bg-green-50'
            },
            'completed': {
                label: 'Completed',
                icon: CheckCircleIcon,
                color: 'bg-green-100 text-green-600',
                bgColor: 'bg-green-50'
            },
            'abandoned': {
                label: 'Abandoned',
                icon: XCircleIcon,
                color: 'bg-gray-100 text-gray-600',
                bgColor: 'bg-gray-50'
            },
            'deal_expired': {
                label: 'Deal Expired',
                icon: ExclamationTriangleIcon,
                color: 'bg-red-100 text-red-600',
                bgColor: 'bg-red-50'
            }
        }
        
        return statusConfig[status] || {
            label: status,
            icon: DocumentTextIcon,
            color: 'bg-gray-100 text-gray-600',
            bgColor: 'bg-gray-50'
        }
    }

    const metrics = [
        {
            name: 'Total Revenue',
            value: `SAR ${revenueAnalytics.total_revenue || 0}`,
            change: '+12.5%',
            changeType: 'positive',
            icon: CurrencyDollarIcon,
            color: 'bg-green-100 text-green-600'
        },
        {
            name: 'Completed Applications',
            value: revenueAnalytics.completed_applications || 0,
            change: '+8.2%',
            changeType: 'positive',
            icon: CheckCircleIcon,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            name: 'Active Auctions',
            value: statusCounts.find(s => s.status === 'pending_offers')?.active_auctions || 0,
            change: '-2.1%',
            changeType: 'negative',
            icon: ClockIcon,
            color: 'bg-yellow-100 text-yellow-600'
        },
        {
            name: 'Conversion Rate',
            value: `${((revenueAnalytics.completed_applications / (revenueAnalytics.completed_applications + (revenueAnalytics.abandoned_applications || 0) + (revenueAnalytics.expired_applications || 0))) * 100).toFixed(1)}%`,
            change: '+5.3%',
            changeType: 'positive',
            icon: ChartBarIcon,
            color: 'bg-purple-100 text-purple-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric) => {
                    const Icon = metric.icon
                    return (
                        <div key={metric.name} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${metric.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center">
                                <span className={`text-sm font-medium ${
                                    metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {metric.change}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">from last month</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Application Status Overview */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Application Status Overview</h3>
                    <p className="text-sm text-gray-600 mt-1">Real-time status distribution across all applications</p>
                </div>
                <div className="p-6">
                    {statusCounts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-sm text-gray-500">
                                There are currently no applications in the system. Applications will appear here once they are submitted.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {statusCounts.map((status) => {
                                const statusInfo = getStatusInfo(status.status)
                                const Icon = statusInfo.icon
                                
                                return (
                                    <div key={status.status} className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <p className="text-sm font-medium text-gray-900">{statusInfo.label}</p>
                                                <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                                            </div>
                                        </div>
                                        
                                        {status.status === 'pending_offers' && status.active_auctions !== undefined && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Active Auctions</span>
                                                    <span className="font-medium text-green-600">{status.active_auctions}</span>
                                                </div>
                                                {status.expired_auctions > 0 && (
                                                    <div className="flex justify-between text-sm mt-1">
                                                        <span className="text-gray-600">Expired</span>
                                                        <span className="font-medium text-red-600">{status.expired_auctions}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {status.status === 'offer_received' && status.active_selections !== undefined && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Active Selections</span>
                                                    <span className="font-medium text-green-600">{status.active_selections}</span>
                                                </div>
                                                {status.expired_selections > 0 && (
                                                    <div className="flex justify-between text-sm mt-1">
                                                        <span className="text-gray-600">Expired</span>
                                                        <span className="font-medium text-red-600">{status.expired_selections}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>


        </div>
    )
}
