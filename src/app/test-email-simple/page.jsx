'use client'

import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'

export default function SimpleTestEmailPage() {
    const [testEmail, setTestEmail] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const testEmailJS = async () => {
        if (!testEmail) {
            alert('Please enter an email address')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            console.log('Testing EmailJS with basic configuration...')
            
            // Initialize EmailJS
            emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
            
            // Try the most basic template
            const response = await emailjs.send(
                process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                'default_template', // Most basic template name
                {
                    to_email: testEmail,
                    subject: 'Test Email from Nesbah',
                    message: 'This is a test email to verify EmailJS configuration.'
                }
            )
            
            setResult({
                success: true,
                message: 'Email sent successfully!',
                response: response
            })
        } catch (error) {
            console.error('EmailJS Error:', error)
            setResult({
                success: false,
                error: error.message,
                errorCode: error.status,
                fullError: error
            })
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Simple Email Test</h1>
                
                <div className="mb-4">
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
                    onClick={testEmailJS}
                    disabled={loading || !testEmail}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Sending...' : 'Send Test Email'}
                </button>

                {result && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Result:</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">Configuration:</h3>
                    <div className="text-sm text-blue-800">
                        <div>Service ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID}</div>
                        <div>Public Key: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}</div>
                        <div>Template: default_template</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
