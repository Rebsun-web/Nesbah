'use client'

import { useState, useEffect } from 'react'
import { useViewTracking } from '@/hooks/useViewTracking'

export default function ViewTrackingTest({ applicationId }) {
    const [bankUser, setBankUser] = useState(null)
    const [trackingStatus, setTrackingStatus] = useState('')
    const [testResults, setTestResults] = useState([])

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (stored) {
            const parsed = JSON.parse(stored)
            setBankUser(parsed)
        }
    }, [])

    // Use the view tracking hook
    const { trackCustomAction } = useViewTracking(
        applicationId,
        bankUser?.user_id,
        !!bankUser && !!applicationId
    )

    const testViewTracking = async () => {
        if (!bankUser || !applicationId) {
            setTrackingStatus('❌ No bank user or application ID available')
            return
        }

        setTrackingStatus('🔄 Testing view tracking...')
        setTestResults([])

        try {
            // Test 1: Manual view tracking
            await trackCustomAction('manual_view_test', { test_type: 'manual' })
            setTestResults(prev => [...prev, '✅ Manual view tracking successful'])

            // Test 2: Download action
            await trackCustomAction('download_document', { document_type: 'test_document' })
            setTestResults(prev => [...prev, '✅ Download action tracking successful'])

            // Test 3: Contact action
            await trackCustomAction('contact_business', { method: 'test_contact' })
            setTestResults(prev => [...prev, '✅ Contact action tracking successful'])

            // Test 4: Direct API call
            const response = await fetch('/api/bank/application-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    application_id: applicationId,
                    action_type: 'api_test',
                    session_id: `test_session_${Date.now()}`
                }),
                credentials: 'include'
            })

            if (response.ok) {
                setTestResults(prev => [...prev, '✅ Direct API call successful'])
            } else {
                setTestResults(prev => [...prev, '❌ Direct API call failed'])
            }

            setTrackingStatus('✅ View tracking test completed successfully!')

        } catch (error) {
            console.error('View tracking test error:', error)
            setTrackingStatus('❌ View tracking test failed')
            setTestResults(prev => [...prev, `❌ Error: ${error.message}`])
        }
    }

    const checkViewHistory = async () => {
        if (!bankUser || !applicationId) {
            setTrackingStatus('❌ No bank user or application ID available')
            return
        }

        try {
            const response = await fetch(`/api/bank/application-view?application_id=${applicationId}`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setTestResults(prev => [...prev, `📊 View history: ${data.data?.length || 0} records found`])
                
                if (data.data && data.data.length > 0) {
                    data.data.forEach((record, index) => {
                        setTestResults(prev => [...prev, 
                            `  ${index + 1}. ${record.action_type || 'view'} at ${new Date(record.viewed_at || record.action_timestamp).toLocaleString()}`
                        ])
                    })
                }
            } else {
                setTestResults(prev => [...prev, '❌ Failed to fetch view history'])
            }
        } catch (error) {
            setTestResults(prev => [...prev, `❌ Error fetching view history: ${error.message}`])
        }
    }

    if (!bankUser) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                    <strong>View Tracking Test:</strong> Please log in as a bank user to test view tracking functionality.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🧪 View Tracking Test Panel
            </h3>
            
            <div className="space-y-3">
                <div className="text-sm text-blue-700">
                    <strong>Bank User:</strong> {bankUser.email || bankUser.entity_name}
                </div>
                <div className="text-sm text-blue-700">
                    <strong>Application ID:</strong> {applicationId}
                </div>
                <div className="text-sm text-blue-700">
                    <strong>Status:</strong> {trackingStatus || 'Ready to test'}
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={testViewTracking}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                    Test View Tracking
                </button>
                
                <button
                    onClick={checkViewHistory}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                    Check View History
                </button>
            </div>

            {testResults.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-medium text-blue-900 mb-2">Test Results:</h4>
                    <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
                        {testResults.map((result, index) => (
                            <div key={index} className="text-sm text-gray-700 mb-1">
                                {result}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs text-blue-600">
                <p><strong>Note:</strong> This test panel helps verify that view tracking is working correctly.</p>
                <p>Check the browser console for detailed tracking logs.</p>
            </div>
        </div>
    )
}
