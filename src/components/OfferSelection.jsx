'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/button'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'

export default function OfferSelection({ user, applicationId }) {
    const [offers, setOffers] = useState([])
    const [applicationStatus, setApplicationStatus] = useState('')
    const [selectedOfferId, setSelectedOfferId] = useState(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(null)

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const res = await fetch(`/api/offers/${applicationId}`)
                const data = await res.json()
                if (data.success) {
                    setOffers(data.data)
                    setApplicationStatus(data.application_status)
                    
                    // Calculate time remaining for offer selection
                    if (data.data.length > 0 && data.data[0].offer_selection_deadline) {
                        const deadline = new Date(data.data[0].offer_selection_deadline)
                        const now = new Date()
                        const timeLeft = deadline - now
                        
                        if (timeLeft > 0) {
                            setTimeRemaining(Math.floor(timeLeft / 1000))
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching offers:', err)
            }
        }

        if (user?.user_id && applicationId) {
            fetchOffers()
        }
    }, [user, applicationId])

    useEffect(() => {
        if (timeRemaining && timeRemaining > 0) {
            const interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(interval)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [timeRemaining])

    const formatTimeRemaining = (seconds) => {
        if (seconds <= 0) return 'Expired'
        
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleSelectOffer = async (offerId) => {
        if (!user?.user_id) return
        
        setIsSelecting(true)
        try {
            const res = await fetch(`/api/offers/${applicationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selected_offer_id: offerId,
                    business_user_id: user.user_id
                })
            })

            const data = await res.json()
            if (data.success) {
                // Update local state to reflect selection
                setOffers(prev => prev.map(offer => ({
                    ...offer,
                    offer_status: offer.id === offerId ? 'deal_won' : 'deal_lost'
                })))
                setApplicationStatus('completed')
                alert('Offer selected successfully!')
            } else {
                alert(`Failed to select offer: ${data.error}`)
            }
        } catch (err) {
            console.error('Error selecting offer:', err)
            alert('Failed to select offer')
        } finally {
            setIsSelecting(false)
        }
    }

    if (applicationStatus !== 'offer_received' && applicationStatus !== 'completed') {
        return null
    }

    if (offers.length === 0) {
        return (
            <div className="mx-auto max-w-7xl">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        No Offers Received
                    </h3>
                    <p className="text-yellow-700">
                        No banks have submitted offers for your application yet.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6">
                <Heading>Select Your Preferred Offer</Heading>
                {timeRemaining !== null && (
                    <div className="mt-2">
                        <Badge color={timeRemaining < 3600 ? 'rose' : 'lime'}>
                            ⏰ {formatTimeRemaining(timeRemaining)} remaining
                        </Badge>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {offers.map((offer) => (
                    <div
                        key={offer.offer_id}
                        className={`border rounded-lg p-6 ${
                            offer.offer_status === 'deal_won' 
                                ? 'border-green-500 bg-green-50' 
                                : offer.offer_status === 'deal_lost'
                                ? 'border-gray-300 bg-gray-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {offer.bank_name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Submitted: {new Date(offer.submitted_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {offer.offer_status === 'deal_won' && (
                                    <Badge color="lime">Selected</Badge>
                                )}
                                {offer.offer_status === 'deal_lost' && (
                                    <Badge color="rose">Not Selected</Badge>
                                )}
                                {offer.offer_status === 'submitted' && (
                                    <Badge color="blue">Available</Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Device Setup Fee</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {offer.offer_device_setup_fee || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Transaction Fee (Mada)</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {offer.offer_transaction_fee_mada || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Transaction Fee (Visa/MC)</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {offer.offer_transaction_fee_visa_mc || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Settlement Time</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {offer.offer_settlement_time_mada || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {offer.offer_comment && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700">Additional Comments</p>
                                <p className="text-gray-900">{offer.offer_comment}</p>
                            </div>
                        )}

                        {applicationStatus === 'offer_received' && offer.offer_status === 'submitted' && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => handleSelectOffer(offer.offer_id)}
                                    disabled={isSelecting || timeRemaining <= 0}
                                    className="bg-gradient-to-r from-[#1E1851] to-[#4436B7] text-white"
                                >
                                    {isSelecting ? 'Selecting...' : 'Select This Offer'}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {timeRemaining <= 0 && applicationStatus === 'offer_received' && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                        ⚠️ The offer selection deadline has passed. No offers can be selected.
                    </p>
                </div>
            )}
        </div>
    )
}
