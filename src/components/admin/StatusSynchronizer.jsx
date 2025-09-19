'use client'

import { useState } from 'react'
import { 
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function StatusSynchronizer() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const synchronizeStatuses = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/admin/synchronize-statuses', {
                method: 'POST',
                credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setResult(data.data)
            } else {
                setError(data.error || 'Failed to synchronize statuses')
            }
        } catch (err) {
            setError('Network error while synchronizing statuses')
        } finally {
            setLoading(false)
        }
    }

    const checkStatuses = async () => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch('/api/admin/synchronize-statuses', {
                method: 'GET',
                credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setResult(data.data)
            } else {
                setError(data.error || 'Failed to check statuses')
            }
        } catch (err) {
            setError('Network error while checking statuses')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Status Synchronizer</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={checkStatuses}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <InformationCircleIcon className="h-4 w-4 mr-2" />
                        Check
                    </button>
                    <button
                        onClick={synchronizeStatuses}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                        )}
                        Synchronize
                    </button>
                </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                <p>This tool ensures all application statuses are synchronized with their calculated values based on auction timing and offers.</p>
                <p className="mt-1"><strong>There should be only one status - the correct one.</strong></p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        <div className="ml-3">
                            <h4 className="text-sm font-medium text-green-800">Synchronization Results</h4>
                            <div className="mt-2 text-sm text-green-700">
                                <p>Total applications checked: {result.total_applications || result.total_checked}</p>
                                {result.synchronized !== undefined && (
                                    <p>Applications synchronized: {result.synchronized}</p>
                                )}
                                {result.need_synchronization !== undefined && (
                                    <p>Applications needing sync: {result.need_synchronization}</p>
                                )}
                                {result.errors !== undefined && result.errors > 0 && (
                                    <p className="text-red-600">Errors: {result.errors}</p>
                                )}
                            </div>
                            
                            {result.applications_needing_sync && result.applications_needing_sync.length > 0 && (
                                <div className="mt-3">
                                    <h5 className="text-sm font-medium text-green-800">Applications needing synchronization:</h5>
                                    <ul className="mt-1 text-sm text-green-700 space-y-1">
                                        {result.applications_needing_sync.map((app, index) => (
                                            <li key={index} className="flex justify-between">
                                                <span>#{app.application_id} - {app.trade_name}</span>
                                                <span className="text-gray-500">
                                                    {app.current_status} → {app.correct_status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
