'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectAdminLogin() {
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()

    const performDirectLogin = async () => {
        setIsLoggingIn(true)
        setMessage('Logging in...')

        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: 'admin@nesbah.com',
                    password: 'admin123'
                })
            })

            const data = await response.json()
            console.log('Direct login response:', response.status, data)

            if (response.ok && data.success) {
                setMessage('✅ Login successful! Redirecting...')
                localStorage.setItem('adminUser', JSON.stringify(data.adminUser))
                
                // Force redirect with window.location
                setTimeout(() => {
                    window.location.href = '/admin'
                }, 1000)
            } else {
                setMessage(`❌ Login failed: ${data.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Direct login error:', error)
            setMessage(`❌ Network error: ${error.message}`)
        } finally {
            setIsLoggingIn(false)
        }
    }

    useEffect(() => {
        // Auto-login after 2 seconds
        const timer = setTimeout(() => {
            performDirectLogin()
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">N</span>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Direct Admin Login
                    </h1>
                    
                    <p className="text-gray-600 mb-6">
                        Testing admin authentication...
                    </p>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-2">Credentials:</div>
                            <div className="font-mono text-xs">
                                <div>Email: admin@nesbah.com</div>
                                <div>Password: admin123</div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-800">
                                {message || 'Preparing to login...'}
                            </div>
                        </div>

                        {!isLoggingIn && (
                            <button
                                onClick={performDirectLogin}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Try Manual Login
                            </button>
                        )}

                        {isLoggingIn && (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                <span className="text-purple-600">Logging in...</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <a 
                            href="/login" 
                            className="text-purple-600 hover:text-purple-700 text-sm"
                        >
                            ← Back to regular login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
