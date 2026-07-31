'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BuildingOfficeIcon, DocumentTextIcon, MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    formatFinancingType, formatAmountRange, formatAgeRange,
    formatRevenueRange, formatCity, formatSector, formatHasPos,
} from '@/lib/apply-options'

export default function BusinessInfoModal({ isOpen, onClose, businessData, onSubmitOffer }) {
    const { t, currentLanguage } = useLanguage()
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!businessData) return null

    const ns = (val) => (val === null || val === undefined || val === '') ? t('leads.notSpecified') : val

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
        if (!amount) return t('leads.notSpecified')
        const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.]/g, '')) : amount
        if (isNaN(num)) return t('leads.notSpecified')
        return `SAR ${num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`
    }

    const formatDate = (dateString) => {
        if (!dateString) return t('leads.notSpecified')
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return t('leads.notSpecified')
        }
    }

    // Contact details are visible to all bank/partner users without an offer
    // (client requirement — Platform Enhancements §3). No masking.
    const maskContactInfo = (type, value) => {
        if (!value) return t('leads.notSpecified')
        return value
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
                    <div className="fixed inset-0 bg-[hsl(var(--foreground)/0.6)] transition-opacity" />
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
                                        className="rounded-md bg-white text-gray-400 hover:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    {t('business.businessInformation')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                    {(businessData.company_name || businessData.trade_name) && (
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.businessName')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))] text-right max-w-[60%] break-words">{businessData.company_name || businessData.trade_name}</span>
                                                        </div>
                                                    )}
                                                    {(businessData.city || businessData.city_of_operation) && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('common.city')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatCity(businessData.city_code, currentLanguage, businessData.city_of_operation || businessData.city)}</span>
                                                        </div>
                                                    )}
                                                    {businessData.sector && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.sector')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatSector(businessData.sector_code, currentLanguage, businessData.sector)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Financing Details */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    {t('leads.financingDetails')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                    {businessData.financing_type && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.financingType')}:</span>
                                                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                                                {formatFinancingType(businessData.financing_type, currentLanguage)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {(businessData.amount_range_code || businessData.approximate_financing_amount) && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.approximateAmountNeeded')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatAmountRange(businessData.amount_range_code, currentLanguage, businessData.approximate_financing_amount)}</span>
                                                        </div>
                                                    )}
                                                    {(businessData.annual_revenue_code || businessData.is_pre_revenue) && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.annualRevenue')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatRevenueRange(businessData.annual_revenue_code, currentLanguage, { isPreRevenue: businessData.is_pre_revenue === true })}</span>
                                                        </div>
                                                    )}
                                                    {businessData.business_age_range_code && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.businessAge')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatAgeRange(businessData.business_age_range_code, currentLanguage)}</span>
                                                        </div>
                                                    )}
                                                    {typeof businessData.own_pos_system === 'boolean' && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.ownPosSystem')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{formatHasPos(businessData.own_pos_system, currentLanguage)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact Information */}
                                            <div className="space-y-4">
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    {t('business.contactInformation')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                    {businessData.contact_person && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.contactPerson')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{maskContactInfo('name', businessData.contact_person)}</span>
                                                        </div>
                                                    )}
                                                    {businessData.contact_person_number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('application.mobileNumber')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{maskContactInfo('phone', businessData.contact_person_number)}</span>
                                                        </div>
                                                    )}
                                                    {businessData.business_contact_email && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.email')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{maskContactInfo('email', businessData.business_contact_email)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wathiq / Business Registry Data */}
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                {t('leads.businessRegistryWathiq')}
                                            </h4>
                                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.crNumber')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.cr_number)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.crNationalNumberWathiq')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.cr_national_number)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.legalForm')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.legal_form)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.registrationStatus')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.registration_status)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.issueDate')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.issue_date_gregorian)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.confirmationDate')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.confirmation_date_gregorian)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.cityHQ')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.hq_city)}</span>
                                                    </div>
                                                    {businessData.headquarter_district_name && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.district')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{businessData.headquarter_district_name}</span>
                                                        </div>
                                                    )}
                                                    {businessData.headquarter_street_name && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.street')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{businessData.headquarter_street_name}</span>
                                                        </div>
                                                    )}
                                                    {businessData.headquarter_building_number && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.buildingNo')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))]">{businessData.headquarter_building_number}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.crCapital')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{businessData.cr_capital ? formatMoney(businessData.cr_capital) : t('leads.notSpecified')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('business.cashCapital')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{businessData.cash_capital ? formatMoney(businessData.cash_capital) : t('leads.notSpecified')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.managementStructure')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">{ns(businessData.management_structure)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.hasEcommerce')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">
                                                            {businessData.has_ecommerce === null || businessData.has_ecommerce === undefined
                                                                ? t('leads.notSpecified')
                                                                : businessData.has_ecommerce ? t('common.yes') : t('common.no')}
                                                        </span>
                                                    </div>
                                                    {businessData.has_ecommerce && businessData.store_url && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.storeUrl')}:</span>
                                                            <span className="text-sm text-[hsl(var(--foreground))] break-all">{businessData.store_url}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.verified')}:</span>
                                                        <span className="text-sm text-[hsl(var(--foreground))]">
                                                            {businessData.is_verified === null || businessData.is_verified === undefined
                                                                ? t('leads.notSpecified')
                                                                : businessData.is_verified ? t('common.yes') : t('common.no')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Activities — only shown for purchased leads */}
                                                {Array.isArray(businessData.activities) && businessData.activities.length > 0 && (
                                                    <div className="pt-3 border-t border-blue-200">
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))] block mb-1">{t('business.activities')}:</span>
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
                                                        <span className="text-sm font-medium text-[hsl(var(--ink-soft))] block mb-2">{t('leads.management')}:</span>
                                                        <div className="space-y-1">
                                                            {businessData.management_managers.map((m, i) => {
                                                                const manager = typeof m === 'string' ? { name: m } : m
                                                                return (
                                                                    <div key={i} className="text-sm text-[hsl(var(--foreground))]">
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
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                    {t('leads.purposeOfFinancing')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4">
                                                    <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">{businessData.notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Information */}
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                <ClockIcon className="h-5 w-5 text-indigo-600 mr-2" />
                                                {t('application.details')}
                                            </h4>
                                            <div className="bg-[hsl(var(--secondary))] rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.applicationId')}:</span>
                                                    <span className="text-sm text-[hsl(var(--foreground))]">{businessData.application_id || t('leads.notSpecified')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.submittedAt')}:</span>
                                                    <span className="text-sm text-[hsl(var(--foreground))]">
                                                        {businessData.submitted_at ? new Date(businessData.submitted_at).toLocaleString() : t('leads.notSpecified')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-[hsl(var(--ink-soft))]">{t('leads.status')}:</span>
                                                    <span className="text-sm text-[hsl(var(--foreground))]">{businessData.status || t('leads.notSpecified')}</span>
                                                </div>
                                            </div>
                                        </div>




                                        {/* Uploaded Files */}
                                        {businessData.uploaded_filename && (
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {t('application.uploadedDocuments')}
                                                </h4>
                                                <div className="bg-[hsl(var(--secondary))] rounded-lg p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                                                📎 {businessData.uploaded_filename}
                                                            </p>
                                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                {t('leads.uploadedWithApplication')} • {businessData.uploaded_mimetype || t('leads.unknownType')}
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
                                                            {t('common.download')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Offers Information */}
                                        {businessData.offers && businessData.offers.length > 0 && (
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-md font-medium text-[hsl(var(--foreground))] flex items-center">
                                                    <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    {t('offers.offers')} ({businessData.offers.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {businessData.offers && Array.isArray(businessData.offers) ? businessData.offers.map((offer, index) => {
                                                        try {
                                                            return (
                                                                <div key={offer.offer_id || index} className="bg-[hsl(var(--secondary))] rounded-lg p-4 border border-[hsl(var(--border))]">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                                                            {t('leads.offer')} #{offer.offer_id || t('leads.notSpecified')} {t('leads.by')} {offer.bank_name || t('leads.unknownBank')}
                                                                        </h5>
                                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                            offer.status === 'live_auction' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                            {offer.status || t('leads.notSpecified')}
                                                                        </span>
                                                                    </div>
                                                                    {offer.offer_comment && (
                                                                        <p className="text-sm text-[hsl(var(--ink-soft))] mb-2">
                                                                            <strong>{t('leads.comment')}:</strong> {offer.offer_comment || t('leads.notSpecified')}
                                                                        </p>
                                                                    )}
                                                                    {offer.offer_terms && (
                                                                        <p className="text-sm text-[hsl(var(--ink-soft))] mb-2">
                                                                            <strong>{t('leads.terms')}:</strong> {offer.offer_terms || t('leads.notSpecified')}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                                        {t('offers.submitted')}: {offer.submitted_at ? new Date(offer.submitted_at).toLocaleString() : t('leads.notSpecified')}
                                                                    </p>
                                                                </div>
                                                            );
                                                        } catch (error) {
                                                            console.error('Error rendering offer:', error);
                                                            return (
                                                                <div key={index} className="bg-red-50 rounded-lg p-4 border border-red-200">
                                                                    <p className="text-sm text-red-600">{t('leads.errorLoadingOffer')}</p>
                                                                </div>
                                                            );
                                                        }
                                                    }) : <span className="text-[hsl(var(--muted-foreground))] italic">{t('offers.noOffersAvailable')}</span>}
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
                                        {t('common.close')}
                                    </button>
                                    {onSubmitOffer && (
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                            onClick={handleSubmitOffer}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? t('leads.submitting') : t('leads.submitOffer')}
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
