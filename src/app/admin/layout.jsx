'use client'

import { useEffect, useState } from 'react'
import React from 'react'

export default function AdminLayout({ children }) {
    const [adminUser, setAdminUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Simple JWT check - just try to get admin user info
                const response = await fetch('/api/admin/auth/me', {
                    credentials: 'include'
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success && data.adminUser) {
                        setAdminUser(data.adminUser)
                    }
                }
            } catch (error) {
                console.log('Admin auth check failed:', error)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    // Show loading while checking
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin panel...</p>
                </div>
            </div>
        )
    }

    // Show access denied if no admin user
    if (!adminUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">
                            You need to be logged in as an admin user to access this page.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                Go to Login
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Render children if admin user is available
    return React.cloneElement(children, { adminUser })
}

