'use client'

import { useState, useEffect } from 'react'

export default function EnvCheckPage() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">Environment Variables Check</h1>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Environment Variables Check</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">EmailJS Configuration</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">NEXT_PUBLIC_EMAILJS_SERVICE_ID:</span>
                                <span className={process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'Not set'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="font-medium">NEXT_PUBLIC_EMAILJS_PUBLIC_KEY:</span>
                                <span className={process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="font-medium">NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID:</span>
                                <span className={process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID || 'Not set'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="font-medium">DISABLE_EMAIL_NOTIFICATIONS:</span>
                                <span className={process.env.DISABLE_EMAIL_NOTIFICATIONS === 'false' ? 'text-green-600' : 'text-yellow-600'}>
                                    {process.env.DISABLE_EMAIL_NOTIFICATIONS || 'Not set'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="font-medium">Server-side EMAILJS_SERVICE_ID:</span>
                                <span className={process.env.EMAILJS_SERVICE_ID ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.EMAILJS_SERVICE_ID || 'Not set'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="font-medium">Server-side EMAILJS_PUBLIC_KEY:</span>
                                <span className={process.env.EMAILJS_PUBLIC_KEY ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.EMAILJS_PUBLIC_KEY ? '***configured***' : 'Not set'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="font-medium">Server-side EMAILJS_PRIVATE_KEY:</span>
                                <span className={process.env.EMAILJS_PRIVATE_KEY ? 'text-green-600' : 'text-red-600'}>
                                    {process.env.EMAILJS_PRIVATE_KEY ? '***configured***' : 'Not set'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-md">
                        <h3 className="font-medium text-blue-900 mb-2">Current Email Configuration:</h3>
                        <p className="text-blue-800">
                            <strong>Service ID:</strong> {process.env.EMAILJS_SERVICE_ID || 'Not configured'}<br/>
                            <strong>Contact Email:</strong> devadmin@nesbah.com.sa<br/>
                            <strong>Notifications:</strong> {process.env.DISABLE_EMAIL_NOTIFICATIONS === 'false' ? 'Enabled' : 'Disabled'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
