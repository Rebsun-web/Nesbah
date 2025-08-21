'use client'

import { useState, useEffect } from 'react'
import { 
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    EyeIcon,
    CheckIcon
} from '@heroicons/react/24/outline'

export default function SystemAlerts() {
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [showResolved, setShowResolved] = useState(false)

    // Mock data for demonstration
    const mockAlerts = [
        {
            alert_id: 1,
            alert_type: 'deadline_approaching',
            severity: 'high',
            title: 'Auction Ending Soon',
            message: 'Application #123 auction ends in 1 hour',
            related_entity_type: 'application',
            related_entity_id: 123,
            is_resolved: false,
            created_at: '2024-01-15T16:30:00Z'
        },
        {
            alert_id: 2,
            alert_type: 'payment_failure',
            severity: 'critical',
            title: 'Payment Processing Error',
            message: 'Multiple payment failures detected for Bank ABC',
            related_entity_type: 'bank',
            related_entity_id: 456,
            is_resolved: false,
            created_at: '2024-01-15T15:45:00Z'
        },
        {
            alert_id: 3,
            alert_type: 'revenue_anomaly',
            severity: 'medium',
            title: 'Revenue Drop Detected',
            message: 'Daily revenue 25% below average',
            related_entity_type: 'system',
            related_entity_id: null,
            is_resolved: true,
            resolved_at: '2024-01-15T14:20:00Z',
            resolved_by_name: 'Admin User',
            created_at: '2024-01-15T12:00:00Z'
        },
        {
            alert_id: 4,
            alert_type: 'system_error',
            severity: 'low',
            title: 'Background Job Delayed',
            message: 'Status transition job running 5 minutes behind schedule',
            related_entity_type: 'system',
            related_entity_id: null,
            is_resolved: false,
            created_at: '2024-01-15T11:15:00Z'
        }
    ]

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setAlerts(mockAlerts)
            setLoading(false)
        }, 1000)
    }, [])

    const getSeverityInfo = (severity) => {
        const severityConfig = {
            'critical': {
                label: 'Critical',
                color: 'bg-red-100 text-red-800',
                icon: XCircleIcon,
                priority: 1
            },
            'high': {
                label: 'High',
                color: 'bg-orange-100 text-orange-800',
                icon: ExclamationTriangleIcon,
                priority: 2
            },
            'medium': {
                label: 'Medium',
                color: 'bg-yellow-100 text-yellow-800',
                icon: InformationCircleIcon,
                priority: 3
            },
            'low': {
                label: 'Low',
                color: 'bg-blue-100 text-blue-800',
                icon: InformationCircleIcon,
                priority: 4
            }
        }
        return severityConfig[severity] || {
            label: severity,
            color: 'bg-gray-100 text-gray-800',
            icon: InformationCircleIcon,
            priority: 5
        }
    }

    const getAlertTypeInfo = (alertType) => {
        const typeConfig = {
            'deadline_approaching': {
                label: 'Deadline Approaching',
                color: 'bg-purple-100 text-purple-800'
            },
            'payment_failure': {
                label: 'Payment Failure',
                color: 'bg-red-100 text-red-800'
            },
            'system_error': {
                label: 'System Error',
                color: 'bg-orange-100 text-orange-800'
            },
            'revenue_anomaly': {
                label: 'Revenue Anomaly',
                color: 'bg-yellow-100 text-yellow-800'
            },
            'user_limit_reached': {
                label: 'User Limit Reached',
                color: 'bg-blue-100 text-blue-800'
            }
        }
        return typeConfig[alertType] || {
            label: alertType,
            color: 'bg-gray-100 text-gray-800'
        }
    }

    const filteredAlerts = alerts.filter(alert => {
        const matchesFilter = filter === 'all' || alert.severity === filter
        const matchesResolved = showResolved ? true : !alert.is_resolved
        return matchesFilter && matchesResolved
    })

    const sortedAlerts = [...filteredAlerts].sort((a, b) => {
        const severityA = getSeverityInfo(a.severity)
        const severityB = getSeverityInfo(b.severity)
        
        // Sort by severity first, then by creation time
        if (severityA.priority !== severityB.priority) {
            return severityA.priority - severityB.priority
        }
        
        return new Date(b.created_at) - new Date(a.created_at)
    })

    const handleResolveAlert = async (alertId) => {
        // TODO: Implement alert resolution
        console.log('Resolve alert:', alertId)
        setAlerts(alerts.map(alert => 
            alert.alert_id === alertId 
                ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
                : alert
        ))
    }

    const handleViewEntity = (entityType, entityId) => {
        if (entityType === 'application') {
            window.open(`/admin/applications/${entityId}`, '_blank')
        } else if (entityType === 'bank') {
            window.open(`/admin/users?user_type=bank&id=${entityId}`, '_blank')
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Alert Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <XCircleIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Critical</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'critical' && !a.is_resolved).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">High</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'high' && !a.is_resolved).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <InformationCircleIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Medium</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.severity === 'medium' && !a.is_resolved).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Resolved</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {alerts.filter(a => a.is_resolved).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
                            <p className="text-sm text-gray-600 mt-1">Monitor and manage system alerts</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showResolved}
                                    onChange={(e) => setShowResolved(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Show Resolved</span>
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-gray-200">
                    {sortedAlerts.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="text-gray-400 text-6xl mb-4">✅</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                            <p className="text-gray-600">No alerts match your current filters.</p>
                        </div>
                    ) : (
                        sortedAlerts.map((alert) => {
                            const severityInfo = getSeverityInfo(alert.severity)
                            const typeInfo = getAlertTypeInfo(alert.alert_type)
                            const SeverityIcon = severityInfo.icon
                            
                            return (
                                <div key={alert.alert_id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${severityInfo.color}`}>
                                                    <div className="flex items-center">
                                                        <SeverityIcon className="h-3 w-3 mr-1" />
                                                        {severityInfo.label}
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </div>
                                                {alert.is_resolved && (
                                                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Resolved
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                                                {alert.title}
                                            </h4>
                                            
                                            <p className="text-sm text-gray-600 mb-3">
                                                {alert.message}
                                            </p>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </div>
                                                {alert.related_entity_type && alert.related_entity_id && (
                                                    <button
                                                        onClick={() => handleViewEntity(alert.related_entity_type, alert.related_entity_id)}
                                                        className="flex items-center text-blue-600 hover:text-blue-500"
                                                    >
                                                        <EyeIcon className="h-4 w-4 mr-1" />
                                                        View {alert.related_entity_type}
                                                    </button>
                                                )}
                                                {alert.is_resolved && alert.resolved_by_name && (
                                                    <div className="flex items-center">
                                                        <CheckIcon className="h-4 w-4 mr-1" />
                                                        Resolved by {alert.resolved_by_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {!alert.is_resolved && (
                                            <div className="ml-6">
                                                <button
                                                    onClick={() => handleResolveAlert(alert.alert_id)}
                                                    className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200"
                                                >
                                                    Mark Resolved
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
