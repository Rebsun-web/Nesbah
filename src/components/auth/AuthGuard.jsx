'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthGuard({ 
    children, 
    requiredUserType = null,
    redirectTo = '/login',
    showLoading = true 
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = () => {
            try {
                // Check for admin user first (admin users use different storage)
                if (requiredUserType === 'admin_user') {
                    const storedAdminUser = localStorage.getItem('adminUser')
                    if (storedAdminUser) {
                        const adminData = JSON.parse(storedAdminUser)
                        if (adminData.user_type === 'admin_user') {
                            setUser(adminData)
                            setIsAuthenticated(true)
                            setLoading(false)
                            return
                        } else {
                            console.log(`❌ Admin user type mismatch. Expected: admin_user, Got: ${adminData.user_type}`)
                            localStorage.removeItem('adminUser')
                        }
                    }
                } else {
                    // Check for regular user
                    const storedUser = localStorage.getItem('user')
                    if (storedUser) {
                        const userData = JSON.parse(storedUser)
                        
                        // Validate user type if specified
                        if (requiredUserType && userData.user_type !== requiredUserType) {
                            console.log(`❌ User type mismatch. Expected: ${requiredUserType}, Got: ${userData.user_type}`)
                            localStorage.removeItem('user')
                            router.push(redirectTo)
                            return
                        }
                        
                        setUser(userData)
                        setIsAuthenticated(true)
                        setLoading(false)
                        return
                    }
                }

                // No valid user found
                console.log('❌ No authenticated user found, redirecting to login')
                setIsAuthenticated(false)
                setLoading(false)
                router.push(redirectTo)
                
            } catch (error) {
                console.error('❌ Error checking authentication:', error)
                localStorage.removeItem('user')
                localStorage.removeItem('adminUser')
                setIsAuthenticated(false)
                setLoading(false)
                router.push(redirectTo)
            }
        }

        checkAuth()
    }, [requiredUserType, redirectTo, router])

    // Show loading spinner
    if (loading && showLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying authentication...</p>
                </div>
            </div>
        )
    }

    // Show unauthorized message
    if (!loading && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">
                            {requiredUserType 
                                ? `You need to be logged in as a ${requiredUserType.replace('_', ' ')} to access this page.`
                                : 'You need to be logged in to access this page.'
                            }
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push(redirectTo)}
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

    // Render children if authenticated
    return children
}
