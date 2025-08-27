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
                        console.log('❌ ProtectedRoute: JWT verification failed, redirecting to login')
                        router.push('/login')
                    }
                } catch (error) {
                    console.error('JWT verification error:', error)
                    router.push('/login')
                } finally {
                    setIsVerifying(false)
                }
            } else if (isInitialized && !isAuthenticated) {
                // No stored session, redirect to login
                console.log('❌ ProtectedRoute: No authentication, redirecting to login')
                router.push('/login')
            }
        }

        checkAuth()
    }, [isInitialized, isAuthenticated, isVerified, verifyJWTToken, router])

    // Check permissions if required (from JWT payload, no database query)
    useEffect(() => {
        if (isVerified && requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
            if (!hasAllPermissions) {
                console.log('❌ ProtectedRoute: User lacks required permissions:', requiredPermissions)
                router.push('/admin/unauthorized')
            }
        }
    }, [isVerified, requiredPermissions, hasPermission, router])

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    // Show unauthorized message if doesn't have required permissions
    if (isVerified && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission))
        if (!hasAllPermissions) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
                        <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                        <button
                            onClick={() => router.push('/admin')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )
        }
    }

    // Render children if authenticated and has permissions
    return children
}
