'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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
    'Less than 50,000 SAR',
    '50,000 - 200,000 SAR',
    '200,000 - 500,000 SAR',
    '500,000 - 1,000,000 SAR',
    'More than 1,000,000 SAR',
]

export default function NewApplicationModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        cr_national_number: '',
        business_name: '',
        city_of_operation: '',
        sector: '',
        contact_person: '',
        contact_person_number: '',
        email: '',
        financing_type: '',
        amount: '',
        notes: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                cr_national_number: '',
                business_name: '',
                city_of_operation: '',
                sector: '',
                contact_person: '',
                contact_person_number: '',
                email: '',
                financing_type: '',
                amount: '',
                notes: '',
            })
            setError('')
        }
    }, [isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.cr_national_number || !formData.contact_person || !formData.contact_person_number || !formData.financing_type) {
            setError('CR number, contact person, phone, and financing type are required.')
            return
        }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/applications/public-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cr_national_number: formData.cr_national_number,
                    business_name: formData.business_name,
                    city_of_operation: formData.city_of_operation,
                    sector: formData.sector,
                    contact_person: formData.contact_person,
                    contact_person_number: formData.contact_person_number,
                    email: formData.email,
                    financing_type: formData.financing_type,
                    notes: formData.notes,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Submission failed')
            onSuccess(data)
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
    const labelClass = "block text-sm font-medium text-gray-700 mb-1"

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">New Application</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Business Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>CR National Number *</label>
                            <input name="cr_national_number" value={formData.cr_national_number} onChange={handleChange} className={inputClass} placeholder="7XXXXXXXXX" dir="ltr" />
                        </div>
                        <div>
                            <label className={labelClass}>Business Name</label>
                            <input name="business_name" value={formData.business_name} onChange={handleChange} className={inputClass} placeholder="Trade name" />
                        </div>
                        <div>
                            <label className={labelClass}>City of Operation</label>
                            <input name="city_of_operation" value={formData.city_of_operation} onChange={handleChange} className={inputClass} placeholder="Riyadh, Jeddah..." />
                        </div>
                        <div>
                            <label className={labelClass}>Sector</label>
                            <input name="sector" value={formData.sector} onChange={handleChange} className={inputClass} placeholder="e.g. Retail" />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Contact Info */}
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

                    <hr className="border-gray-200" />

                    {/* Financing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {loading ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Submitting...</>
                            ) : (
                                <><CheckIcon className="h-4 w-4 mr-2" />Create Application</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
