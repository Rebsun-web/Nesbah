'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function ForceStatusUpdate() {
    const [applicationId, setApplicationId] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleForceUpdate = async () => {
        if (!applicationId.trim()) {
            setError('Please enter an application ID')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/admin/applications/force-status-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ application_id: parseInt(applicationId) })
            })

            const data = await response.json()

            if (data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Failed to force status update')
            }
        } catch (err) {
            setError('Network error while updating status')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="h-5 w-5 text-green-600" />
            case 'ignored':
                return <XCircleIcon className="h-5 w-5 text-red-600" />
            default:
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'ignored':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-yellow-100 text-yellow-800'
        }
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Force Status Update</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700 mb-2">
                        Application ID
                    </label>
                    <input
                        type="number"
                        id="applicationId"
                        value={applicationId}
                        onChange={(e) => setApplicationId(e.target.value)}
                        placeholder="Enter application ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={handleForceUpdate}
                    disabled={loading || !applicationId.trim()}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Updating...' : 'Force Status Update'}
                </button>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2">
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-red-800">{error}</span>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Status Update Successful</span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-green-700">
                                <div className="flex items-center justify-between">
                                    <span>Application ID:</span>
                                    <span className="font-medium">#{result.data.application_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Old Status:</span>
                                    <span className="font-medium capitalize">{result.data.old_status.replace('_', ' ')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>New Status:</span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.data.new_status)}`}>
                                        {getStatusIcon(result.data.new_status)}
                                        <span className="ml-1 capitalize">{result.data.new_status.replace('_', ' ')}</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Hours Overdue:</span>
                                    <span className="font-medium">{result.data.hours_overdue}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Offers Received:</span>
                                    <span className="font-medium">{result.data.offers_count}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-green-200">
                                <p className="text-xs text-green-600">{result.data.reason}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">⚠️ Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>This will force update applications stuck in &apos;live_auction&apos; status beyond 48 hours</li>
                            <li>Applications with offers will transition to &apos;completed&apos;</li>
                            <li>Applications without offers will transition to &apos;ignored&apos;</li>
                            <li>This action cannot be undone automatically</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
