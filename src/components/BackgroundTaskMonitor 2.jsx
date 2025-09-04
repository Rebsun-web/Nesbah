'use client'

import { useState, useEffect } from 'react'
import { 
    PlayIcon, 
    StopIcon, 
    TrashIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    DatabaseIcon
} from '@heroicons/react/24/outline'

export default function BackgroundTaskMonitor() {
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchStatus = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/background-jobs/status')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setStatus(data)
            setLastUpdated(new Date())
            setError(null)
        } catch (err) {
            console.error('Failed to fetch status:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const performAction = async (action) => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/background-jobs/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            })
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const result = await response.json()
            console.log(`${action} result:`, result)
            
            // Refresh status after action
            await fetchStatus()
            
        } catch (err) {
            console.error(`Failed to ${action}:`, err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        
        // Refresh status every 30 seconds
        const interval = setInterval(fetchStatus, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading && !status) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-4"></div>
                <div className="space-y-4">
                    <div className="h-32 bg-slate-200 rounded-xl"></div>
                    <div className="h-32 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">Error loading status</span>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
                <button
                    onClick={fetchStatus}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    if (!status) {
        return <div>No status available</div>
    }

    const { backgroundTasks, connections, recommendations } = status

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Background Task Monitor</h2>
                    <p className="text-gray-600">Monitor and control background tasks and database connections</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        <ClockIcon className="h-4 w-4 inline mr-2" />
                        Refresh
                    </button>
                    {lastUpdated && (
                        <span className="text-sm text-gray-500">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Control Panel</h3>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => performAction('start')}
                        disabled={loading || backgroundTasks.isRunning}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                    >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start Tasks
                    </button>
                    
                    <button
                        onClick={() => performAction('stop')}
                        disabled={loading || !backgroundTasks.isRunning}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                    >
                        <StopIcon className="h-4 w-4 mr-2" />
                        Stop Tasks
                    </button>
                    
                    <button
                        onClick={() => performAction('cleanup')}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center"
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Force Cleanup
                    </button>
                    
                    <button
                        onClick={() => performAction('emergency_cleanup')}
                        disabled={loading}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 transition-colors flex items-center"
                    >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                        Emergency Cleanup
                    </button>
                </div>
            </div>

            {/* Task Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Background Tasks</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            backgroundTasks.isRunning 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {backgroundTasks.isRunning ? 'Running' : 'Stopped'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {backgroundTasks.tasks.map((task) => (
                            <div key={task.name} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium capitalize">{task.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        task.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {task.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Interval: {Math.round(task.interval / 60000)} minutes
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connections</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pool Status */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <DatabaseIcon className="h-4 w-4 mr-2" />
                                Connection Pool
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Connections:</span>
                                    <span className="font-medium">{connections.pool.totalCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Idle Connections:</span>
                                    <span className="font-medium">{connections.pool.idleCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Waiting Requests:</span>
                                    <span className="font-medium">{connections.pool.waitingCount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Max Connections:</span>
                                    <span className="font-medium">{connections.pool.max || 0}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Background Connections */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Background Tasks</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Active Connections:</span>
                                    <span className="font-medium">{connections.background?.totalActive || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Stale Connections:</span>
                                    <span className="font-medium">{connections.background?.staleConnections || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Overall Health:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        connections.overall 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {connections.overall ? 'Healthy' : 'Unhealthy'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                    <div className="space-y-3">
                        {recommendations.map((rec, index) => (
                            <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                rec.type === 'warning' 
                                    ? 'bg-yellow-50 border-yellow-400' 
                                    : 'bg-blue-50 border-blue-400'
                            }`}>
                                <div className="flex items-start space-x-3">
                                    {rec.type === 'warning' ? (
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    ) : (
                                        <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-900">{rec.message}</p>
                                        <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
