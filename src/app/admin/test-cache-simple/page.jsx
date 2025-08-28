'use client'

import { useState, useEffect } from 'react'

export default function SimpleCacheTest() {
    const [cacheStatus, setCacheStatus] = useState('Loading...')
    const [currentPath, setCurrentPath] = useState('Loading...')

    useEffect(() => {
        // Test localStorage directly
        const testUrl = '/admin/test-page'
        
        console.log('🧪 SimpleCacheTest: Testing localStorage directly')
        console.log('🧪 SimpleCacheTest: Current pathname:', window.location.pathname)
        
        try {
            // Save a test URL
            localStorage.setItem('nesbah_admin_last_url', testUrl)
            console.log('🧪 SimpleCacheTest: Saved test URL:', testUrl)
            
            // Read it back
            const saved = localStorage.getItem('nesbah_admin_last_url')
            console.log('🧪 SimpleCacheTest: Retrieved URL:', saved)
            
            setCacheStatus(saved === testUrl ? 'Working' : 'Failed')
            setCurrentPath(window.location.pathname)
            
        } catch (error) {
            console.error('🧪 SimpleCacheTest: Error:', error)
            setCacheStatus('Error: ' + error.message)
        }
    }, [])

    const testSave = () => {
        const url = '/admin/analytics'
        localStorage.setItem('nesbah_admin_last_url', url)
        console.log('🧪 SimpleCacheTest: Manually saved:', url)
        setCacheStatus('Saved: ' + url)
    }

    const testRead = () => {
        const url = localStorage.getItem('nesbah_admin_last_url')
        console.log('🧪 SimpleCacheTest: Manually read:', url)
        setCacheStatus('Read: ' + (url || 'None'))
    }

    const testClear = () => {
        localStorage.removeItem('nesbah_admin_last_url')
        console.log('🧪 SimpleCacheTest: Cleared cache')
        setCacheStatus('Cleared')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Cache Test</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                    <div className="space-y-4">
                        <div>
                            <strong>Cache Status:</strong> {cacheStatus}
                        </div>
                        <div>
                            <strong>Current Path:</strong> {currentPath}
                        </div>
                        <div>
                            <strong>localStorage Available:</strong> {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={testSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Save URL
                        </button>
                        <button
                            onClick={testRead}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Read URL
                        </button>
                        <button
                            onClick={testClear}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Clear Cache
                        </button>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instructions</h3>
                    <ol className="text-yellow-700 list-decimal list-inside space-y-1">
                        <li>Open browser console (F12 → Console)</li>
                        <li>Look for 🧪 messages</li>
                        <li>Use the manual test buttons</li>
                        <li>Check if localStorage is working</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
