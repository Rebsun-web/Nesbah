'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function BankOfferForm({ 
    offer = null, 
    banks = [], 
    applications = [], 
    onSubmit, 
    onCancel, 
    isEditing = false 
}) {
    const [formData, setFormData] = useState({
        cr_number: '',
        bank_user_id: '',
        approved_financing_amount: '',
        proposed_repayment_period_months: '',
        interest_rate: '',
        monthly_installment_amount: '',
        grace_period_months: '',
        offer_comment: '',
        offer_terms: '',
        status: 'submitted',
        admin_notes: '',
        uploaded_document: null,
        uploaded_filename: '',
        uploaded_mimetype: ''
    })

    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [bankSearchTerm, setBankSearchTerm] = useState('')
    const [showBankDropdown, setShowBankDropdown] = useState(false)
    const [businessInfo, setBusinessInfo] = useState(null)
    const [validatingCR, setValidatingCR] = useState(false)

    useEffect(() => {
        if (offer) {
            setFormData({
                cr_number: offer.cr_number || '',
                bank_user_id: offer.bank_user_id || '',
                approved_financing_amount: offer.approved_financing_amount || '',
                proposed_repayment_period_months: offer.proposed_repayment_period_months || '',
                interest_rate: offer.interest_rate || '',
                monthly_installment_amount: offer.monthly_installment_amount || '',
                grace_period_months: offer.grace_period_months || '',
                offer_comment: offer.offer_comment || '',
                offer_terms: offer.offer_terms || '',
                status: offer.status || 'submitted',
                admin_notes: offer.admin_notes || '',
                uploaded_document: null,
                uploaded_filename: offer.uploaded_filename || '',
                uploaded_mimetype: offer.uploaded_mimetype || ''
            })
        }
    }, [offer])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showBankDropdown && !event.target.closest('.bank-dropdown-container')) {
                setShowBankDropdown(false)
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showBankDropdown])

    // Filter banks based on search term
    const filteredBanks = banks.filter(bank => {
        const searchTerm = bankSearchTerm.toLowerCase().trim()
        if (!searchTerm) return false
        
        const bankName = (bank.entity_name || '').toLowerCase()
        const bankEmail = (bank.email || '').toLowerCase()
        
        const matches = bankName.includes(searchTerm) || bankEmail.includes(searchTerm)
        
        // Debug logging
        if (bankSearchTerm.trim()) {
            console.log(`🔍 Bank search: "${bankSearchTerm}" -> "${bankName}" (${bankEmail}) - Match: ${matches}`)
        }
        
        return matches
    }).slice(0, 10) // Limit to 10 results for better UX
    
    console.log(`🏦 Available banks: ${banks.length}, Search term: "${bankSearchTerm}", Filtered: ${filteredBanks.length}`)

    const validateForm = () => {
        const newErrors = {}

        if (!formData.cr_number) {
            newErrors.cr_number = 'CR Number is required'
        }
        if (!formData.bank_user_id) {
            newErrors.bank_user_id = 'Bank is required'
        }
        if (!formData.approved_financing_amount) {
            newErrors.approved_financing_amount = 'Approved financing amount is required'
        }
        if (!formData.proposed_repayment_period_months) {
            newErrors.proposed_repayment_period_months = 'Repayment period is required'
        }
        if (!formData.interest_rate) {
            newErrors.interest_rate = 'Interest rate is required'
        }
        if (!formData.monthly_installment_amount) {
            newErrors.monthly_installment_amount = 'Monthly installment amount is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        console.log('🚀 handleSubmit called!')
        e.preventDefault()
        
        console.log('🔍 Validating form...')
        if (!validateForm()) {
            console.log('❌ Form validation failed')
            return
        }
        
        console.log('✅ Form validation passed, proceeding with submission...')
        setSubmitting(true)
        
        try {
            // Create FormData for file upload
            const submitFormData = new FormData()
            
            console.log('📝 Creating FormData with formData:', formData)
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== '') {
                    if (key === 'uploaded_document' && formData[key]) {
                        console.log(`📎 Adding file: ${key} =`, formData[key])
                        submitFormData.append(key, formData[key])
                    } else if (key !== 'uploaded_document') {
                        console.log(`📝 Adding field: ${key} =`, formData[key])
                        submitFormData.append(key, formData[key])
                    }
                }
            })
            
            console.log('📤 Final FormData entries:')
            for (let [key, value] of submitFormData.entries()) {
                console.log(`  ${key}:`, value)
            }
            
            console.log('📞 Calling onSubmit with FormData...')
            console.log('📞 onSubmit function:', typeof onSubmit, onSubmit)
            
            await onSubmit(submitFormData)
            
            console.log('✅ onSubmit completed successfully')
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({
                ...prev,
                uploaded_document: file,
                uploaded_filename: file.name,
                uploaded_mimetype: file.type
            }))
        }
    }

    const removeFile = () => {
        setFormData(prev => ({
            ...prev,
            uploaded_document: null,
            uploaded_filename: '',
            uploaded_mimetype: ''
        }))
    }

    const handleBankSelect = (bank) => {
        console.log('🎯 handleBankSelect called with bank:', bank)
        console.log('🎯 Setting bank_user_id to:', bank.user_id)
        console.log('🎯 Setting bankSearchTerm to:', bank.entity_name)
        
        setFormData(prev => ({ ...prev, bank_user_id: bank.user_id }))
        setBankSearchTerm(bank.entity_name)
        setShowBankDropdown(false)
        
        console.log('🎯 Bank selection completed')
    }

    const validateCRNumber = async () => {
        if (!formData.cr_number) return
        
        setValidatingCR(true)
        try {
            const response = await fetch(`/api/admin/validate-cr?cr_number=${formData.cr_number}`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setBusinessInfo(data.business_info)
                    setErrors(prev => ({ ...prev, cr_number: '' }))
                } else {
                    setBusinessInfo(null)
                    setErrors(prev => ({ ...prev, cr_number: data.error }))
                }
            } else {
                setBusinessInfo(null)
                setErrors(prev => ({ ...prev, cr_number: 'Failed to validate CR Number' }))
            }
        } catch (error) {
            setBusinessInfo(null)
            setErrors(prev => ({ ...prev, cr_number: 'Error validating CR Number' }))
        } finally {
            setValidatingCR(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* CR Number Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    CR Number *
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={formData.cr_number}
                        onChange={(e) => handleInputChange('cr_number', e.target.value)}
                        onBlur={validateCRNumber}
                        placeholder="Enter CR Number (e.g., CR4030000001)"
                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.cr_number ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {validatingCR && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                            Validating...
                        </div>
                    )}
                </div>
                {errors.cr_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.cr_number}</p>
                )}
                
                {/* Business Information Display */}
                {businessInfo && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
                        <h4 className="font-medium text-green-800 mb-2">Business Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                            <div><span className="font-medium">Name:</span> {businessInfo.trade_name}</div>
                            <div><span className="font-medium">City:</span> {businessInfo.city}</div>
                            <div><span className="font-medium">CR Capital:</span> SAR {businessInfo.cr_capital}</div>
                            <div><span className="font-medium">Status:</span> {businessInfo.registration_status}</div>
                            <div><span className="font-medium">Contact:</span> {businessInfo.contact_person}</div>
                            <div><span className="font-medium">Phone:</span> {businessInfo.contact_phone}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bank Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank *
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={bankSearchTerm}
                        onChange={(e) => {
                            setBankSearchTerm(e.target.value)
                            setShowBankDropdown(true)
                        }}
                        onFocus={() => setShowBankDropdown(true)}
                        placeholder="Search bank by name or email..."
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.bank_user_id ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    
                    {/* Bank Dropdown */}
                    {showBankDropdown && filteredBanks.length > 0 && (
                        <div 
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto bank-dropdown-container"
                        >
                            {filteredBanks.map((bank) => (
                                <div
                                    key={bank.user_id}
                                    onClick={() => {
                                        console.log('🖱️ Bank option clicked:', bank)
                                        handleBankSelect(bank)
                                    }}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                    style={{ border: '1px solid purple' }} // Temporary blue border for debugging
                                >
                                    <div className="font-medium text-gray-900">{bank.entity_name}</div>
                                    <div className="text-sm text-gray-600">{bank.email}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {errors.bank_user_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.bank_user_id}</p>
                )}
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approved Financing Amount (SAR) *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.approved_financing_amount}
                        onChange={(e) => handleInputChange('approved_financing_amount', e.target.value)}
                        placeholder="500,000.00"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.approved_financing_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.approved_financing_amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.approved_financing_amount}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposed Repayment Period (months) *
                    </label>
                    <input
                        type="number"
                        value={formData.proposed_repayment_period_months}
                        onChange={(e) => handleInputChange('proposed_repayment_period_months', e.target.value)}
                        placeholder="12"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.proposed_repayment_period_months ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.proposed_repayment_period_months && (
                        <p className="mt-1 text-sm text-red-600">{errors.proposed_repayment_period_months}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Rate (%) *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.interest_rate}
                        onChange={(e) => handleInputChange('interest_rate', e.target.value)}
                        placeholder="5.5"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.interest_rate ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.interest_rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.interest_rate}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Installment Amount (SAR) *
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.monthly_installment_amount}
                        onChange={(e) => handleInputChange('monthly_installment_amount', e.target.value)}
                        placeholder="45,000.00"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.monthly_installment_amount ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.monthly_installment_amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.monthly_installment_amount}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grace Period (months)
                    </label>
                    <input
                        type="number"
                        value={formData.grace_period_months}
                        onChange={(e) => handleInputChange('grace_period_months', e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supporting Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.uploaded_document ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <DocumentArrowUpIcon className="h-8 w-8 text-green-500 mr-3" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">{formData.uploaded_filename}</p>
                                    <p className="text-sm text-gray-500">{formData.uploaded_mimetype}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="text-red-500 hover:text-red-700"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                        <span className="text-purple-600 hover:text-purple-500">
                                            Upload a file
                                        </span>
                                        {' '}or drag and drop
                                    </span>
                                    <p className="mt-1 text-xs text-gray-500">
                                        PDF, DOC, DOCX, or image files up to 10MB
                                    </p>
                                </label>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Comment
                    </label>
                    <textarea
                        value={formData.offer_comment}
                        onChange={(e) => handleInputChange('offer_comment', e.target.value)}
                        rows={3}
                        placeholder="Additional comments about the offer..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Terms
                    </label>
                    <textarea
                        value={formData.offer_terms}
                        onChange={(e) => handleInputChange('offer_terms', e.target.value)}
                        rows={3}
                        placeholder="Special terms and conditions..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* Admin Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                </label>
                <textarea
                    value={formData.admin_notes}
                    onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                    rows={3}
                    placeholder="Internal notes for admin use..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Creating...' : (isEditing ? 'Update Offer' : 'Create Offer')}
                </button>
            </div>
        </form>
    )
}
