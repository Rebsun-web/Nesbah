'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export default function ProtectedRoute({ children, requiredPermissions = [] }) {
    const { adminUser, loading, isAuthenticated, hasPermission } = useAdminAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/admin/login')
        }
    }, [loading, isAuthenticated, router])

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return null
    }

    // Check permissions if required
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
            hasPermission(permission)
        )

        if (!hasAllPermissions) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access this page.
                        </p>
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )
        }
    }

    return children
}
