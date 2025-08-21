'use client'

import { useState } from 'react'
import { 
    XMarkIcon,
    ExclamationTriangleIcon,
    TrashIcon
} from '@heroicons/react/24/outline'

export default function DeleteApplicationModal({ isOpen, onClose, application, onDelete }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleDelete = async () => {
        if (!application) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/applications/${application.application_id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            
            const data = await response.json()
            
            if (data.success) {
                onDelete(application.application_id)
                onClose()
            } else {
                setError(data.error || 'Failed to delete application')
            }
        } catch (err) {
            setError('Network error while deleting application')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Application</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
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

                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Delete Application
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete the application for{' '}
                        <span className="font-medium text-gray-900">
                            {application?.trade_name}
                        </span>?
                        <br />
                        <span className="text-red-600 font-medium">
                            This action cannot be undone.
                        </span>
                    </p>

                    <div className="flex items-center justify-center space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
