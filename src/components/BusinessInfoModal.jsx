'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BuildingOfficeIcon, DocumentTextIcon, MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    formatFinancingType, formatAmountRange, formatAgeRange,
    formatRevenueRange, formatCity, formatSector, formatHasPos,
} from '@/lib/apply-options'

// Compact presentation primitives. The previous layout gave every group its own
// padded, tinted card inside a 2-column grid — with three groups in two columns
// that left a large hole in the first column, and the generous padding made a
// dense record of ~30 fields scroll for several screens. These render the same
// data as tight label/value rows on hairline dividers.

function Field({ label, value, children }) {
    const content = children ?? value
    if (content === null || content === undefined || content === '') return null
    return (
        <div className="flex items-start justify-between gap-6 border-b border-[hsl(var(--border))] py-1.5 last:border-b-0">
            <dt className="shrink-0 text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</dt>
            <dd className="min-w-0 break-words text-right text-sm text-[hsl(var(--foreground))]">{content}</dd>
        </div>
    )
}

function Group({ icon: Icon, title, children }) {
    return (
        <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                <Icon className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                {title}
            </div>
            <dl>{children}</dl>
        </div>
    )
}

function Section({ icon: Icon, title, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
            <h4 className="flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                <Icon className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                {title}
            </h4>
            <div className="px-4 py-3">{children}</div>
        </section>
    )
}

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

    // Headless UI portals this Dialog to document.body, so it escapes the
    // dir="ltr" wrapper its surface sets and would otherwise inherit
    // <html dir="rtl">. The direction must be pinned on the Dialog itself.
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog dir="ltr" as="div" className="relative z-50" onClose={onClose}>
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
                                
                                {/* Two sections, as the bank actually reads this record:
                                    what the applicant told us, then what the registry says. */}
                                <div className="w-full">
                                    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 pr-8 text-xs text-[hsl(var(--muted-foreground))]">
                                        <span className="font-medium text-[hsl(var(--foreground))]">
                                            #{businessData.application_id || t('leads.notSpecified')}
                                        </span>
                                        {businessData.submitted_at && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>{new Date(businessData.submitted_at).toLocaleString()}</span>
                                            </>
                                        )}
                                        {businessData.status && (
                                            <>
                                                <span aria-hidden="true">·</span>
                                                <span>{businessData.status}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {/* ── 1. Submitted by the applicant in the onboarding form ── */}
                                        <Section icon={BuildingOfficeIcon} title={t('business.businessInformation')}>
                                            <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
                                                <Group icon={BuildingOfficeIcon} title={t('business.businessInformation')}>
                                                    <Field label={t('leads.businessName')} value={businessData.company_name || businessData.trade_name} />
                                                    <Field
                                                        label={t('common.city')}
                                                        value={(businessData.city || businessData.city_of_operation)
                                                            ? formatCity(businessData.city_code, currentLanguage, businessData.city_of_operation || businessData.city)
                                                            : null}
                                                    />
                                                    <Field
                                                        label={t('business.sector')}
                                                        value={businessData.sector ? formatSector(businessData.sector_code, currentLanguage, businessData.sector) : null}
                                                    />
                                                </Group>

                                                <Group icon={CurrencyDollarIcon} title={t('leads.financingDetails')}>
                                                    {businessData.financing_type && (
                                                        <Field label={t('leads.financingType')}>
                                                            <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                                                {formatFinancingType(businessData.financing_type, currentLanguage)}
                                                            </span>
                                                        </Field>
                                                    )}
                                                    <Field
                                                        label={t('leads.approximateAmountNeeded')}
                                                        value={(businessData.amount_range_code || businessData.approximate_financing_amount)
                                                            ? formatAmountRange(businessData.amount_range_code, currentLanguage, businessData.approximate_financing_amount)
                                                            : null}
                                                    />
                                                    <Field
                                                        label={t('leads.annualRevenue')}
                                                        value={(businessData.annual_revenue_code || businessData.is_pre_revenue)
                                                            ? formatRevenueRange(businessData.annual_revenue_code, currentLanguage, { isPreRevenue: businessData.is_pre_revenue === true })
                                                            : null}
                                                    />
                                                    <Field
                                                        label={t('leads.businessAge')}
                                                        value={businessData.business_age_range_code ? formatAgeRange(businessData.business_age_range_code, currentLanguage) : null}
                                                    />
                                                    <Field
                                                        label={t('leads.ownPosSystem')}
                                                        value={typeof businessData.own_pos_system === 'boolean' ? formatHasPos(businessData.own_pos_system, currentLanguage) : null}
                                                    />
                                                </Group>

                                                <Group icon={UserIcon} title={t('business.contactInformation')}>
                                                    <Field label={t('business.contactPerson')} value={businessData.contact_person ? maskContactInfo('name', businessData.contact_person) : null} />
                                                    <Field label={t('application.mobileNumber')} value={businessData.contact_person_number ? maskContactInfo('phone', businessData.contact_person_number) : null} />
                                                    <Field label={t('business.email')} value={businessData.business_contact_email ? maskContactInfo('email', businessData.business_contact_email) : null} />
                                                </Group>

                                                {businessData.notes && (
                                                    <Group icon={DocumentTextIcon} title={t('leads.purposeOfFinancing')}>
                                                        <p className="whitespace-pre-wrap py-1.5 text-sm text-[hsl(var(--foreground))]">{businessData.notes}</p>
                                                    </Group>
                                                )}
                                            </div>
                                        </Section>

                                        {/* ── 2. Business registry (Wathiq) ── */}
                                        <Section icon={DocumentTextIcon} title={t('leads.businessRegistryWathiq')}>
                                            <dl className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                                                <Field label={t('leads.crNumber')} value={ns(businessData.cr_number)} />
                                                <Field label={t('leads.crNationalNumberWathiq')} value={ns(businessData.cr_national_number)} />
                                                <Field label={t('leads.legalForm')} value={ns(businessData.legal_form)} />
                                                <Field label={t('leads.registrationStatus')} value={ns(businessData.registration_status)} />
                                                <Field label={t('leads.issueDate')} value={ns(businessData.issue_date_gregorian)} />
                                                <Field label={t('leads.confirmationDate')} value={ns(businessData.confirmation_date_gregorian)} />
                                                <Field label={t('leads.cityHQ')} value={ns(businessData.hq_city)} />
                                                <Field label={t('leads.district')} value={businessData.headquarter_district_name} />
                                                <Field label={t('leads.street')} value={businessData.headquarter_street_name} />
                                                <Field label={t('leads.buildingNo')} value={businessData.headquarter_building_number} />
                                                <Field label={t('leads.crCapital')} value={businessData.cr_capital ? formatMoney(businessData.cr_capital) : t('leads.notSpecified')} />
                                                <Field label={t('business.cashCapital')} value={businessData.cash_capital ? formatMoney(businessData.cash_capital) : t('leads.notSpecified')} />
                                                <Field label={t('leads.managementStructure')} value={ns(businessData.management_structure)} />
                                                <Field
                                                    label={t('leads.hasEcommerce')}
                                                    value={businessData.has_ecommerce === null || businessData.has_ecommerce === undefined
                                                        ? t('leads.notSpecified')
                                                        : businessData.has_ecommerce ? t('common.yes') : t('common.no')}
                                                />
                                                {businessData.has_ecommerce && businessData.store_url && (
                                                    <Field label={t('leads.storeUrl')} value={businessData.store_url} />
                                                )}
                                                <Field
                                                    label={t('leads.verified')}
                                                    value={businessData.is_verified === null || businessData.is_verified === undefined
                                                        ? t('leads.notSpecified')
                                                        : businessData.is_verified ? t('common.yes') : t('common.no')}
                                                />
                                            </dl>

                                            {/* Activities and management are only populated for purchased leads. */}
                                            {Array.isArray(businessData.activities) && businessData.activities.length > 0 && (
                                                <div className="mt-3 border-t border-[hsl(var(--border))] pt-3">
                                                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                                        {t('business.activities')}
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {businessData.activities.map((a, i) => (
                                                            <span key={i} className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">{a}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {Array.isArray(businessData.management_managers) && businessData.management_managers.length > 0 && (
                                                <div className="mt-3 border-t border-[hsl(var(--border))] pt-3">
                                                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                                        {t('leads.management')}
                                                    </span>
                                                    <div className="space-y-0.5">
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
                                        </Section>

                                        {/* Kept below the two sections: these are actions, not record fields.
                                            Removing them would take away the applicant's document and the
                                            offer history the bank needs. */}
                                        {businessData.uploaded_filename && (
                                            <div className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5">
                                                <DocumentTextIcon className="h-5 w-5 shrink-0 text-indigo-500" aria-hidden="true" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">{businessData.uploaded_filename}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                        {t('leads.uploadedWithApplication')} • {businessData.uploaded_mimetype || t('leads.unknownType')}
                                                    </p>
                                                </div>
                                                <a
                                                    href={`/api/leads/${businessData.application_id}/document`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
                                                >
                                                    {t('common.download')}
                                                </a>
                                            </div>
                                        )}

                                        {Array.isArray(businessData.offers) && businessData.offers.length > 0 && (
                                            <Section icon={ClockIcon} title={`${t('offers.offers')} (${businessData.offers.length})`}>
                                                <div className="space-y-2">
                                                    {businessData.offers.map((offer, index) => (
                                                        <div key={offer.offer_id || index} className="rounded-lg border border-[hsl(var(--border))] px-3 py-2">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <h5 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                                                                    {t('leads.offer')} #{offer.offer_id || t('leads.notSpecified')} {t('leads.by')} {offer.bank_name || t('leads.unknownBank')}
                                                                </h5>
                                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    offer.status === 'live_auction' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {offer.status || t('leads.notSpecified')}
                                                                </span>
                                                            </div>
                                                            {offer.offer_comment && (
                                                                <p className="mt-1 text-sm text-[hsl(var(--ink-soft))]">
                                                                    <strong>{t('leads.comment')}:</strong> {offer.offer_comment}
                                                                </p>
                                                            )}
                                                            {offer.offer_terms && (
                                                                <p className="mt-1 text-sm text-[hsl(var(--ink-soft))]">
                                                                    <strong>{t('leads.terms')}:</strong> {offer.offer_terms}
                                                                </p>
                                                            )}
                                                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                                                {t('offers.submitted')}: {offer.submitted_at ? new Date(offer.submitted_at).toLocaleString() : t('leads.notSpecified')}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Section>
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
