'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDebug() {
    const [authStatus, setAuthStatus] = useState('Checking...')
    const [adminUser, setAdminUser] = useState(null)
    const [localStorageData, setLocalStorageData] = useState({})
    const router = useRouter()

    useEffect(() => {
        // Check localStorage
        const adminUserData = localStorage.getItem('adminUser')
        const adminAuthenticated = localStorage.getItem('adminAuthenticated')
        
        setLocalStorageData({
            adminUser: adminUserData ? JSON.parse(adminUserData) : null,
            adminAuthenticated
        })

        // Check API authentication
        checkAuthStatus()
    }, [])

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/admin/auth/me', {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                setAuthStatus('✅ Authenticated')
                setAdminUser(data.adminUser)
            } else {
                setAuthStatus('❌ Not authenticated')
            }
        } catch (error) {
            setAuthStatus(`❌ Error: ${error.message}`)
        }
    }

    const forceLogin = async () => {
        try {
            const response = await fetch('/api/auth/unified-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: 'admin@nesbah.com',
                    password: 'admin123'
                })
            })

            const data = await response.json()
            
            if (response.ok && data.success) {
                localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
                setAuthStatus('✅ Login successful')
                setAdminUser(data.adminUser)
                
                // Force redirect
                setTimeout(() => {
                    window.location.href = '/admin'
                }, 2000)
            } else {
                setAuthStatus(`❌ Login failed: ${data.error}`)
            }
        } catch (error) {
            setAuthStatus(`❌ Login error: ${error.message}`)
        }
    }

    const clearAuth = () => {
        localStorage.removeItem('adminUser')
        localStorage.removeItem('adminAuthenticated')
        setAuthStatus('❌ Cleared')
        setAdminUser(null)
        setLocalStorageData({})
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Admin Authentication Debug
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Authentication Status */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">API Status:</span>
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        authStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {authStatus}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">localStorage:</span>
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        localStorageData.adminUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {localStorageData.adminUser ? '✅ Has data' : '❌ No data'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Actions</h2>
                            <div className="space-y-3">
                                <button
                                    onClick={forceLogin}
                                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Force Admin Login
                                </button>
                                
                                <button
                                    onClick={clearAuth}
                                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Clear Authentication
                                </button>
                                
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Go to Admin Dashboard
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin User Data */}
                    {adminUser && (
                        <div className="mt-6 bg-gray-50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">Admin User Data</h2>
                            <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
                                {JSON.stringify(adminUser, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* localStorage Data */}
                    <div className="mt-6 bg-gray-50 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">localStorage Data</h2>
                        <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(localStorageData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}
