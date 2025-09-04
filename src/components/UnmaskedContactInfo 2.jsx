'use client'

import { useState, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon, PhoneIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline'

export default function UnmaskedContactInfo({ applicationId, bankUserId }) {
    const [contactInfo, setContactInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showUnmasked, setShowUnmasked] = useState(false)

    useEffect(() => {
        if (applicationId && bankUserId) {
            fetchUnmaskedContactInfo()
        }
    }, [applicationId, bankUserId])

    const fetchUnmaskedContactInfo = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/leads/${applicationId}/unmasked-contact`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': bankUserId,
                    'x-user-type': 'bank_user'
                }
            })

            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setContactInfo(data.data)
                } else {
                    setError(data.error || 'Failed to fetch contact information')
                }
            } else {
                setError('Failed to fetch contact information')
            }
        } catch (err) {
            console.error('Error fetching unmasked contact info:', err)
            setError('Failed to fetch contact information')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <EyeSlashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Contact Information Unavailable</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!contactInfo) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <EyeIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Contact Information</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>Submit an offer to view unmasked contact information.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Unmasked Contact Information</h3>
                <button
                    onClick={() => setShowUnmasked(!showUnmasked)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {showUnmasked ? (
                        <>
                            <EyeSlashIcon className="h-4 w-4 mr-2" />
                            Hide Details
                        </>
                    ) : (
                        <>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Show Details
                        </>
                    )}
                </button>
            </div>

            {showUnmasked ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Contact Person</p>
                                <p className="text-sm text-gray-500">{contactInfo.contact_person || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Phone Number</p>
                                <p className="text-sm text-gray-500">{contactInfo.contact_person_number || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Email Address</p>
                                <p className="text-sm text-gray-500">{contactInfo.email || 'Not provided'}</p>
                            </div>
                        </div>

                        {contactInfo.website && (
                            <div className="flex items-center space-x-3">
                                <div className="h-5 w-5 text-gray-400">
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414l3 3a2 2 0 012.828 0 2 2 0 002.828-2.828l-1.586-1.586a1 1 0 00-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Website</p>
                                    <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-500">
                                        {contactInfo.website}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {contactInfo.address && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Business Address</h4>
                            <p className="text-sm text-gray-500">{contactInfo.address}</p>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">POS Provider:</span>
                                <span className="ml-2 text-gray-500">{contactInfo.pos_provider_name || 'Not specified'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">POS Age:</span>
                                <span className="ml-2 text-gray-500">{contactInfo.pos_age_duration_months ? `${contactInfo.pos_age_duration_months} months` : 'Not specified'}</span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Monthly Sales:</span>
                                <span className="ml-2 text-gray-500">{contactInfo.avg_monthly_pos_sales ? `SAR ${parseFloat(contactInfo.avg_monthly_pos_sales).toLocaleString()}` : 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Contact Information Hidden</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Click &quot;Show Details&quot; to view the complete contact information for this lead.
                    </p>
                </div>
            )}
        </div>
    )
}
