'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, DocumentIcon, BanknotesIcon } from '@heroicons/react/24/outline'

export default function BankOffersDisplay({ userInfo }) {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (userInfo?.user_id) {
            fetchOffers()
        }
    }, [userInfo])

    const fetchOffers = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/posApplication/${userInfo.user_id}/response`)
            const data = await response.json()
            
            if (data.offers) {
                setOffers(data.offers)
            } else {
                setOffers([])
            }
        } catch (err) {
            console.error('Failed to fetch offers:', err)
            setError('Failed to load offers')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    if (offers.length === 0) {
        return null // Don't show anything if no offers
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-4">
                <BanknotesIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Bank Offers Received
                </h3>
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {offers.length} offer{offers.length !== 1 ? 's' : ''}
                </span>
            </div>
            
            <p className="text-gray-600 mb-4">
                The following banks have submitted offers for your application. You can review their terms and conditions.
            </p>

            <div className="space-y-4">
                {offers.map((offer, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                    <h4 className="font-medium text-gray-900">
                                        {offer.bank_name || 'Bank Offer'}
                                    </h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    {offer.offer_device_setup_fee && (
                                        <div>
                                            <span className="font-medium text-gray-700">Device Setup Fee:</span>
                                            <span className="ml-2 text-gray-600">
                                                SAR {offer.offer_device_setup_fee}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {offer.offer_transaction_fee_mada && (
                                        <div>
                                            <span className="font-medium text-gray-700">Mada Transaction Fee:</span>
                                            <span className="ml-2 text-gray-600">
                                                {offer.offer_transaction_fee_mada}%
                                            </span>
                                        </div>
                                    )}
                                    
                                    {offer.offer_transaction_fee_visa_mc && (
                                        <div>
                                            <span className="font-medium text-gray-700">Visa/MC Transaction Fee:</span>
                                            <span className="ml-2 text-gray-600">
                                                {offer.offer_transaction_fee_visa_mc}%
                                            </span>
                                        </div>
                                    )}
                                    
                                    {offer.offer_settlement_time_mada && (
                                        <div>
                                            <span className="font-medium text-gray-700">Mada Settlement Time:</span>
                                            <span className="ml-2 text-gray-600">
                                                {offer.offer_settlement_time_mada} days
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {offer.offer_comment && (
                                    <div className="mt-3">
                                        <span className="font-medium text-gray-700">Additional Notes:</span>
                                        <p className="mt-1 text-gray-600 text-sm">
                                            {offer.offer_comment}
                                        </p>
                                    </div>
                                )}
                                
                                {offer.uploaded_filename && (
                                    <div className="mt-3">
                                        <div className="flex items-center">
                                            <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-600">
                                                {offer.uploaded_filename}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-right text-xs text-gray-500">
                                {offer.submitted_at && (
                                    <div>
                                        Submitted: {new Date(offer.submitted_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The banks will contact you directly to finalize the deal. 
                    You can review all offers and choose the one that best fits your business needs.
                </p>
            </div>
        </div>
    )
}
