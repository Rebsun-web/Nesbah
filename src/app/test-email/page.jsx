'use client'

import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'

export default function TestEmailPage() {
    const [testEmail, setTestEmail] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleTestEmail = async () => {
        if (!testEmail) {
            alert('Please enter an email address')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            // Debug environment variables
            console.log('Environment variables:', {
                serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
                templateId: process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID
            })
            
            // Validate required environment variables
            if (!process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID) {
                throw new Error('NEXT_PUBLIC_EMAILJS_SERVICE_ID is not defined')
            }
            if (!process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY) {
                throw new Error('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY is not defined')
            }
            
            // Initialize EmailJS
            emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
            
            // Use the newsletter_subscription template from your dashboard
            const response = await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                'newsletter_subscription', // Use the correct template ID from your dashboard
                {
                    email: testEmail, // Newsletter template likely expects 'email' not 'to_email'
                    user_email: testEmail, // Alternative variable name
                    message: 'This is a test email from Nesbah to verify email configuration.',
                    test_message: 'EmailJS is working correctly!'
                }
            )
            
            setResult({
                success: true,
                message: 'Test email sent successfully!',
                response
            })
        } catch (error) {
            console.error('Email sending error:', error)
            console.error('Error type:', typeof error)
            console.error('Error keys:', Object.keys(error))
            
            setResult({
                success: false,
                error: error.message || 'Unknown error',
                errorType: typeof error,
                errorKeys: Object.keys(error),
                details: JSON.stringify(error, null, 2),
                fullError: error
            })
        } finally {
            setLoading(false)
        }
    }

    const checkConfig = async () => {
        try {
            const response = await fetch('/api/email-status')
            const data = await response.json()
            setResult(data)
        } catch (error) {
            setResult({
                success: false,
                error: error.message
            })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Configuration Test</h1>
                
                {/* Check Configuration Button */}
                <div className="mb-6">
                    <button
                        onClick={checkConfig}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Check Email Configuration
                    </button>
                </div>

                {/* Test Email Form */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Email Address
                    </label>
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={handleTestEmail}
                    disabled={loading || !testEmail}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                    {loading ? 'Sending...' : 'Send Test Email'}
                </button>

                {/* Results */}
                {result && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Result:</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Environment Variables Check */}
                {mounted && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Environment Variables:</h3>
                        <div className="text-sm text-gray-700 space-y-1">
                            <div>NEXT_PUBLIC_EMAILJS_SERVICE_ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'Not set'}</div>
                            <div>NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}</div>
                            <div>NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID: {process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID || 'Not set'}</div>
                            <div>DISABLE_EMAIL_NOTIFICATIONS: {process.env.DISABLE_EMAIL_NOTIFICATIONS || 'Not set'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
