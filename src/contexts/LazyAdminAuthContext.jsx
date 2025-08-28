'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Create context
const LazyAdminAuthContext = createContext()

export function LazyAdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Verify JWT token
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
      // Don't immediately invalidate on network errors - keep existing state
      return { valid: false, error: 'Network error' }
    }
  }, [])

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔧 LazyAdminAuthContext: Starting initialization...')
      
      // Check for stored admin user first
      const storedUser = localStorage.getItem('adminUser')
      console.log('🔧 LazyAdminAuthContext: Stored user raw:', storedUser)
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🔧 LazyAdminAuthContext: Parsed user data:', userData)
          console.log('🔧 LazyAdminAuthContext: User type:', userData?.user_type)
          if (userData && userData.user_type === 'admin_user') {
            console.log('🔧 LazyAdminAuthContext: Found stored admin user:', userData.email)
            
            // Set the user data immediately for better UX
            setAdminUser(userData)
            setIsAuthenticated(true)
            console.log('🔧 LazyAdminAuthContext: Set authentication state to true')
            
            // Verify JWT token in background
            const jwtResult = await verifyJWTToken()
            if (jwtResult.valid) {
              console.log('🔧 LazyAdminAuthContext: JWT verification successful')
              setAdminUser(jwtResult.adminUser)
            } else {
              console.log('🔧 LazyAdminAuthContext: JWT verification failed, but keeping stored user for admin portal access')
              // Keep the stored user data
            }
          } else {
            console.log('🔧 LazyAdminAuthContext: Invalid stored user data')
            localStorage.removeItem('adminUser')
            setAdminUser(null)
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('🔧 LazyAdminAuthContext: Error parsing stored user:', error)
          localStorage.removeItem('adminUser')
          setAdminUser(null)
          setIsAuthenticated(false)
        }
      } else {
        console.log('🔧 LazyAdminAuthContext: No stored admin user found')
        setAdminUser(null)
        setIsAuthenticated(false)
      }
      
      setIsInitialized(true)
      console.log('🔧 LazyAdminAuthContext: Initialization complete. isAuthenticated:', isAuthenticated)
    } catch (error) {
      console.error('🔧 LazyAdminAuthContext: Initialization error:', error)
      setIsInitialized(true)
    }
  }, [verifyJWTToken])

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth()
    }
  }, [initializeAuth, isInitialized])

  // Force re-initialization when localStorage changes (for login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔧 LazyAdminAuthContext: Storage change detected, re-initializing...')
      setIsInitialized(false)
      initializeAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [initializeAuth])

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      console.log('🔧 LazyAdminAuthContext: Starting login with credentials:', { email: credentials.email })
      
      // Use the admin login endpoint
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      console.log('🔧 LazyAdminAuthContext: Login response:', data)

      if (data.success && data.adminUser) {
        console.log('🔧 LazyAdminAuthContext: Admin login successful, saving session...')
        console.log('🔧 LazyAdminAuthContext: Admin user data to store:', data.adminUser)
        
        // Store admin user data
        const userDataToStore = JSON.stringify(data.adminUser)
        console.log('🔧 LazyAdminAuthContext: Storing user data:', userDataToStore)
        localStorage.setItem('adminUser', userDataToStore)
        
        // Verify storage
        const storedData = localStorage.getItem('adminUser')
        console.log('🔧 LazyAdminAuthContext: Verification - stored data:', storedData)
        
        // Update state immediately
        setAdminUser(data.adminUser)
        setIsAuthenticated(true)
        console.log('🔧 LazyAdminAuthContext: Updated authentication state')
        
        // Force a small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirect to admin dashboard
        console.log('🔧 LazyAdminAuthContext: Redirecting to /admin')
        router.push('/admin')
        return { success: true }
      } else {
        console.log('❌ LazyAdminAuthContext: Login failed:', data.error)
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('❌ LazyAdminAuthContext: Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }, [router])

  // Logout function
  const logout = useCallback(() => {
    console.log('🔧 LazyAdminAuthContext: Logging out...')
    localStorage.removeItem('adminUser')
    setAdminUser(null)
    setIsAuthenticated(false)
    router.push('/login')
  }, [router])

  // Check permission function
  const hasPermission = useCallback((permission) => {
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
  }, [adminUser])

  const value = {
    login,
    logout,
    hasPermission,
    isAuthenticated,
    adminUser,
    isInitialized,
    verifyJWTToken,
    // Add a function to handle API errors without clearing auth
    handleApiError: (error) => {
      console.error('🔧 LazyAdminAuthContext: API error handled:', error)
      // Don't clear authentication on API errors, just log them
    },
    // Add a function to force re-initialization
    refreshAuth: () => {
      console.log('🔧 LazyAdminAuthContext: Manual refresh requested')
      setIsInitialized(false)
      initializeAuth()
    }
  }

  return (
    <LazyAdminAuthContext.Provider value={value}>
      {children}
    </LazyAdminAuthContext.Provider>
  )
}

export function useLazyAdminAuth() {
  const context = useContext(LazyAdminAuthContext)
  if (!context) {
    throw new Error('useLazyAdminAuth must be used within a LazyAdminAuthProvider')
  }
  return context
}
