'use client'

import { useState, useEffect } from 'react'

export default function EmailJSTestPage() {
    const [mounted, setMounted] = useState(false)
    const [emailjs, setEmailjs] = useState(null)
    const [testResult, setTestResult] = useState(null)

    useEffect(() => {
        setMounted(true)
        
        // Dynamically import EmailJS
        import('@emailjs/browser').then((module) => {
            setEmailjs(module.default)
            console.log('EmailJS loaded:', module.default)
        }).catch((error) => {
            console.error('Failed to load EmailJS:', error)
            setTestResult({
                success: false,
                error: 'Failed to load EmailJS module',
                details: error.message
            })
        })
    }, [])

    const testEmailJS = async () => {
        if (!emailjs) {
            setTestResult({
                success: false,
                error: 'EmailJS not loaded yet'
            })
            return
        }

        try {
            console.log('Testing EmailJS initialization...')
            
            // Test initialization
            emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
            
            setTestResult({
                success: true,
                message: 'EmailJS initialized successfully',
                serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'
            })
        } catch (error) {
            console.error('EmailJS initialization error:', error)
            setTestResult({
                success: false,
                error: error.message,
                details: error.toString()
            })
        }
    }

    if (!mounted) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">EmailJS Module Test</h1>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                        This test checks if EmailJS can be loaded and initialized properly.
                    </p>
                    
                    <button
                        onClick={testEmailJS}
                        disabled={!emailjs}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {emailjs ? 'Test EmailJS Initialization' : 'Loading EmailJS...'}
                    </button>
                </div>

                {testResult && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Test Result:</h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(testResult, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">Environment Check:</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                        <div>NEXT_PUBLIC_EMAILJS_SERVICE_ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'Not set'}</div>
                        <div>NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}</div>
                        <div>EmailJS Module: {emailjs ? 'Loaded' : 'Not loaded'}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
