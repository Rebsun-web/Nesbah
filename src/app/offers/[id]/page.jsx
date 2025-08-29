'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    ArrowLeftIcon,
    CheckCircleIcon, 
    DocumentIcon, 
    BanknotesIcon, 
    ClockIcon,
    ShieldCheckIcon,
    StarIcon,
    TagIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    CogIcon,
    WrenchScrewdriverIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'
import { useViewTracking } from '@/hooks/useViewTracking';
import AuthGuard from '@/components/auth/AuthGuard';

function OfferDetailsPageContent() {
    const { t } = useLanguage()
    const params = useParams()
    const router = useRouter()
    const [offer, setOffer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (params.id) {
            fetchOfferDetails()
        }
    }, [params.id])

    // Add view tracking for offer details (if we have bank user context)
    // Note: This will only track if bank user is available in localStorage
    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const bankUser = JSON.parse(stored);
                if (bankUser?.user_type === 'bank_user' && bankUser?.user_id && params.id) {
                    // For offer details, we track the application ID if available
                    // This will be enhanced when we have the application ID in the offer data
                }
            } catch (error) {
                console.error('❌ Error parsing user data:', error);
            }
        }
    }, [params.id]);

    const fetchOfferDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/offers/${params.id}`)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            
            if (data.success) {
                setOffer(data.offer)
            } else {
                setError(data.error || 'Failed to fetch offer details')
            }
        } catch (err) {
            console.error('❌ Failed to fetch offer details:', err)
            setError('Failed to load offer details')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        router.back()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-64 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Offer not found</p>
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to Offers
                    </button>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-4" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {offer.bank_name || 'Bank Offer'}
                                    </h1>
                                </div>
                            </div>
                            <div className="text-right">
                                {offer.is_featured && (
                                    <div className="flex items-center mb-2">
                                        <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
                                        <span className="text-sm font-medium text-yellow-700">Featured Offer</span>
                                    </div>
                                )}
                                <div className="text-sm text-gray-500">
                                    Submitted: {new Date(offer.submitted_at).toLocaleDateString()}
                                </div>
                                {offer.offer_validity_days && (
                                    <div className="text-sm text-gray-500">
                                        Valid for: {offer.offer_validity_days} days
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Financial Details */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <BanknotesIcon className="h-5 w-5 text-blue-600 mr-2" />
                                Financial Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {offer.offer_device_setup_fee && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-blue-700">Device Setup Fee</span>
                                        <div className="text-lg font-semibold text-blue-900">
                                            SAR {offer.offer_device_setup_fee}
                                        </div>
                                    </div>
                                )}
                                
                                {offer.offer_transaction_fee_mada && (
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-green-700">Mada Transaction Fee</span>
                                        <div className="text-lg font-semibold text-green-900">
                                            {offer.offer_transaction_fee_mada}%
                                        </div>
                                    </div>
                                )}
                                
                                {offer.offer_transaction_fee_visa_mc && (
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-purple-700">Visa/MC Transaction Fee</span>
                                        <div className="text-lg font-semibold text-purple-900">
                                            {offer.offer_transaction_fee_visa_mc}%
                                        </div>
                                    </div>
                                )}

                                {offer.deal_value && (
                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-orange-700">Deal Value</span>
                                        <div className="text-lg font-semibold text-orange-900">
                                            SAR {offer.deal_value}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Settlement Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                                Settlement Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {offer.offer_settlement_time_mada && (
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-green-700">Mada Settlement</span>
                                        <div className="text-lg font-semibold text-green-900">
                                            {offer.offer_settlement_time_mada} hours
                                        </div>
                                    </div>
                                )}
                                
                                {offer.offer_settlement_time_visa_mc && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-blue-700">Visa/MC Settlement</span>
                                        <div className="text-lg font-semibold text-blue-900">
                                            {offer.offer_settlement_time_visa_mc} hours
                                        </div>
                                    </div>
                                )}

                                {offer.settlement_time && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <span className="text-sm font-medium text-gray-700">General Settlement</span>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {offer.settlement_time}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Offer Features */}
                        {(offer.includes_hardware || offer.includes_software || offer.includes_support) && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <CogIcon className="h-5 w-5 text-purple-600 mr-2" />
                                    Included Services
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {offer.includes_hardware && (
                                        <div className="flex items-center bg-purple-50 rounded-lg p-4">
                                            <DevicePhoneMobileIcon className="h-6 w-6 text-purple-600 mr-3" />
                                            <div>
                                                <div className="font-medium text-purple-900">Hardware Included</div>
                                                <div className="text-sm text-purple-700">POS devices & equipment</div>
                                            </div>
                                        </div>
                                    )}
                                    {offer.includes_software && (
                                        <div className="flex items-center bg-blue-50 rounded-lg p-4">
                                            <ComputerDesktopIcon className="h-6 w-6 text-blue-600 mr-3" />
                                            <div>
                                                <div className="font-medium text-blue-900">Software Included</div>
                                                <div className="text-sm text-blue-700">POS software & systems</div>
                                            </div>
                                        </div>
                                    )}
                                    {offer.includes_support && (
                                        <div className="flex items-center bg-green-50 rounded-lg p-4">
                                            <WrenchScrewdriverIcon className="h-6 w-6 text-green-600 mr-3" />
                                            <div>
                                                <div className="font-medium text-green-900">Support Included</div>
                                                <div className="text-sm text-green-700">Technical support & maintenance</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {(offer.support_hours || offer.warranty_months) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {offer.support_hours && (
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <span className="text-sm font-medium text-gray-700">Support Hours</span>
                                                <div className="text-lg font-semibold text-gray-900">{offer.support_hours}</div>
                                            </div>
                                        )}
                                        {offer.warranty_months && (
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <span className="text-sm font-medium text-gray-700">Warranty Period</span>
                                                <div className="text-lg font-semibold text-gray-900">{offer.warranty_months} months</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pricing & Volume Discounts */}
                        {(offer.pricing_tier || offer.volume_discount_threshold || offer.volume_discount_percentage) && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <TagIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                    Pricing & Volume Discounts
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {offer.pricing_tier && (
                                        <div className="bg-yellow-50 rounded-lg p-4">
                                            <span className="text-sm font-medium text-yellow-700">Pricing Tier</span>
                                            <div className="text-lg font-semibold text-yellow-900 capitalize">{offer.pricing_tier}</div>
                                        </div>
                                    )}
                                    {offer.volume_discount_threshold && (
                                        <div className="bg-orange-50 rounded-lg p-4">
                                            <span className="text-sm font-medium text-orange-700">Volume Threshold</span>
                                            <div className="text-lg font-semibold text-orange-900">SAR {offer.volume_discount_threshold}</div>
                                        </div>
                                    )}
                                    {offer.volume_discount_percentage && (
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <span className="text-sm font-medium text-red-700">Volume Discount</span>
                                            <div className="text-lg font-semibold text-red-900">{offer.volume_discount_percentage}%</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}



                        {/* Offer Terms */}
                        {offer.offer_terms && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Offer Terms & Conditions</h2>
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <p className="text-orange-800 whitespace-pre-wrap">{offer.offer_terms}</p>
                                </div>
                            </div>
                        )}

                        {/* Additional Comments */}
                        {offer.offer_comment && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Comments</h2>
                                <div className="bg-teal-50 rounded-lg p-4">
                                    <p className="text-teal-800">{offer.offer_comment}</p>
                                </div>
                            </div>
                        )}

                        {/* Featured Reason */}
                        {offer.is_featured && offer.featured_reason && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <StarIcon className="h-5 w-5 text-yellow-600 mr-2" />
                                    Why This Offer is Featured
                                </h2>
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <p className="text-amber-800">{offer.featured_reason}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Bank Contact Information */}
                        {(offer.bank_contact_person || offer.bank_contact_email || offer.bank_contact_phone) && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <UserIcon className="h-5 w-5 text-gray-600 mr-2" />
                                    Bank Contact Information
                                </h3>
                                <div className="space-y-3">
                                    {offer.bank_contact_person && (
                                        <div className="flex items-center">
                                            <UserIcon className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{offer.bank_contact_person}</div>
                                                <div className="text-sm text-gray-500">Contact Person</div>
                                            </div>
                                        </div>
                                    )}
                                    {offer.bank_contact_email && (
                                        <div className="flex items-center">
                                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{offer.bank_contact_email}</div>
                                                <div className="text-sm text-gray-500">Email</div>
                                            </div>
                                        </div>
                                    )}
                                    {offer.bank_contact_phone && (
                                        <div className="flex items-center">
                                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{offer.bank_contact_phone}</div>
                                                <div className="text-sm text-gray-500">Phone</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Uploaded Document */}
                        {offer.uploaded_filename && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <DocumentIcon className="h-5 w-5 text-gray-600 mr-2" />
                                    Attached Document
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <DocumentIcon className="h-8 w-8 text-slate-500 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{offer.uploaded_filename}</div>
                                            <div className="text-sm text-slate-500">Document attached to offer</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div>
    )
}

export default function OfferDetailsPage() {
    return (
        <AuthGuard requiredUserType="bank_user">
            <OfferDetailsPageContent />
        </AuthGuard>
    )
}
