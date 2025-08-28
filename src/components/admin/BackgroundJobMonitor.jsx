'use client'

import { useState, useEffect } from 'react'
import {
    PlayIcon, StopIcon, ArrowPathIcon, Cog6ToothIcon, ChartBarIcon,
    ExclamationTriangleIcon, CheckCircleIcon, BoltIcon
} from '@heroicons/react/24/outline'

export default function BackgroundJobMonitor() {
    const [jobStatus, setJobStatus] = useState(null)
    const [monitoringStats, setMonitoringStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchJobStatus()
        fetchMonitoringStats()
        
        // Refresh data every 30 seconds
        const interval = setInterval(() => {
            fetchJobStatus()
            fetchMonitoringStats()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchJobStatus = async () => {
        try {
            const response = await fetch('/api/admin/background-jobs/status', {
                credentials: 'include'
            })
            if (!response.ok) {
                throw new Error('Failed to fetch job status')
            }
            const data = await response.json()
            setJobStatus(data.data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchMonitoringStats = async () => {
        try {
            const response = await fetch('/api/admin/background-jobs/stats', {
                credentials: 'include'
            })
            if (!response.ok) {
                throw new Error('Failed to fetch monitoring stats')
            }
            const data = await response.json()
            setMonitoringStats(data.data)
        } catch (err) {
            console.error('Error fetching monitoring stats:', err)
        }
    }

    const performAction = async (action, jobName = null, config = null) => {
        setActionLoading(true)
        try {
            const response = await fetch('/api/admin/background-jobs/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ action, jobName, config })
            })
            
            if (!response.ok) {
                throw new Error('Failed to perform action')
            }
            
            const data = await response.json()
            if (data.success) {
                // Refresh data after successful action
                await fetchJobStatus()
                await fetchMonitoringStats()
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleStartAll = async () => {
        await performAction('start')
    }

    const handleStopAll = async () => {
        await performAction('stop')
    }

    const handleRestartJob = async (jobName) => {
        await performAction('restart', jobName)
    }

    const handleManualCheck = async (checkType = 'all') => {
        await performAction('manual_check', null, { checkType })
    }

    const getJobStatusColor = (isRunning) => {
        return isRunning ? 'text-green-600' : 'text-red-600'
    }

    const getJobStatusIcon = (isRunning) => {
        return isRunning ? CheckCircleIcon : ExclamationTriangleIcon
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Job Status Overview */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <BoltIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Event-Driven Background Jobs
                    </h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleStartAll}
                            disabled={actionLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start All
                        </button>
                        <button
                            onClick={handleStopAll}
                            disabled={actionLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            <StopIcon className="h-4 w-4 mr-1" />
                            Stop All
                        </button>
                    </div>
                </div>

                {jobStatus && (
                    <div className="space-y-4">
                        {/* Manager Status */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Job Manager</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    Status: {jobStatus.manager.isRunning ? 'Running' : 'Stopped'}
                                </span>
                                <span className={`text-sm font-medium ${getJobStatusColor(jobStatus.manager.isRunning)}`}>
                                    {jobStatus.manager.isRunning ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Individual Jobs */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Event-Driven Monitor</h4>
                            {Object.entries(jobStatus.jobs).map(([jobName, job]) => {
                                const StatusIcon = getJobStatusIcon(job.isRunning)
                                return (
                                    <div key={jobName} className="flex items-center justify-between py-2">
                                        <div className="flex items-center">
                                            <StatusIcon className={`h-5 w-5 mr-2 ${getJobStatusColor(job.isRunning)}`} />
                                            <span className="text-sm font-medium text-gray-900">
                                                {jobName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm font-medium ${getJobStatusColor(job.isRunning)}`}>
                                                {job.isRunning ? 'Running' : 'Stopped'}
                                            </span>
                                            <button
                                                onClick={() => handleRestartJob(jobName)}
                                                disabled={actionLoading}
                                                className="inline-flex items-center p-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                            >
                                                <ArrowPathIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Monitoring Statistics */}
            {monitoringStats && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Monitoring Statistics
                        </h3>
                        <button
                            onClick={() => handleManualCheck()}
                            disabled={actionLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Cog6ToothIcon className="h-4 w-4 mr-1" />
                            Manual Check
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Application Status Distribution */}
                        {monitoringStats.eventDrivenMonitor && (
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Application Status</h4>
                                <div className="space-y-2">
                                    {monitoringStats.eventDrivenMonitor.map((stat) => (
                                        <div key={stat.status} className="flex justify-between text-sm">
                                            <span className="text-gray-600 capitalize">
                                                {stat.status.replace('_', ' ')}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {stat.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Urgent Applications */}
                        {monitoringStats.urgentApplications && (
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Urgent Applications</h4>
                                <div className="space-y-2">
                                    {monitoringStats.urgentApplications.slice(0, 5).map((app) => (
                                        <div key={app.application_id} className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">#{app.application_id}</span>
                                                <span className={`font-medium ${
                                                    app.urgency_level === 'auction_ending_soon' || app.urgency_level === 'selection_ending_soon'
                                                        ? 'text-orange-600'
                                                        : 'text-red-600'
                                                }`}>
                                                    {app.urgency_level.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {app.trade_name}
                                            </div>
                                        </div>
                                    ))}
                                    {monitoringStats.urgentApplications.length === 0 && (
                                        <div className="text-sm text-gray-500">No urgent applications</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Performance Metrics */}
                        {monitoringStats.performanceMetrics && (
                            <div className="border rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                                <div className="space-y-2">
                                    {monitoringStats.performanceMetrics.slice(0, 5).map((metric, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    {metric.metric_name.replace('_', ' ')}
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {metric.metric_value} {metric.metric_unit}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Event-Driven System Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <BoltIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900">Event-Driven Monitoring</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            This system uses database triggers and webhooks instead of continuous polling, 
                            making it much more efficient and responsive to real-time events.
                        </p>
                        <ul className="text-xs text-blue-600 mt-2 space-y-1">
                            <li>• Database triggers automatically detect status changes</li>
                            <li>• Webhook server handles external events</li>
                            <li>• Real-time notifications for critical events</li>
                            <li>• Reduced resource usage compared to polling</li>
                        </ul>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
