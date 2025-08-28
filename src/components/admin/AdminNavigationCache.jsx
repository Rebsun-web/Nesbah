'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminNavigationCache() {
    const pathname = usePathname()

    // Debug: Log component mount and pathname
    useEffect(() => {
        console.log('🔧 AdminNavigationCache: Component mounted')
        console.log('🔧 AdminNavigationCache: Current pathname:', pathname)
        console.log('🔧 AdminNavigationCache: Window available:', typeof window !== 'undefined')
        console.log('🔧 AdminNavigationCache: localStorage available:', typeof window !== 'undefined' && window.localStorage)
        
        // Test localStorage immediately on mount
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const testKey = 'admin_nav_cache_test'
                localStorage.setItem(testKey, 'test_value')
                const testValue = localStorage.getItem(testKey)
                localStorage.removeItem(testKey)
                console.log('🔧 AdminNavigationCache: localStorage test result:', testValue === 'test_value' ? 'PASSED' : 'FAILED')
            } catch (error) {
                console.error('🔧 AdminNavigationCache: localStorage test failed:', error)
            }
        }
    }, [])

    // Save current URL whenever it changes
    useEffect(() => {
        console.log('🔧 AdminNavigationCache: Pathname changed to:', pathname)
        
        if (pathname && pathname.startsWith('/admin')) {
            console.log('🔧 AdminNavigationCache: Pathname is admin page, checking exclusions...')
            
            if (pathname && !pathname.includes('/admin/auth')) {
                console.log('🔧 AdminNavigationCache: Pathname passed all checks, attempting to save...')
                
                try {
                    localStorage.setItem('nesbah_admin_last_url', pathname)
                    console.log('🔗 AdminNavigationCache: Successfully saved URL to cache:', pathname)
                    
                    // Verify it was saved
                    const saved = localStorage.getItem('nesbah_admin_last_url')
                    console.log('🔧 AdminNavigationCache: Verification - saved URL:', saved)
                } catch (error) {
                    console.error('❌ AdminNavigationCache: Failed to save URL to cache:', error)
                }
            } else {
                console.log('🔧 AdminNavigationCache: Pathname excluded (login/auth):', pathname)
            }
        } else {
            console.log('🔧 AdminNavigationCache: Pathname not admin or is login:', pathname)
        }
    }, [pathname])

    // This component doesn't render anything, it just handles caching
    return null
}

// Utility functions for URL caching
export const AdminUrlCache = {
    // Save a specific URL to cache
    saveUrl: (url) => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('nesbah_admin_last_url', url)
                console.log('🔗 AdminUrlCache: Saved URL:', url)
            } catch (error) {
                console.error('❌ AdminUrlCache: Failed to save URL:', error)
            }
        }
    },

    // Get the cached URL
    getUrl: () => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('nesbah_admin_last_url')
                console.log('🔗 AdminUrlCache: Retrieved URL:', cached || '/admin (default)')
                return cached || '/admin'
            } catch (error) {
                console.error('❌ AdminUrlCache: Failed to get URL:', error)
                return '/admin'
            }
        }
        return '/admin'
    },

    // Clear the cached URL
    clearUrl: () => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('nesbah_admin_last_url')
                console.log('🔗 AdminUrlCache: Cleared URL cache')
            } catch (error) {
                console.error('❌ AdminUrlCache: Failed to clear URL:', error)
            }
        }
    },

    // Check if we have a cached URL
    hasUrl: () => {
        if (typeof window !== 'undefined') {
            try {
                const hasUrl = !!localStorage.getItem('nesbah_admin_last_url')
                console.log('🔗 AdminUrlCache: Has cached URL:', hasUrl)
                return hasUrl
            } catch (error) {
                console.error('❌ AdminUrlCache: Failed to check URL:', error)
                return false
            }
        }
        return false
    }
}
