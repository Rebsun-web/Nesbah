'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminUrlCache } from '@/components/admin/AdminNavigationCache'

export default function DebugCachePage() {
    const { getCachedUrl, lastUrl, loading } = useAdminAuth()
    const [mounted, setMounted] = useState(false)
    const [cacheInfo, setCacheInfo] = useState({
        contextUrl: '',
        utilityUrl: '',
        localStorageUrl: '',
        hasUrl: false,
        currentPath: ''
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    const updateCacheInfo = () => {
        setCacheInfo({
            contextUrl: getCachedUrl(),
            utilityUrl: AdminUrlCache.getUrl(),
            localStorageUrl: typeof window !== 'undefined' ? localStorage.getItem('nesbah_admin_last_url') || 'None' : 'None',
            hasUrl: AdminUrlCache.hasUrl(),
            currentPath: mounted ? window.location.pathname : 'Loading...'
        })
    }

    useEffect(() => {
        updateCacheInfo()
        console.log('🔧 DebugCachePage: Component mounted')
        console.log('🔧 DebugCachePage: loading:', loading)
    }, [loading])

    const testSaveUrl = (url) => {
        console.log('🔧 DebugCachePage: Testing save URL:', url)
        AdminUrlCache.saveUrl(url)
        setTimeout(updateCacheInfo, 100)
    }

    const testClearUrl = () => {
        console.log('🔧 DebugCachePage: Testing clear URL')
        AdminUrlCache.clearUrl()
        setTimeout(updateCacheInfo, 100)
    }

    const forceRefresh = () => {
        console.log('🔧 DebugCachePage: Force refresh')
        updateCacheInfo()
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Context Cacher Debug Page</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded">
                            <h3 className="font-medium text-blue-900">AdminAuthContext</h3>
                            <p className="text-blue-700">Loading: {loading ? 'Yes' : 'No'}</p>
                            <p className="text-blue-700">Last URL State: {lastUrl || 'None'}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded">
                            <h3 className="font-medium text-green-900">Current Page</h3>
                            <p className="text-green-700">Pathname: {cacheInfo.currentPath}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Cache Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded">
                            <h3 className="font-medium text-blue-900">AdminAuthContext</h3>
                            <p className="text-blue-700">URL: {cacheInfo.contextUrl}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded">
                            <h3 className="font-medium text-green-900">AdminUrlCache Utility</h3>
                            <p className="text-green-700">URL: {cacheInfo.utilityUrl}</p>
                            <p className="text-green-700">Has URL: {cacheInfo.hasUrl ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded">
                            <h3 className="font-medium text-purple-900">localStorage Direct</h3>
                            <p className="text-purple-700">URL: {cacheInfo.localStorageUrl}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => testSaveUrl('/admin/analytics')}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Save /admin/analytics
                        </button>
                        <button
                            onClick={() => testSaveUrl('/admin/applications')}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Save /admin/applications
                        </button>
                        <button
                            onClick={() => testSaveUrl('/admin/users')}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                            Save /admin/users
                        </button>
                        <button
                            onClick={testClearUrl}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Clear Cache
                        </button>
                        <button
                            onClick={forceRefresh}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                            Refresh Status
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
                    <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                        <p>Current Pathname: {mounted ? window.location.pathname : 'Loading...'}</p>
                        <p>localStorage Available: {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}</p>
                        <p>AdminAuthContext Available: {typeof useAdminAuth === 'function' ? 'Yes' : 'No'}</p>
                        <p>AdminUrlCache Available: {typeof AdminUrlCache === 'object' ? 'Yes' : 'No'}</p>
                        <p>Window Object: {typeof window !== 'undefined' ? 'Available' : 'Not Available'}</p>
                        <p>Document Object: {typeof document !== 'undefined' ? 'Available' : 'Not Available'}</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions</h3>
                    <ol className="text-yellow-700 list-decimal list-inside space-y-1">
                        <li>Open browser console (F12 → Console)</li>
                        <li>Navigate to different admin pages</li>
                        <li>Look for 🔧 and 🔗 console messages</li>
                        <li>Use the test buttons above to manually test caching</li>
                        <li>Check localStorage in DevTools → Application → Local Storage</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
