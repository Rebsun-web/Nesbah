'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ 
    children, 
    userType, 
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
                // Check for regular user
                const storedUser = localStorage.getItem('user')
                if (storedUser) {
                    const userData = JSON.parse(storedUser)
                    
                    // Validate user type if specified
                    if (userType && userData.user_type !== userType) {
                        console.log(`❌ User type mismatch. Expected: ${userType}, Got: ${userData.user_type}`)
                        localStorage.removeItem('user')
                        router.push(redirectTo)
                        return
                    }
                    
                    setUser(userData)
                    setIsAuthenticated(true)
                    setLoading(false)
                    return
                }

                // Check for admin user
                const storedAdminUser = localStorage.getItem('adminUser')
                if (storedAdminUser) {
                    const adminData = JSON.parse(storedAdminUser)
                    
                    // For admin routes, userType should be 'admin_user'
                    if (userType === 'admin_user') {
                        setUser(adminData)
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
    }, [userType, redirectTo, router])

    // Show loading spinner
    if (loading && showLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Show unauthorized message
    if (!loading && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
                    <button 
                        onClick={() => router.push('/login')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    // Render children if authenticated
    return children
}
