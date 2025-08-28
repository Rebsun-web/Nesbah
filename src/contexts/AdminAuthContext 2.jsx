'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    // URL caching system
    const [lastUrl, setLastUrl] = useState(null)
    const [isRedirecting, setIsRedirecting] = useState(false)

    // Cache key for localStorage
    const ADMIN_LAST_URL_KEY = 'nesbah_admin_last_url'
    const ADMIN_SESSION_KEY = 'nesbah_admin_session'

    // Save current URL to cache
    const saveCurrentUrl = (url) => {
        if (url && !url.includes('/admin/auth')) {
            try {
                localStorage.setItem(ADMIN_LAST_URL_KEY, url)
                setLastUrl(url)
                console.log('🔗 AdminAuthContext: Saved URL to cache:', url)
            } catch (error) {
                console.error('❌ AdminAuthContext: Failed to save URL to cache:', error)
            }
        }
    }

    // Get cached URL
    const getCachedUrl = () => {
        try {
            const cached = localStorage.getItem(ADMIN_LAST_URL_KEY)
            console.log('🔗 AdminAuthContext: Retrieved cached URL:', cached || '/admin (default)')
            return cached || '/admin'
        } catch (error) {
            console.error('❌ AdminAuthContext: Failed to get cached URL:', error)
            return '/admin'
        }
    }

    // Clear cached URL
    const clearCachedUrl = () => {
        localStorage.removeItem(ADMIN_LAST_URL_KEY)
        setLastUrl(null)
    }

    // Save admin session data
    const saveAdminSession = (userData) => {
        if (userData) {
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
                user: userData,
                timestamp: Date.now()
            }))
        }
    }

    // Get cached admin session
    const getCachedSession = () => {
        try {
            const cached = localStorage.getItem(ADMIN_SESSION_KEY)
            if (cached) {
                const session = JSON.parse(cached)
                // Check if session is less than 24 hours old
                if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                    return session.user
                }
            }
        } catch (error) {
            console.error('Error parsing cached session:', error)
        }
        return null
    }

    // Clear admin session
    const clearAdminSession = () => {
        localStorage.removeItem(ADMIN_SESSION_KEY)
        clearCachedUrl()
    }

    // Check authentication status
    const checkAuth = async () => {
        try {
            setLoading(true)
            console.log('🔧 AdminAuthContext: Starting authentication check')
            
            // First check localStorage directly
            const storedAdminUser = localStorage.getItem('adminUser')
            console.log('🔧 AdminAuthContext: Stored admin user:', storedAdminUser ? 'Found' : 'Not found')
            
            if (storedAdminUser) {
                try {
                    const adminData = JSON.parse(storedAdminUser)
                    setAdminUser(adminData)
                    setIsAuthenticated(true)
                    setLoading(false)
                    console.log('✅ Admin user found in localStorage:', adminData)
                    console.log('🔧 AdminAuthContext: Authentication state set - isAuthenticated: true')
                    return
                } catch (e) {
                    console.error('Error parsing stored admin user:', e)
                    localStorage.removeItem('adminUser')
                }
            }
            
            // Then check cached session
            const cachedUser = getCachedSession()
            if (cachedUser) {
                setAdminUser(cachedUser)
                setIsAuthenticated(true)
                setLoading(false)
                return
            }

            const response = await fetch('/api/admin/auth/me', {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success && data.adminUser) {
                    setAdminUser(data.adminUser)
                    setIsAuthenticated(true)
                    saveAdminSession(data.adminUser)
                    console.log('✅ Admin user authenticated from API:', data.adminUser)
                } else {
                    setIsAuthenticated(false)
                    setAdminUser(null)
                    clearAdminSession()
                    console.log('❌ Admin authentication failed:', data.error)
                }
            } else {
                setIsAuthenticated(false)
                setAdminUser(null)
                clearAdminSession()
                console.log('❌ Admin API request failed:', response.status)
            }
        } catch (error) {
            console.error('Auth check error:', error)
            setIsAuthenticated(false)
            setAdminUser(null)
            clearAdminSession()
        } finally {
            setLoading(false)
        }
    }

    // Login function
    const login = async (credentials) => {
        try {
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
                setAdminUser(data.adminUser)
                setIsAuthenticated(true)
                saveAdminSession(data.adminUser)
                
                // Also set in localStorage for immediate access
                localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
                
                // Redirect to cached URL or default admin page
                const redirectUrl = getCachedUrl()
                router.push(redirectUrl)
                return { success: true }
            } else {
                return { success: false, error: data.error || 'Login failed' }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Network error' }
        }
    }

    // Logout function
    const logout = async () => {
        try {
            // Save current URL before logout
            if (pathname && !pathname.includes('/admin/auth')) {
                try {
                    localStorage.setItem(ADMIN_LAST_URL_KEY, pathname)
                    setLastUrl(pathname)
                    console.log('🔗 AdminAuthContext: Saved URL before logout:', pathname)
                } catch (error) {
                    console.error('❌ AdminAuthContext: Failed to save URL before logout:', error)
                }
            }
            
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setAdminUser(null)
            setIsAuthenticated(false)
            clearAdminSession()
            router.push('/login')
        }
    }

    // Redirect to last known location
    const redirectToLastLocation = () => {
        console.log('🔧 AdminAuthContext: redirectToLastLocation called')
        console.log('🔧 AdminAuthContext: isRedirecting:', isRedirecting, 'isAuthenticated:', isAuthenticated)
        
        if (!isRedirecting && isAuthenticated) {
            setIsRedirecting(true)
            const cachedUrl = getCachedUrl()
            console.log('🔧 AdminAuthContext: Redirecting to cached URL:', cachedUrl)
            router.push(cachedUrl)
        } else {
            console.log('🔧 AdminAuthContext: Cannot redirect - isRedirecting:', isRedirecting, 'isAuthenticated:', isAuthenticated)
        }
    }

    // Update admin user data
    const updateAdminUser = (userData) => {
        setAdminUser(userData)
        saveAdminSession(userData)
    }

    // Effect to save URL changes - DISABLED to avoid conflicts with AdminNavigationCache
    // useEffect(() => {
    //     console.log('🔧 AdminAuthContext: URL effect triggered')
    //     console.log('🔧 AdminAuthContext: isAuthenticated:', isAuthenticated)
    //     console.log('🔧 AdminAuthContext: pathname:', pathname)
    //     console.log('🔧 AdminAuthContext: isRedirecting:', isRedirecting)
        
    //     if (isAuthenticated && pathname && !isRedirecting) {
    //         console.log('🔧 AdminAuthContext: All conditions met, checking exclusions...')
            
    //         if (pathname && !pathname.includes('/admin/login') && !pathname.includes('/admin/auth')) {
    //             console.log('🔧 AdminAuthContext: Pathname passed exclusions, saving...')
                
    //             try {
    //                 localStorage.setItem(ADMIN_LAST_URL_KEY, pathname)
    //                 setLastUrl(pathname)
    //                 console.log('🔗 AdminAuthContext: Saved URL in effect:', pathname)
                    
    //                     // Verify it was saved
    //                     const saved = localStorage.getItem(ADMIN_LAST_URL_KEY)
    //                     console.log('🔧 AdminAuthContext: Verification - saved URL:', saved)
    //             } catch (error) {
    //                 console.error('❌ AdminAuthContext: Failed to save URL in effect:', error)
    //             }
    //         } else {
    //             console.log('🔧 AdminAuthContext: Pathname excluded (login/auth):', pathname)
    //         }
    //     } else {
    //         console.log('🔧 AdminAuthContext: Conditions not met - skipping URL save')
    //     }
    // }, [pathname, isAuthenticated, isRedirecting])

    // Effect to check auth on mount
    useEffect(() => {
        checkAuth()
    }, [])

    // Effect to reset isRedirecting when pathname changes
    useEffect(() => {
        if (isRedirecting) {
            console.log('🔧 AdminAuthContext: Resetting isRedirecting flag')
            setIsRedirecting(false)
        }
    }, [pathname])

    // Effect to handle authentication redirects
    useEffect(() => {
        console.log('🔧 AdminAuthContext: Redirect effect triggered')
        console.log('🔧 AdminAuthContext: loading:', loading, 'isAuthenticated:', isAuthenticated, 'pathname:', pathname)
        
        if (!loading) {
            if (!isAuthenticated && pathname && pathname.startsWith('/admin') && !pathname.includes('/login') && !pathname.includes('/direct-login')) {
                // Save current URL before redirecting to login
                if (pathname && !pathname.includes('/admin/auth')) {
                    try {
                        localStorage.setItem(ADMIN_LAST_URL_KEY, pathname)
                        setLastUrl(pathname)
                        console.log('🔗 AdminAuthContext: Saved URL before login redirect:', pathname)
                    } catch (error) {
                        console.error('❌ AdminAuthContext: Failed to save URL before login redirect:', error)
                    }
                }
                router.push('/login')
            } else if (isAuthenticated && pathname === '/login') {
                // Redirect to last known location after login
                console.log('🔧 AdminAuthContext: Redirecting from login to last location')
                redirectToLastLocation()
            } else if (isAuthenticated && pathname === '/admin' && !isRedirecting) {
                // Check if we should redirect to a cached URL instead of /admin
                const cachedUrl = getCachedUrl()
                if (cachedUrl && cachedUrl !== '/admin') {
                    console.log('🔧 AdminAuthContext: Redirecting from /admin to cached URL:', cachedUrl)
                    setIsRedirecting(true)
                    router.push(cachedUrl)
                }
            }
        }
    }, [isAuthenticated, loading, pathname])

    // Permission checking function
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
        checkAuth,
        updateAdminUser,
        lastUrl,
        getCachedUrl,
        clearCachedUrl,
        redirectToLastLocation,
        hasPermission
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
