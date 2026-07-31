'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { collectErrors, checkRequired, checkCRNationalNumber, checkSaudiMobile, checkEmail } from '@/lib/validators'
import {
    FINANCING_TYPES, FINANCING_ORDER,
    AMOUNT_RANGES, AMOUNT_ORDER,
    AGE_RANGES, AGE_ORDER,
    REVENUE_RANGES, REVENUE_ORDER,
    SECTORS, CITIES,
    optionsFor,
} from '@/lib/apply-options'

// Option lists come from the shared code vocabulary — admin-created applications
// must be indistinguishable from public submissions in the database.
const FINANCING_OPTIONS = optionsFor(FINANCING_TYPES, FINANCING_ORDER, 'en')
const AMOUNT_OPTIONS = optionsFor(AMOUNT_RANGES, AMOUNT_ORDER, 'en')
const AGE_OPTIONS = optionsFor(AGE_RANGES, AGE_ORDER, 'en')
const REVENUE_OPTIONS = optionsFor(REVENUE_RANGES, REVENUE_ORDER, 'en')
const CITY_OPTIONS = CITIES.map((c) => ({ value: c.code, label: c.en }))
const SECTOR_OPTIONS = SECTORS.map((s) => ({ value: s.code, label: s.en }))

const ns = (val) => val || 'Not specified'

// Wathiq returns a free-text city name; map it onto the canonical code when we
// can, otherwise leave the field empty for the admin to pick.
const cityCodeFromName = (name) => {
    if (!name) return ''
    const needle = String(name).trim().toLowerCase()
    const match = CITIES.find((c) => c.ar === String(name).trim() || c.en.toLowerCase() === needle)
    return match ? match.code : ''
}

export default function NewApplicationModal({ isOpen, onClose, onSuccess }) {
    const [crInput, setCrInput] = useState('')
    const [lookupState, setLookupState] = useState('idle') // idle | loading | found | not_found | has_application | manual
    const [wathiqPreview, setWathiqPreview] = useState(null)
    const [lookupError, setLookupError] = useState('')
    const emptyForm = {
        contact_person: '',
        contact_person_number: '',
        city_code: '',
        sector_code: '',
        email: '',
        financing_type: '',
        amount_range_code: '',
        business_age_range_code: '',
        annual_revenue_code: '',
        is_pre_revenue: false,
        has_pos: null,
        notes: '',
        consent: false,
    }
    const [formData, setFormData] = useState(emptyForm)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setCrInput('')
            setLookupState('idle')
            setWathiqPreview(null)
            setLookupError('')
            setFormData(emptyForm)
            setSubmitError('')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const handleLookup = async () => {
        const crError = checkCRNationalNumber(crInput.trim())
        if (crError) {
            setLookupError(crError)
            return
        }
        setLookupState('loading')
        setLookupError('')
        setWathiqPreview(null)
        try {
            const res = await fetch(`/api/admin/applications/validate-cr-for-creation?cr_number=${encodeURIComponent(crInput.trim())}`, {
                credentials: 'include',
            })
            const data = await res.json()

            if (data.success && data.data?.exists && !data.data?.hasApplication) {
                const bu = data.data.businessUser
                setWathiqPreview(bu)
                setFormData(prev => ({
                    ...prev,
                    contact_person: bu.contact_person || '',
                    contact_person_number: bu.contact_person_number || '',
                    email: bu.email || '',
                    city_code: cityCodeFromName(bu.city),
                }))
                setLookupState('found')
            } else if (data.data?.hasApplication) {
                setLookupState('has_application')
                setLookupError('This business already has an active application.')
            } else {
                setLookupState('not_found')
                setLookupError('No registered business found with this CR number. You can fill in the details manually.')
            }
        } catch {
            setLookupState('not_found')
            setLookupError('Lookup failed. You can fill in the details manually.')
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { valid, firstError } = collectErrors({
            contact_person: () => checkRequired(formData.contact_person, 'Contact person'),
            contact_person_number: () => checkSaudiMobile(formData.contact_person_number, { label: 'Phone' }),
            city_code: () => checkRequired(formData.city_code, 'City'),
            sector_code: () => checkRequired(formData.sector_code, 'Sector'),
            financing_type: () => checkRequired(formData.financing_type, 'Financing type'),
            amount_range_code: () => checkRequired(formData.amount_range_code, 'Requested amount'),
            business_age_range_code: () => checkRequired(formData.business_age_range_code, 'Business age'),
            annual_revenue_code: () =>
                formData.is_pre_revenue ? null : checkRequired(formData.annual_revenue_code, 'Annual revenue'),
            has_pos: () => (typeof formData.has_pos === 'boolean' ? null : 'Answer the POS sales question'),
            consent: () => (formData.consent ? null : 'Confirm the applicant consented to sharing their data'),
            email: () => checkEmail(formData.email, { required: false }),
        })
        if (!valid) {
            setSubmitError(firstError)
            return
        }
        setSubmitLoading(true)
        setSubmitError('')
        try {
            const res = await fetch('/api/applications/public-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cr_national_number: crInput.trim(),
                    business_name: wathiqPreview?.trade_name || '',
                    city_code: formData.city_code,
                    sector_code: formData.sector_code,
                    contact_person: formData.contact_person,
                    contact_person_number: formData.contact_person_number,
                    email: formData.email,
                    financing_type: formData.financing_type,
                    amount_range_code: formData.amount_range_code,
                    business_age_range_code: formData.business_age_range_code,
                    annual_revenue_code: formData.is_pre_revenue ? null : formData.annual_revenue_code,
                    is_pre_revenue: formData.is_pre_revenue,
                    has_pos: formData.has_pos,
                    notes: formData.notes,
                    consent: formData.consent,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                if (res.status === 409) {
                    throw new Error(`CR number ${crInput} already has an active application.`)
                }
                throw new Error(data.error || 'Submission failed')
            }
            onSuccess(data)
            onClose()
        } catch (err) {
            setSubmitError(err.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    if (!isOpen) return null

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
    const labelClass = "block text-sm font-medium text-gray-700 mb-1"
    const showForm = lookupState === 'found' || lookupState === 'manual' || lookupState === 'not_found'

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">New Application</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Phase 1: CR Lookup */}
                <div className="mb-6">
                    <label className={labelClass}>CR National Number *</label>
                    <div className="flex gap-2">
                        <input
                            value={crInput}
                            onChange={(e) => { setCrInput(e.target.value); setLookupError('') }}
                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                            className={inputClass}
                            placeholder="7XXXXXXXXX"
                            dir="ltr"
                            disabled={lookupState === 'found'}
                        />
                        {lookupState !== 'found' && (
                            <button
                                type="button"
                                onClick={handleLookup}
                                disabled={lookupState === 'loading'}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                            >
                                {lookupState === 'loading' ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                                ) : (
                                    <><MagnifyingGlassIcon className="h-4 w-4 mr-1" />Look Up</>
                                )}
                            </button>
                        )}
                        {lookupState === 'found' && (
                            <button
                                type="button"
                                onClick={() => { setLookupState('idle'); setWathiqPreview(null); setCrInput('') }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
                            >
                                Change
                            </button>
                        )}
                    </div>
                    {lookupError && (
                        <p className="mt-1 text-sm text-red-600">{lookupError}</p>
                    )}
                    {lookupState === 'not_found' && (
                        <button
                            type="button"
                            onClick={() => setLookupState('manual')}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            Fill in details manually →
                        </button>
                    )}
                </div>

                {/* Wathiq Preview Card */}
                {lookupState === 'found' && wathiqPreview && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Business Registry Data (from Wathiq)</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><span className="font-medium text-gray-600">Trade Name: </span><span className="text-gray-900">{ns(wathiqPreview.trade_name)}</span></div>
                            <div><span className="font-medium text-gray-600">CR Number: </span><span className="text-gray-900 font-mono">{ns(wathiqPreview.cr_number)}</span></div>
                            <div><span className="font-medium text-gray-600">Legal Form: </span><span className="text-gray-900">{ns(wathiqPreview.legal_form)}</span></div>
                            <div><span className="font-medium text-gray-600">Status: </span><span className="text-gray-900">{ns(wathiqPreview.registration_status)}</span></div>
                            <div><span className="font-medium text-gray-600">Issue Date: </span><span className="text-gray-900">{ns(wathiqPreview.issue_date)}</span></div>
                            <div><span className="font-medium text-gray-600">HQ City: </span><span className="text-gray-900">{ns(wathiqPreview.city)}</span></div>
                            <div><span className="font-medium text-gray-600">CR Capital: </span><span className="text-gray-900">{wathiqPreview.cr_capital ? `SAR ${Number(wathiqPreview.cr_capital).toLocaleString()}` : 'Not specified'}</span></div>
                            <div><span className="font-medium text-gray-600">Cash Capital: </span><span className="text-gray-900">{wathiqPreview.cash_capital ? `SAR ${Number(wathiqPreview.cash_capital).toLocaleString()}` : 'Not specified'}</span></div>
                            <div><span className="font-medium text-gray-600">Management: </span><span className="text-gray-900">{ns(wathiqPreview.management_structure)}</span></div>
                            <div><span className="font-medium text-gray-600">Has eCommerce: </span><span className="text-gray-900">{wathiqPreview.has_ecommerce === null || wathiqPreview.has_ecommerce === undefined ? 'Not specified' : wathiqPreview.has_ecommerce ? 'Yes' : 'No'}</span></div>
                        </div>
                    </div>
                )}

                {/* Phase 2: Application Form */}
                {showForm && (
                    <>
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 shrink-0" />
                                <p className="text-sm text-red-600">{submitError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Contact Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contact</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Contact Person *</label>
                                        <input name="contact_person" value={formData.contact_person} onChange={handleChange} className={inputClass} placeholder="Full name" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone *</label>
                                        <input name="contact_person_number" value={formData.contact_person_number} onChange={handleChange} className={inputClass} placeholder="05XXXXXXXX" dir="ltr" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Email</label>
                                        <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="business@example.com" dir="ltr" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Application Info */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Application</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>City *</label>
                                        <select name="city_code" value={formData.city_code} onChange={handleChange} className={inputClass}>
                                            <option value="">Select city</option>
                                            {CITY_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sector *</label>
                                        <select name="sector_code" value={formData.sector_code} onChange={handleChange} className={inputClass}>
                                            <option value="">Select sector</option>
                                            {SECTOR_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Annual Revenue {formData.is_pre_revenue ? '' : '*'}</label>
                                        <select
                                            name="annual_revenue_code"
                                            value={formData.annual_revenue_code}
                                            onChange={handleChange}
                                            disabled={formData.is_pre_revenue}
                                            className={`${inputClass} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                                        >
                                            <option value="">Select annual revenue</option>
                                            {REVENUE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_pre_revenue}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    is_pre_revenue: e.target.checked,
                                                    annual_revenue_code: e.target.checked ? '' : prev.annual_revenue_code,
                                                }))}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            No sales yet / not operating
                                        </label>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Financing Type *</label>
                                        <select name="financing_type" value={formData.financing_type} onChange={handleChange} className={inputClass}>
                                            <option value="">Select type</option>
                                            {FINANCING_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Requested Amount *</label>
                                        <select name="amount_range_code" value={formData.amount_range_code} onChange={handleChange} className={inputClass}>
                                            <option value="">Select range</option>
                                            {AMOUNT_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Business Age *</label>
                                        <select name="business_age_range_code" value={formData.business_age_range_code} onChange={handleChange} className={inputClass}>
                                            <option value="">Select operating age</option>
                                            {AGE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sales via POS devices? *</label>
                                        <div className="flex gap-2">
                                            {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(opt => (
                                                <button
                                                    key={opt.l}
                                                    type="button"
                                                    aria-pressed={formData.has_pos === opt.v}
                                                    onClick={() => setFormData(prev => ({ ...prev, has_pos: opt.v }))}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border ${
                                                        formData.has_pos === opt.v
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClass} placeholder="Additional notes..." />
                                    </div>
                                    {/* The endpoint requires recorded consent. An admin creating an
                                        application on the applicant's behalf must affirm it explicitly
                                        rather than have the client send `true` silently. */}
                                    <div className="sm:col-span-2">
                                        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer rounded-md border border-gray-200 bg-gray-50 p-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.consent}
                                                onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                            />
                                            The applicant has consented to sharing their application data with participating financing providers.
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitLoading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                                    {submitLoading ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Submitting...</>
                                    ) : (
                                        <><CheckIcon className="h-4 w-4 mr-2" />Create Application</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {/* Idle state hint */}
                {lookupState === 'idle' && (
                    <p className="text-sm text-gray-500 text-center py-4">Enter a CR national number and click Look Up to begin.</p>
                )}
            </div>
        </div>
    )
}
