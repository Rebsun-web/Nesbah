'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import JWTUtils from '@/lib/auth/jwt-utils'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const router = useRouter()

    // Verify JWT token without database query
    const verifyJWTToken = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/auth/me', {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.adminUser) {
                    return { valid: true, adminUser: data.adminUser }
                }
            }
            return { valid: false }
        } catch (error) {
            console.error('JWT verification error:', error)
            return { valid: false }
        }
    }, [])

    // Save session to localStorage and state
    const saveSession = useCallback((user) => {
        console.log('🔧 AdminAuthContext: Saving session for user:', user.email)
        localStorage.setItem('adminUser', JSON.stringify(user))
        setAdminUser(user)
        setIsAuthenticated(true)
    }, [])

    // Clear session from localStorage and state
    const clearSession = useCallback(() => {
        console.log('🔧 AdminAuthContext: Clearing session')
        localStorage.removeItem('adminUser')
        setAdminUser(null)
        setIsAuthenticated(false)
    }, [])

    // Initialize authentication state (JWT-only, no database)
    const initializeAuth = useCallback(async () => {
        console.log('🔧 AdminAuthContext: Initializing JWT-only authentication...')
        
        // First check localStorage for quick initialization
        const storedUser = localStorage.getItem('adminUser')
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser)
                console.log('🔧 AdminAuthContext: Found stored user:', user.email)
                
                // Verify JWT token without database query
                const jwtResult = await verifyJWTToken()
                if (jwtResult.valid) {
                    setAdminUser(jwtResult.adminUser)
                    setIsAuthenticated(true)
                    console.log('✅ AdminAuthContext: JWT verification successful')
                } else {
                    console.log('❌ AdminAuthContext: JWT verification failed, clearing session')
                    clearSession()
                }
            } catch (error) {
                console.error('❌ AdminAuthContext: Error during JWT verification:', error)
                clearSession()
            }
        } else {
            console.log('🔧 AdminAuthContext: No stored user found')
            setIsAuthenticated(false)
        }
        
        setIsInitialized(true)
    }, [verifyJWTToken, clearSession])

    // Initialize on mount (JWT-only)
    useEffect(() => {
        initializeAuth()
    }, [initializeAuth])

    // Login function
    const login = async (credentials) => {
        try {
            setLoading(true)
            console.log('🔧 AdminAuthContext: Starting login with credentials:', { email: credentials.email })
            
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            })

            const data = await response.json()
            console.log('🔧 AdminAuthContext: Login response:', data)

            if (data.success && data.adminUser) {
                console.log('🔧 AdminAuthContext: Login successful, saving session...')
                saveSession(data.adminUser)
                
                // Redirect to admin dashboard
                console.log('🔧 AdminAuthContext: Redirecting to /admin')
                setTimeout(() => {
                    router.push('/admin')
                }, 100)
                return { success: true }
            } else {
                console.log('❌ AdminAuthContext: Login failed:', data.error)
                return { success: false, error: data.error || 'Login failed' }
            }
        } catch (error) {
            console.error('❌ AdminAuthContext: Login error:', error)
            return { success: false, error: 'Network error' }
        } finally {
            setLoading(false)
        }
    }

    // Logout function
    const logout = async () => {
        try {
            // Call logout API
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout API error:', error)
        } finally {
            // Always clear local session
            clearSession()
            router.push('/login')
        }
    }

    // Check if user has specific permission (from JWT payload)
    const hasPermission = (permission) => {
        if (!adminUser || !adminUser.permissions) return false
        return adminUser.permissions.includes(permission)
    }

    // Check if user has specific role (from JWT payload)
    const hasRole = (role) => {
        if (!adminUser) return false
        return adminUser.role === role
    }

    // Update admin user data
    const updateAdminUser = (userData) => {
        setAdminUser(userData)
        saveSession(userData)
    }

    const value = {
        isAuthenticated,
        adminUser,
        loading,
        isInitialized,
        login,
        logout,
        verifyJWTToken,
        hasPermission,
        hasRole,
        updateAdminUser
    }

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    )
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext)
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider')
    }
    return context
}

