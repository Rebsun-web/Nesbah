'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminUrlCache } from '@/components/admin/AdminNavigationCache'

export default function TestCachePage() {
    const { getCachedUrl, lastUrl } = useAdminAuth()
    const [cacheInfo, setCacheInfo] = useState({
        contextUrl: '',
        utilityUrl: '',
        localStorageUrl: '',
        hasUrl: false
    })

    const updateCacheInfo = () => {
        setCacheInfo({
            contextUrl: getCachedUrl(),
            utilityUrl: AdminUrlCache.getUrl(),
            localStorageUrl: typeof window !== 'undefined' ? localStorage.getItem('nesbah_admin_last_url') || 'None' : 'None',
            hasUrl: AdminUrlCache.hasUrl()
        })
    }

    useEffect(() => {
        updateCacheInfo()
    }, [])

    const testSaveUrl = (url) => {
        AdminUrlCache.saveUrl(url)
        setTimeout(updateCacheInfo, 100)
    }

    const testClearUrl = () => {
        AdminUrlCache.clearUrl()
        setTimeout(updateCacheInfo, 100)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Context Cacher Test Page</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Current Cache Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded">
                            <h3 className="font-medium text-blue-900">AdminAuthContext</h3>
                            <p className="text-blue-700">URL: {cacheInfo.contextUrl}</p>
                            <p className="text-blue-700">Last URL State: {lastUrl || 'None'}</p>
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
                            onClick={updateCacheInfo}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                            Refresh Status
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
                    <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                        <p>Current Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
                        <p>localStorage Available: {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}</p>
                        <p>AdminAuthContext Available: {typeof useAdminAuth === 'function' ? 'Yes' : 'No'}</p>
                        <p>AdminUrlCache Available: {typeof AdminUrlCache === 'object' ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
