'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, DocumentIcon, BanknotesIcon } from '@heroicons/react/24/outline'

export default function BankOffersDisplay({ userInfo, applicationStatus }) {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastRefreshed, setLastRefreshed] = useState(null)

    useEffect(() => {
        if (userInfo?.user_id) {
            fetchOffers()
            
        }
    }, [userInfo])

    const fetchOffers = async () => {
        try {
            setLoading(true)
            console.log('🔍 Fetching offers for user:', userInfo.user_id)
            
            const response = await fetch(`/api/posApplication/${userInfo.user_id}/response`)
            console.log('📡 Response status:', response.status)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('📊 Offers data:', data)
            
            if (data.offers) {
                console.log(`✅ Received ${data.offers.length} offers from API`)
                setOffers(data.offers)
                setLastRefreshed(new Date())
            } else {
                console.log('⚠️ No offers data received from API')
                setOffers([])
            }
        } catch (err) {
            console.error('❌ Failed to fetch offers:', err)
            setError('Failed to load offers')
            setOffers([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl">
                <div className="space-y-4">
                    <div
                        className="overflow-hidden rounded-lg shadow"
                        style={{
                            background: 'linear-gradient(-90deg, #742CFF -9.53%, #1E1851 180.33%)',
                        }}
                    >
                        <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold text-white">
                                Bank Offers
                            </h2>
                        </div>

                        <div className="bg-gray-50 px-4 py-5 sm:p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                    <div className="h-20 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-7xl">
                <div className="space-y-4">
                    <div
                        className="overflow-hidden rounded-lg shadow"
                        style={{
                            background: 'linear-gradient(-90deg, #742CFF -9.53%, #1E1851 180.33%)',
                        }}
                    >
                        <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold text-white">
                                Bank Offers
                            </h2>
                        </div>

                        <div className="bg-gray-50 px-4 py-5 sm:p-6">
                            <div className="text-center">
                                <p className="text-red-600 mb-3">{error}</p>
                                <button
                                    onClick={fetchOffers}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    🔄 Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (offers.length === 0) {
        return (
            <div className="mx-auto max-w-7xl">
                <div className="space-y-4">
                    <div
                        className="overflow-hidden rounded-lg shadow"
                        style={{
                            background: 'linear-gradient(-90deg, #742CFF -9.53%, #1E1851 180.33%)',
                        }}
                    >
                        <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-lg font-semibold text-white">
                                Bank Offers
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchOffers}
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    🔄 Refresh
                                </button>
                                {applicationStatus === 'live_auction' && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-300 px-3 py-1 text-sm font-medium text-yellow-800">
                                        Live Auction
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-5 sm:p-6">
                            <div className="text-center">
                                <h4 className="text-lg font-medium text-gray-800 mb-2">
                                    Live Auction Active
                                </h4>
                                <p className="text-sm text-gray-600">
                                    Banks are viewing your application and may submit offers during the 48-hour auction period.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="space-y-4">
                <div
                    className="overflow-hidden rounded-lg shadow"
                    style={{
                        background: 'linear-gradient(-90deg, #742CFF -9.53%, #1E1851 180.33%)',
                    }}
                >
                    <div className="px-4 py-5 sm:px-6 flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-lg font-semibold text-white">
                            Bank Offers Received
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchOffers}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                🔄 Refresh
                            </button>
                            <span className="inline-flex items-center rounded-full bg-green-300 px-3 py-1 text-sm font-medium text-green-800">
                                {offers.length} offer{offers.length !== 1 ? 's' : ''}
                            </span>
                            {applicationStatus === 'live_auction' && (
                                <span className="inline-flex items-center rounded-full bg-yellow-300 px-3 py-1 text-sm font-medium text-yellow-800">
                                    Live Auction
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-5 sm:p-6 space-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">
                                {applicationStatus === 'live_auction' 
                                    ? 'The following banks have submitted offers during the live auction. More offers may come in before the auction ends.'
                                    : 'The following banks have submitted offers for your application. You can review their terms and conditions.'
                                }
                            </p>
                            {lastRefreshed && (
                                <p className="text-xs text-gray-500">
                                    Last updated: {lastRefreshed.toLocaleTimeString()}
                                </p>
                            )}
                        </div>

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
                </div>
            </div>
        </div>
    )
}
