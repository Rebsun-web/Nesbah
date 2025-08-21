'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            // First check server session (cookie-based authentication)
            const response = await fetch('/api/admin/auth/me', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setAdminUser(data.adminUser)
                    setIsAuthenticated(true)
                    // Store in localStorage for consistency
                    localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
                    setLoading(false)
                    return
                }
            }

            // If no server session, check localStorage for admin user data
            const storedAdminUser = localStorage.getItem('adminUser')
            if (storedAdminUser) {
                const adminData = JSON.parse(storedAdminUser)
                setAdminUser(adminData)
                setIsAuthenticated(true)
                setLoading(false)
                return
            }

            // No authentication found
            setAdminUser(null)
            setIsAuthenticated(false)
            localStorage.removeItem('adminUser')
        } catch (error) {
            console.error('Auth check error:', error)
            setAdminUser(null)
            setIsAuthenticated(false)
            localStorage.removeItem('adminUser')
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password, mfaToken = null) => {
        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password, mfaToken })
            })

            const data = await response.json()

            if (data.success) {
                setAdminUser(data.adminUser)
                setIsAuthenticated(true)
                // Store in localStorage for unified login system
                localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
                return { success: true }
            } else {
                return { success: false, error: data.error, requiresMFA: data.requiresMFA }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Network error' }
        }
    }

    const logout = async () => {
        try {
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setAdminUser(null)
            setIsAuthenticated(false)
            localStorage.removeItem('adminUser')
            router.push('/login')
        }
    }

    const hasPermission = (permission) => {
        if (!adminUser || !adminUser.permissions) {
            return false
        }

        // Super admin has all permissions
        if (adminUser.role === 'super_admin') {
            return true
        }

        // Check specific permission
        if (adminUser.permissions.all_permissions) {
            return true
        }

        return adminUser.permissions[permission] === true
    }

    const value = {
        adminUser,
        loading,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        checkAuthStatus
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
