'use client'

import { useState, useEffect } from 'react'
import { 
    ClockIcon, 
    ExclamationTriangleIcon,
    EyeIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline'

export default function UrgentApplications({ data }) {
    const [applications, setApplications] = useState(data || [])
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        setApplications(data || [])
    }, [data])

    const getUrgencyLevel = (application) => {
        if (application.urgency_level === 'auction_ending_soon' || application.urgency_level === 'selection_ending_soon') {
            return {
                label: 'Ending Soon',
                color: 'bg-red-100 text-red-800',
                icon: ExclamationTriangleIcon,
                priority: 1
            }
        }
        if (application.urgency_level === 'auction_expired' || application.urgency_level === 'selection_expired') {
            return {
                label: 'Expired',
                color: 'bg-gray-100 text-gray-800',
                icon: ClockIcon,
                priority: 2
            }
        }
        return {
            label: 'Normal',
            color: 'bg-green-100 text-green-800',
            icon: ClockIcon,
            priority: 3
        }
    }

    const getStatusInfo = (status) => {
        const statusConfig = {
            'pending_offers': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800'
            },
            'offer_received': {
                label: 'Offers Available',
                color: 'bg-green-100 text-green-800'
            }
        }
        return statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800'
        }
    }

    const formatTimeRemaining = (hours) => {
        if (hours <= 0) return 'Expired'
        if (hours < 1) return `${Math.round(hours * 60)} minutes`
        if (hours < 24) return `${Math.round(hours)} hours`
        return `${Math.round(hours / 24)} days`
    }

    const handleExtendDeadline = async (applicationId, phase) => {
        // TODO: Implement deadline extension
        console.log('Extend deadline for application:', applicationId, 'phase:', phase)
    }

    const handleForceTransition = async (applicationId, fromStatus, toStatus) => {
        // TODO: Implement force transition
        console.log('Force transition for application:', applicationId, 'from:', fromStatus, 'to:', toStatus)
    }

    const sortedApplications = applications
        .sort((a, b) => {
            const urgencyA = getUrgencyLevel(a)
            const urgencyB = getUrgencyLevel(b)
            return urgencyA.priority - urgencyB.priority
        })
        .slice(0, showAll ? applications.length : 5)

    if (!applications || applications.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Urgent Applications</h3>
                    <p className="text-sm text-gray-600 mt-1">Applications requiring immediate attention</p>
                </div>
                <div className="p-6 text-center">
                    <div className="text-gray-400 text-6xl mb-4">✅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                    <p className="text-gray-600">No applications require immediate attention at this time.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Urgent Applications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {applications.length} application{applications.length !== 1 ? 's' : ''} requiring attention
                        </p>
                    </div>
                    {applications.length > 5 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            {showAll ? 'Show Less' : `Show All (${applications.length})`}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="divide-y divide-gray-200">
                {sortedApplications.map((application) => {
                    const urgency = getUrgencyLevel(application)
                    const statusInfo = getStatusInfo(application.status)
                    const UrgencyIcon = urgency.icon
                    
                    return (
                        <div key={application.application_id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${urgency.color}`}>
                                            <div className="flex items-center">
                                                <UrgencyIcon className="h-3 w-3 mr-1" />
                                                {urgency.label}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            #{application.application_id}
                                        </span>
                                    </div>
                                    
                                    <h4 className="text-lg font-medium text-gray-900 mb-1">
                                        {application.trade_name || 'Unknown Business'}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Submitted:</span>
                                            <span className="ml-2">
                                                {new Date(application.submitted_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Offers:</span>
                                            <span className="ml-2">{application.offers_count || 0}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Revenue:</span>
                                            <span className="ml-2">SAR {application.revenue_collected || 0}</span>
                                        </div>
                                    </div>
                                    
                                    {application.hours_until_auction_end !== undefined && (
                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
                                                    <span className="text-sm font-medium text-yellow-800">
                                                        Auction ends in: {formatTimeRemaining(application.hours_until_auction_end)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleExtendDeadline(application.application_id, 'auction')}
                                                    className="text-sm text-yellow-600 hover:text-yellow-500 font-medium"
                                                >
                                                    Extend
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {application.hours_until_selection_end !== undefined && (
                                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <ClockIcon className="h-4 w-4 text-green-600 mr-2" />
                                                    <span className="text-sm font-medium text-green-800">
                                                        Selection ends in: {formatTimeRemaining(application.hours_until_selection_end)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleExtendDeadline(application.application_id, 'selection')}
                                                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                                                >
                                                    Extend
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="ml-6 flex flex-col space-y-2">
                                    <button
                                        onClick={() => window.open(`/admin/applications/${application.application_id}`, '_blank')}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        <EyeIcon className="h-4 w-4 mr-2" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => handleForceTransition(application.application_id, application.status, 'abandoned')}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                                    >
                                        <Cog6ToothIcon className="h-4 w-4 mr-2" />
                                        Force Abandon
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
