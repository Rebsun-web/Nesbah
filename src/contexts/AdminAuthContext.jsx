'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Save admin user to state
    const saveAdminUser = useCallback((user) => {
        setAdminUser(user)
    }, [])

    // Clear admin user from state
    const clearAdminUser = useCallback(() => {
        setAdminUser(null)
    }, [])

    // Login function
    const login = async (credentials) => {
        try {
            setLoading(true)
            
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            })

            const data = await response.json()

            if (data.success && data.adminUser) {
                saveAdminUser(data.adminUser)
                router.push('/admin')
                return { success: true }
            } else {
                return { success: false, error: data.error || 'Login failed' }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Network error' }
        } finally {
            setLoading(false)
        }
    }

    // Logout function
    const logout = async () => {
        try {
            // Call logout API to clear server-side cookie
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
            
            // Clear state
            clearAdminUser()
            
            // Redirect to login
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
            // Force redirect even on error
            router.push('/login')
        }
    }

    // Check if admin has permission
    const hasPermission = useCallback((permission) => {
        if (!adminUser || !adminUser.permissions) {
            return false
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true
        }
        
        // Check specific permission
        return adminUser.permissions[permission] === true
    }, [adminUser])

    // Check if admin has any of the specified permissions
    const hasAnyPermission = useCallback((permissions) => {
        if (!adminUser || !adminUser.permissions) {
            return false
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true
        }
        
        // Check if admin has any of the specified permissions
        return permissions.some(permission => adminUser.permissions[permission] === true)
    }, [adminUser])

    // Check if admin has all of the specified permissions
    const hasAllPermissions = useCallback((permissions) => {
        if (!adminUser || !adminUser.permissions) {
            return false
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true
        }
        
        // Check if admin has all of the specified permissions
        return permissions.every(permission => adminUser.permissions[permission] === true)
    }, [adminUser])

    return (
        <AdminAuthContext.Provider value={{
            adminUser,
            loading,
            login,
            logout,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions
        }}>
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

