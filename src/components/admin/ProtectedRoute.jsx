'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [adminUser, setAdminUser] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const checkAuth = () => {
            try {
                // Check if localStorage is available
                if (typeof localStorage === 'undefined') {
                    console.error('❌ ProtectedRoute: localStorage is not available')
                    setIsAuthenticated(false)
                    setLoading(false)
                    router.push('/login')
                    return
                }

                // Check for admin JWT token and admin user data
                const adminJWT = localStorage.getItem('adminJWT')
                const storedAdminUser = localStorage.getItem('adminUser')
                
                console.log('🔍 ProtectedRoute: Checking authentication...')
                console.log('🔍 ProtectedRoute: Admin JWT found:', !!adminJWT)
                console.log('🔍 ProtectedRoute: Admin user data found:', !!storedAdminUser)
                
                if (!adminJWT || !storedAdminUser) {
                    console.log('❌ ProtectedRoute: Missing authentication data')
                    setIsAuthenticated(false)
                    setLoading(false)
                    router.push('/login')
                    return
                }

                try {
                    const userData = JSON.parse(storedAdminUser)
                    
                    // Validate user type
                    if (userData.user_type !== 'admin_user') {
                        console.log(`❌ ProtectedRoute: User type mismatch. Expected: admin_user, Got: ${userData.user_type}`)
                        localStorage.removeItem('adminJWT')
                        localStorage.removeItem('adminUser')
                        setIsAuthenticated(false)
                        setLoading(false)
                        router.push('/login')
                        return
                    }
                    
                    // Check if user is active
                    if (userData.is_active === false) {
                        console.log('❌ ProtectedRoute: Admin account is not active')
                        localStorage.removeItem('adminJWT')
                        localStorage.removeItem('adminUser')
                        setIsAuthenticated(false)
                        setLoading(false)
                        router.push('/login')
                        return
                    }
                    
                    console.log('✅ ProtectedRoute: Authentication successful')
                    setAdminUser(userData)
                    setIsAuthenticated(true)
                    setLoading(false)
                    
                } catch (parseError) {
                    console.error('❌ ProtectedRoute: Error parsing admin user data:', parseError)
                    localStorage.removeItem('adminJWT')
                    localStorage.removeItem('adminUser')
                    setIsAuthenticated(false)
                    setLoading(false)
                    router.push('/login')
                }
                
            } catch (error) {
                console.error('❌ ProtectedRoute: Error checking authentication:', error)
                localStorage.removeItem('adminJWT')
                localStorage.removeItem('adminUser')
                setIsAuthenticated(false)
                setLoading(false)
                router.push('/login')
            }
        }

        checkAuth()
    }, [router])

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        )
    }

    // If not authenticated, don't render anything (will redirect)
    if (!isAuthenticated || !adminUser) {
        return null
    }

    // Render the protected content
    return <>{children}</>
}
