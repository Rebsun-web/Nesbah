'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { collectErrors, checkRequired, checkCRNationalNumber, checkSaudiMobile, checkEmail } from '@/lib/validators'

const FINANCING_OPTIONS = [
    { value: 'business', label: 'Business Financing' },
    { value: 'working_capital', label: 'Working Capital' },
    { value: 'expansion', label: 'Expansion Financing' },
    { value: 'equipment', label: 'Equipment Financing' },
    { value: 'project', label: 'Project Financing' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'pos', label: 'POS Financing' },
    { value: 'general', label: 'General / Other' },
]

const AMOUNT_OPTIONS = [
    'Less than 250K SAR',
    '250K – 1M SAR',
    '1M – 5M SAR',
    'More than 5M SAR',
]

const ns = (val) => val || 'Not specified'

export default function NewApplicationModal({ isOpen, onClose, onSuccess }) {
    const [crInput, setCrInput] = useState('')
    const [lookupState, setLookupState] = useState('idle') // idle | loading | found | not_found | has_application | manual
    const [wathiqPreview, setWathiqPreview] = useState(null)
    const [lookupError, setLookupError] = useState('')
    const [formData, setFormData] = useState({
        contact_person: '',
        contact_person_number: '',
        city_of_operation: '',
        sector: '',
        email: '',
        financing_type: '',
        amount: '',
        notes: '',
    })
    const [submitLoading, setSubmitLoading] = useState(false)
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setCrInput('')
            setLookupState('idle')
            setWathiqPreview(null)
            setLookupError('')
            setFormData({ contact_person: '', contact_person_number: '', city_of_operation: '', sector: '', email: '', financing_type: '', amount: '', notes: '' })
            setSubmitError('')
        }
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
                    city_of_operation: bu.city || '',
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
            city_of_operation: () => checkRequired(formData.city_of_operation, 'City of operation'),
            financing_type: () => checkRequired(formData.financing_type, 'Financing type'),
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
                    city_of_operation: formData.city_of_operation,
                    sector: formData.sector,
                    contact_person: formData.contact_person,
                    contact_person_number: formData.contact_person_number,
                    email: formData.email,
                    financing_type: formData.financing_type,
                    approximate_financing_amount: formData.amount || null,
                    notes: formData.notes,
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
                                        <label className={labelClass}>City of Operation *</label>
                                        <input name="city_of_operation" value={formData.city_of_operation} onChange={handleChange} className={inputClass} placeholder="Riyadh, Jeddah..." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sector</label>
                                        <input name="sector" value={formData.sector} onChange={handleChange} className={inputClass} placeholder="e.g. Retail" />
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
                                        <label className={labelClass}>Requested Amount</label>
                                        <select name="amount" value={formData.amount} onChange={handleChange} className={inputClass}>
                                            <option value="">Select range</option>
                                            {AMOUNT_OPTIONS.map(o => (
                                                <option key={o} value={o}>{o}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelClass}>Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClass} placeholder="Additional notes..." />
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
