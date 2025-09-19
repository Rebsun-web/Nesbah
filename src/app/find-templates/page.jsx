'use client'

import { useState, useEffect } from 'react'
import emailjs from '@emailjs/browser'

export default function FindTemplatesPage() {
    const [mounted, setMounted] = useState(false)
    const [testResult, setTestResult] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const testTemplates = async () => {
        setLoading(true)
        setTestResult(null)

        const templates = [
            'template_auto_reply',
            'template_newsletter',
            'default_template',
            'template_1',
            'contact_form',
            'newsletter',
            'auto_reply',
            'template_default'
        ]

        const results = []

        for (const template of templates) {
            try {
                console.log(`Testing template: ${template}`)
                
                emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
                
                const response = await emailjs.send(
                    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
                    template,
                    {
                        to_email: 'test@example.com',
                        test: 'test'
                    }
                )
                
                results.push({
                    template,
                    success: true,
                    message: 'Template exists and works'
                })
                
                console.log(`✅ Template ${template} works`)
                break // Stop at first successful template
                
            } catch (error) {
                results.push({
                    template,
                    success: false,
                    error: error.message || 'Template not found'
                })
                console.log(`❌ Template ${template} failed:`, error.message)
            }
        }

        setTestResult({
            results,
            summary: `Tested ${templates.length} templates`
        })
        setLoading(false)
    }

    if (!mounted) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Working Templates</h1>
                
                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                        This will test common template names to find which ones work in your EmailJS service.
                    </p>
                    
                    <button
                        onClick={testTemplates}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Testing Templates...' : 'Test All Templates'}
                    </button>
                </div>

                {testResult && (
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Template Test Results:</h3>
                        
                        <div className="space-y-2">
                            {testResult.results.map((result, index) => (
                                <div key={index} className={`p-3 rounded-md ${
                                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{result.template}</span>
                                        <span className={`text-sm ${
                                            result.success ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {result.success ? '✅ Works' : '❌ Failed'}
                                        </span>
                                    </div>
                                    {result.error && (
                                        <div className="text-sm text-red-600 mt-1">
                                            Error: {result.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Summary:</strong> {testResult.summary}
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 rounded-md">
                    <h3 className="font-medium text-yellow-900 mb-2">Configuration:</h3>
                    <div className="text-sm text-yellow-800 space-y-1">
                        <div>Service ID: {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID}</div>
                        <div>Public Key: {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
