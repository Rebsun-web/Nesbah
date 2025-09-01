'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BuildingOfficeIcon, DocumentTextIcon, MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function BusinessInfoModal({ isOpen, onClose, businessData, onSubmitOffer }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!businessData) return null

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
        if (!amount) return 'N/A'
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return 'N/A'
        return `SAR ${num.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
        })}`
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return 'N/A'
        }
    }

    const maskContactInfo = (type, value) => {
        if (!value) return 'N/A'
        
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
                                        {/* Debug Section - Remove after fixing */}
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <h4 className="text-sm font-medium text-red-800 mb-2">🔍 Debug - Raw Data Received:</h4>
                                            <div className="text-xs text-red-700 space-y-1">
                                                <div>pos_provider_name: "{businessData.pos_provider_name || 'undefined'}"</div>
                                                <div>pos_age_duration_months: "{businessData.pos_age_duration_months || 'undefined'}"</div>
                                                <div>avg_monthly_pos_sales: "{businessData.avg_monthly_pos_sales || 'undefined'}"</div>
                                                <div>requested_financing_amount: "{businessData.requested_financing_amount || 'undefined'}"</div>
                                                <div>preferred_repayment_period_months: "{businessData.preferred_repayment_period_months || 'undefined'}"</div>
                                                <div>city_of_operation: "{businessData.city_of_operation || 'undefined'}"</div>
                                                <div>notes: "{businessData.notes || 'undefined'}"</div>
                                                <div>All keys: {Object.keys(businessData).join(', ')}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Business Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Business Information
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Business Name:</span>
                                                        <span className="text-sm text-gray-900">{businessData.trade_name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR Number:</span>
                                                        <span className="text-sm text-gray-900">{businessData.cr_number || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR National Number:</span>
                                                        <span className="text-sm text-gray-900">{businessData.cr_national_number || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Legal Form:</span>
                                                        <span className="text-sm text-gray-900">{businessData.legal_form || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR Status:</span>
                                                        <span className="text-sm text-gray-900">{businessData.registration_status || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">CR Issue Date:</span>
                                                        <span className="text-sm text-gray-900">{formatDate(businessData.issue_date_gregorian)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">City:</span>
                                                        <span className="text-sm text-gray-900">{businessData.city_of_operation || businessData.address || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Business Activities */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Business Activities
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Sector:</span>
                                                        <span className="text-sm text-gray-900">{businessData.sector || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Activities:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {Array.isArray(businessData.activities) 
                                                                ? businessData.activities.slice(0, 3).join(', ') 
                                                                : businessData.activities || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">E-commerce:</span>
                                                        <span className="text-sm text-gray-900">{businessData.has_ecommerce ? 'Yes' : 'No'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    Contact Information
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Contact Person:</span>
                                                        <span className="text-sm text-gray-900">{maskContactInfo('name', businessData.contact_person)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Phone:</span>
                                                        <span className="text-sm text-gray-900">{maskContactInfo('phone', businessData.contact_person_number)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Email:</span>
                                                        <span className="text-sm text-gray-900">{maskContactInfo('email', businessData.business_contact_email)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* POS & Financial Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    POS & Financial Details
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">POS Provider:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.pos_provider_name || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">POS Age (months):</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.pos_age_duration_months || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Monthly POS Sales:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {formatMoney(businessData.avg_monthly_pos_sales)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Requested Amount:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {formatMoney(businessData.requested_financing_amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Repayment Period:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.preferred_repayment_period_months ? 
                                                                `${businessData.preferred_repayment_period_months} months` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">City of Operation:</span>
                                                        <span className="text-sm text-gray-900">
                                                            {businessData.city_of_operation || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Has E-commerce:</span>
                                                        <span className="text-sm text-gray-900">{businessData.has_ecommerce ? 'Yes' : 'No'}</span>
                                                    </div>
                                                    {businessData.store_url && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-gray-700">Store URL:</span>
                                                            <span className="text-sm text-gray-900">
                                                                <a href={businessData.store_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                                                    {businessData.store_url}
                                                                </a>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Information */}
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                Application Details
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Application ID:</span>
                                                    <span className="text-sm text-gray-900">{businessData.application_id || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Submitted At:</span>
                                                    <span className="text-sm text-gray-900">
                                                        {businessData.submitted_at ? new Date(businessData.submitted_at).toLocaleString() : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                                    <span className="text-sm text-gray-900">{businessData.status || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Number of POS Devices:</span>
                                                    <span className="text-sm text-gray-900">{businessData.number_of_pos_devices || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Own POS System:</span>
                                                    <span className="text-sm text-gray-900">{businessData.own_pos_system ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                        </div>



                                        {/* Application Comments */}
                                        {(businessData.notes || businessData.application_notes || businessData.comments) && (
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    Application Notes & Comments
                                                </h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                                        {businessData.notes || businessData.application_notes || businessData.comments || 'No notes or comments available'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

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
                                                    {businessData.offers.map((offer, index) => (
                                                        <div key={offer.offer_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="text-sm font-semibold text-gray-900">
                                                                    Offer #{offer.offer_id} by {offer.bank_name || 'Unknown Bank'}
                                                                </h5>
                                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    offer.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {offer.status}
                                                                </span>
                                                            </div>
                                                            {offer.offer_comment && (
                                                                <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Comment:</strong> {offer.offer_comment}
                                                                </p>
                                                            )}
                                                            {offer.offer_terms && (
                                                                <p className="text-sm text-gray-700 mb-2">
                                                                    <strong>Terms:</strong> {offer.offer_terms}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500">
                                                                Submitted: {new Date(offer.submitted_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
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
                                            className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
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
