'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import LoginStatusModal from '@/components/LoginStatusModal'

export default function AdminLogin() {
    const router = useRouter()
    const { login: adminLogin, logout, isAuthenticated, adminUser } = useAdminAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mfaToken, setMfaToken] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [requiresMFA, setRequiresMFA] = useState(false)
    const [modalMessage, setModalMessage] = useState('')

    // If already authenticated, show logout option
    if (isAuthenticated && adminUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
                            <p className="text-gray-600">You are already logged in as an admin.</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                        {adminUser.email.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{adminUser.full_name}</p>
                                    <p className="text-sm text-gray-600">{adminUser.email}</p>
                                    <p className="text-xs text-purple-600 font-medium">{adminUser.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/admin')}
                                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                Go to Admin Dashboard
                            </button>
                            
                            <button
                                onClick={logout}
                                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        console.log('🔐 Admin login form submitted for:', email)
        
        if (isLoading) {
            console.log('⚠️ Login already in progress, ignoring duplicate submission')
            return
        }
        
        setIsLoading(true)
        setIsModalOpen(false)

        try {
            // If MFA is required, use admin login endpoint
            if (requiresMFA && mfaToken) {
                const adminResponse = await fetch('/api/auth/unified-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email, 
                        password, 
                        mfaToken 
                    }),
                })

                const adminData = await adminResponse.json()
                console.log('Admin login response:', adminResponse.status, adminData)

                if (adminResponse.ok && adminData?.success) {
                    console.log('✅ Admin login successful, using AdminAuthContext')
                    const loginResult = await adminLogin({ email, password, mfaToken })
                    if (loginResult.success) {
                        return
                    } else {
                        setModalMessage(loginResult.error || 'Admin login failed')
                        setIsModalOpen(true)
                    }
                } else {
                    setModalMessage(adminData.error || 'Admin login failed')
                    setIsModalOpen(true)
                }
                return
            }

            // Try admin login
            const adminResponse = await fetch('/api/auth/unified-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const adminData = await adminResponse.json()
            console.log('Admin login attempt:', adminResponse.status, adminData)

            if (adminResponse.ok && adminData?.success) {
                console.log('✅ Admin login successful, using AdminAuthContext')
                const loginResult = await adminLogin({ email, password })
                if (loginResult.success) {
                    return
                } else {
                    setModalMessage(loginResult.error || 'Admin login failed')
                    setIsModalOpen(true)
                }
            } else if (adminData?.requiresMFA) {
                setRequiresMFA(true)
                setModalMessage('MFA token required. Please enter your 6-digit code.')
                setIsModalOpen(true)
            } else {
                setModalMessage('Invalid email or password')
                setIsModalOpen(true)
            }
        } catch (error) {
            console.error('Error during login:', error)
            setModalMessage('An error occurred during login. Please try again.')
            setIsModalOpen(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleMFASubmit = async () => {
        if (!mfaToken || mfaToken.length !== 6) {
            setModalMessage('Please enter a valid 6-digit MFA code.')
            return
        }

        setIsLoading(true)
        try {
            const adminResponse = await fetch('/api/auth/unified-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    mfaToken 
                }),
            })

            const adminData = await adminResponse.json()

            if (adminResponse.ok && adminData?.success) {
                console.log('✅ MFA login successful, using AdminAuthContext')
                const loginResult = await adminLogin({ email, password, mfaToken })
                if (loginResult.success) {
                    return
                } else {
                    setModalMessage(loginResult.error || 'MFA login failed')
                    setIsModalOpen(true)
                }
            } else {
                setModalMessage(adminData.error || 'Invalid MFA token')
            }
        } catch (error) {
            console.error('MFA verification error:', error)
            setModalMessage('An error occurred during MFA verification.')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setRequiresMFA(false)
        setMfaToken('')
        setModalMessage('')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
                        <p className="text-gray-600">Sign in to access the admin panel</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={requiresMFA}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    disabled={requiresMFA}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    disabled={requiresMFA}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {requiresMFA && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    MFA Token
                                </label>
                                <input
                                    type="text"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    placeholder="000000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono"
                                    maxLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>
                        )}

                        <button
                            type={requiresMFA ? 'button' : 'submit'}
                            onClick={requiresMFA ? handleMFASubmit : undefined}
                            disabled={isLoading}
                            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : requiresMFA ? 'Verify MFA' : 'Sign In'}
                        </button>

                        {requiresMFA && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                Back to Login
                            </button>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Back to Main Login
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <LoginStatusModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    message={modalMessage}
                />
            )}
        </div>
    )
}
