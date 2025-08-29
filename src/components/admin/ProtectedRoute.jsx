'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export default function ProtectedRoute({ children, requiredPermissions = [] }) {
    const { isAuthenticated, adminUser, isInitialized, verifyJWTToken, hasPermission } = useAdminAuth()
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            // Only verify JWT if we have a stored session and haven't verified yet
            if (isInitialized && isAuthenticated && !isVerified) {
                setIsVerifying(true)
                try {
                    const jwtResult = await verifyJWTToken()
                    if (jwtResult.valid) {
                        setIsVerified(true)
                        console.log('✅ ProtectedRoute: JWT verification successful')
                    } else {
                        console.log('❌ ProtectedRoute: JWT verification failed, showing access denied')
                        // Don't redirect, just let the component show access denied
                    }
                } catch (error) {
                    console.error('JWT verification error:', error)
                    // Don't redirect, just let the component show access denied
                } finally {
                    setIsVerifying(false)
                }
            }
        }

        checkAuth()
    }, [isInitialized, isAuthenticated, isVerified, verifyJWTToken])

    // Show loading while initializing or verifying
    if (!isInitialized || isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        )
    }

    // Show unauthorized message if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                Go to Login
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Show unauthorized message if doesn't have required permissions
    if (isVerified && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
        if (!hasAllPermissions) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                            <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Return to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    // Render children if authenticated and has permissions
    return children
}
