'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BuildingOfficeIcon, DocumentTextIcon, MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function BusinessInfoModal({ isOpen, onClose, businessData, onSubmitOffer }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!businessData) return null

    const ns = (val) => (val === null || val === undefined || val === '') ? 'Not specified' : val

    const handleSubmitOffer = async () => {
        if (onSubmitOffer) {
            setIsSubmitting(true)
            try {
                await onSubmitOffer(businessData)
            } catch (error) {
                console.error('Error submitting offer:', error)
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const formatMoney = (amount) => {
        if (!amount) return 'Not specified'
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return 'Not specified'
        return `SAR ${num.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        })}`
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return 'Not specified'
        }
    }

    const maskContactInfo = (type, value) => {
        if (!value) return 'Not specified'
        
        switch (type) {
            case 'email':
                return '***@***.com'
            case 'phone':
                return '05********'
            case 'name':
                return value.charAt(0) + '***'
            default:
                return value
        }
    }

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Business Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Business Information
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {(businessData.company_name || businessData.trade_name) && (
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-medium text-gray-700">Business Name:</span>
                                                            <span className="text-sm text-gray-900 text-right max-w-[60%] break-words">{businessData.company_name || businessData.trade_name}</span>
                                                        </div>
                                                    )}
                                                    {(businessData.city || businessData.city_of_operation) && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">City:</span>
                                                            <span className="text-sm text-gray-900">{businessData.city_of_operation || businessData.city}</span>
                                                        </div>
                                                    )}
                                                    {businessData.sector && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Sector:</span>
                                                            <span className="text-sm text-gray-900">{businessData.sector}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Financing Details */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Financing Details
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {businessData.financing_type && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-700">Financing Type:</span>
                                                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full capitalize">
                                                                {businessData.financing_type.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {businessData.approximate_financing_amount && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Approximate Amount Needed:</span>
                                                            <span className="text-sm text-gray-900">{businessData.approximate_financing_amount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Contact Information
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {businessData.contact_person && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Contact Person:</span>
                                                            <span className="text-sm text-gray-900">{maskContactInfo('name', businessData.contact_person)}</span>
                                                        </div>
                                                    )}
                                                    {businessData.contact_person_number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Mobile Number:</span>
                                                            <span className="text-sm text-gray-900">{maskContactInfo('phone', businessData.contact_person_number)}</span>
                                                        </div>
                                                    )}
                                                    {businessData.business_contact_email && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Email:</span>
                                                            <span className="text-sm text-gray-900">{maskContactInfo('email', businessData.business_contact_email)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wathiq / Business Registry Data */}
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                Business Registry (Wathiq)
                                            </h4>
                                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR Number:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.cr_number)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Legal Form:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.legal_form)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Registration Status:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.registration_status)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Issue Date:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.issue_date_gregorian)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Confirmation Date:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.confirmation_date_gregorian)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">City (HQ):</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.hq_city)}</span>
                                                    </div>
                                                    {businessData.headquarter_district_name && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">District:</span>
                                                            <span className="text-sm text-gray-900">{businessData.headquarter_district_name}</span>
                                                        </div>
                                                    )}
                                                    {businessData.headquarter_street_name && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Street:</span>
                                                            <span className="text-sm text-gray-900">{businessData.headquarter_street_name}</span>
                                                        </div>
                                                    )}
                                                    {businessData.headquarter_building_number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Building No.:</span>
                                                            <span className="text-sm text-gray-900">{businessData.headquarter_building_number}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR Capital:</span>
                                                        <span className="text-sm text-gray-900">{businessData.cr_capital ? formatMoney(businessData.cr_capital) : 'Not specified'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Cash Capital:</span>
                                                        <span className="text-sm text-gray-900">{businessData.cash_capital ? formatMoney(businessData.cash_capital) : 'Not specified'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Management Structure:</span>
                                                        <span className="text-sm text-gray-900">{ns(businessData.management_structure)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Has E-Commerce:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.has_ecommerce === null || businessData.has_ecommerce === undefined
                                                                ? 'Not specified'
                                                                : businessData.has_ecommerce ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                    {businessData.has_ecommerce && businessData.store_url && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Store URL:</span>
                                                            <span className="text-sm text-gray-900 break-all">{businessData.store_url}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Verified:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.is_verified === null || businessData.is_verified === undefined
                                                                ? 'Not specified'
                                                                : businessData.is_verified ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Activities — only shown for purchased leads */}
                                                {Array.isArray(businessData.activities) && businessData.activities.length > 0 && (
                                                    <div className="pt-3 border-t border-blue-200">
                                                        <span className="text-sm font-medium text-gray-700 block mb-1">Activities:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {businessData.activities.map((a, i) => (
                                                                <span key={i} className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">{a}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Management Managers — only shown for purchased leads */}
                                                {Array.isArray(businessData.management_managers) && businessData.management_managers.length > 0 && (
                                                    <div className="pt-3 border-t border-blue-200">
                                                        <span className="text-sm font-medium text-gray-700 block mb-2">Management:</span>
                                                        <div className="space-y-1">
                                                            {businessData.management_managers.map((m, i) => {
                                                                const manager = typeof m === 'string' ? { name: m } : m
                                                                return (
                                                                    <div key={i} className="text-sm text-gray-900">
                                                                        {manager.name}{manager.role ? ` — ${manager.role}` : ''}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Purpose of Financing */}
                                        {businessData.notes && (
                                            <div className="mt-6 space-y-2">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Purpose of Financing
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{businessData.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Information */}
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                Application Details
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Application ID:</span>
                                                    <span className="text-sm text-gray-900">{businessData.application_id || 'Not specified'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Submitted At:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {businessData.submitted_at ? new Date(businessData.submitted_at).toLocaleString() : 'Not specified'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                                    <span className="text-sm text-gray-900">{businessData.status || 'Not specified'}</span>
                                                </div>
                                            </div>
                                        </div>




                                        {/* Uploaded Files */}
                                        {businessData.uploaded_filename && (
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Uploaded Documents
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                📎 {businessData.uploaded_filename}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Uploaded with application • {businessData.uploaded_mimetype || 'Unknown type'}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={`/api/leads/${businessData.application_id}/document`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Offers Information */}
                                        {businessData.offers && businessData.offers.length > 0 && (
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    Offers ({businessData.offers.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {businessData.offers && Array.isArray(businessData.offers) ? businessData.offers.map((offer, index) => {
                                                        try {
                                                            return (
                                                                <div key={offer.offer_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="text-sm font-semibold text-gray-900">
                                                                            Offer #{offer.offer_id || 'Not specified'} by {offer.bank_name || 'Unknown Bank'}
                                                                        </h5>
                                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                            offer.status === 'live_auction' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                            {offer.status || 'Not specified'}
                                                                        </span>
                                                                    </div>
                                                                    {offer.offer_comment && (
                                                                        <p className="text-sm text-gray-700 mb-2">
                                                                            <strong>Comment:</strong> {offer.offer_comment || 'Not specified'}
                                                                        </p>
                                                                    )}
                                                                    {offer.offer_terms && (
                                                                        <p className="text-sm text-gray-700 mb-2">
                                                                            <strong>Terms:</strong> {offer.offer_terms || 'Not specified'}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-500">
                                                                        Submitted: {offer.submitted_at ? new Date(offer.submitted_at).toLocaleString() : 'Not specified'}
                                                                    </p>
                                                                </div>
                                                            );
                                                        } catch (error) {
                                                            console.error('Error rendering offer:', error);
                                                            return (
                                                                <div key={index} className="bg-red-50 rounded-lg p-4 border border-red-200">
                                                                    <p className="text-sm text-red-600">Error loading offer data</p>
                                                                </div>
                                                            );
                                                        }
                                                    }) : <span className="text-gray-500 italic">No offers available</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse space-y-3 sm:space-y-0">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                    {onSubmitOffer && (
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                            onClick={handleSubmitOffer}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Offer'}
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
