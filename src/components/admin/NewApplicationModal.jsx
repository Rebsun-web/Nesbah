'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function NewApplicationModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1) // 1: CR validation, 2: Application form
    const [formData, setFormData] = useState({
        // CR Number for validation
        cr_number: '',
        
        // Business User Information (auto-populated after validation)
        business_user_id: '',
        trade_name: '',
        cr_national_number: '',
        legal_form: '',
        registration_status: '',
        issue_date: '',
        city: '',
        activities: '',
        has_ecommerce: false,
        store_url: '',
        cr_capital: '',
        cash_capital: '',
        management_structure: '',
        management_names: '',
        contact_person: '',
        contact_person_number: '',
        contact_email: '',
        
        // POS Application Details (required fields)
        pos_provider_name: '',
        pos_age_duration_months: '',
        avg_monthly_pos_sales: '',
        requested_financing_amount: '',
        preferred_repayment_period_months: '',
        
        // Additional Information
        notes: '',
        uploaded_filename: null
    })
    
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [error, setError] = useState('')
    const [validationError, setValidationError] = useState('')
    const [fileUpload, setFileUpload] = useState(null)
    const [base64File, setBase64File] = useState(null)

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1)
            setFormData({
                cr_number: '',
                business_user_id: '',
                trade_name: '',
                cr_national_number: '',
                legal_form: '',
                registration_status: '',
                issue_date: '',
                city: '',
                activities: '',
                has_ecommerce: false,
                store_url: '',
                cr_capital: '',
                cash_capital: '',
                management_structure: '',
                management_names: '',
                contact_person: '',
                contact_person_number: '',
                contact_email: '',
                pos_provider_name: '',
                pos_age_duration_months: '',
                avg_monthly_pos_sales: '',
                requested_financing_amount: '',
                preferred_repayment_period_months: '',
                notes: '',
                uploaded_filename: null
            })
            setFileUpload(null)
            setBase64File(null)
            setError('')
            setValidationError('')
        }
    }, [isOpen])

    // Validate CR number and check for existing application
    const validateCrNumber = async () => {
        if (!formData.cr_number.trim()) {
            setValidationError('Please enter a CR Number')
            return
        }

        setValidating(true)
        setValidationError('')

        try {
            const response = await fetch(`/api/admin/applications/validate-cr-for-creation?cr_number=${encodeURIComponent(formData.cr_number.trim())}`, {
                credentials: 'include'
            })
            const data = await response.json()

            if (data.success) {
                // CR number is valid and business user doesn't have an application
                const businessUser = data.data.businessUser
                setFormData(prev => ({
                    ...prev,
                    business_user_id: businessUser.user_id,
                    trade_name: businessUser.trade_name || '',
                    cr_national_number: businessUser.cr_national_number || '',
                    legal_form: businessUser.legal_form || '',
                    registration_status: businessUser.registration_status || '',
                    issue_date: businessUser.issue_date || '',
                    city: businessUser.city || '',
                    activities: businessUser.activities || '',
                    has_ecommerce: businessUser.has_ecommerce || false,
                    store_url: businessUser.store_url || '',
                    cr_capital: businessUser.cr_capital || '',
                    cash_capital: businessUser.cash_capital || '',
                    management_structure: businessUser.management_structure || '',
                    management_names: businessUser.management_managers ? 
                        (Array.isArray(businessUser.management_managers) ? 
                            businessUser.management_managers.join(', ') : 
                            businessUser.management_names) : '',
                    contact_person: businessUser.contact_person || '',
                    contact_person_number: businessUser.contact_person_number || '',
                    contact_email: businessUser.email || ''
                }))
                setStep(2) // Move to application form
            } else {
                setValidationError(data.error || 'Validation failed')
            }
        } catch (err) {
            setValidationError('Network error while validating CR number')
        } finally {
            setValidating(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        
        if (!file) {
            return
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only PDF, JPG, or DOCX files.')
            return
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            alert('File size must be less than 10MB.')
            return
        }

        setFileUpload(file)

        // Convert file to base64
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]
            setBase64File({
                data: base64,
                name: file.name,
                type: file.type
            })
            console.log('📄 File converted to base64:', {
                name: file.name,
                type: file.type,
                size: file.size
            })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validate required fields
        if (!formData.pos_provider_name || !formData.pos_age_duration_months || 
            !formData.avg_monthly_pos_sales || !formData.requested_financing_amount) {
            setError('Please fill in all required POS application fields')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Prepare data for submission - only CR number for lookup and POS-specific data
            const submissionData = {
                // Only CR number needed for business user lookup
                cr_national_number: formData.cr_national_number,
                
                // Contact information (editable fields)
                contact_person: formData.contact_person,
                contact_person_number: formData.contact_person_number,
                contact_email: formData.contact_email,
                
                // POS application details (required fields)
                pos_provider_name: formData.pos_provider_name,
                pos_age_duration_months: parseInt(formData.pos_age_duration_months),
                avg_monthly_pos_sales: parseFloat(formData.avg_monthly_pos_sales),
                requested_financing_amount: parseFloat(formData.requested_financing_amount),
                preferred_repayment_period_months: formData.preferred_repayment_period_months ? 
                    parseInt(formData.preferred_repayment_period_months) : null,
                
                // Optional fields
                notes: formData.notes,
                number_of_pos_devices: formData.number_of_pos_devices,
                city_of_operation: formData.city_of_operation,
                own_pos_system: formData.own_pos_system,
                
                // File upload - send base64 data (same as portal form)
                uploaded_document: base64File?.data || null,
                uploaded_filename: base64File?.name || null,
                uploaded_mimetype: base64File?.type || null
            }

            console.log('📤 Submitting application with file data:', {
                has_file: !!base64File,
                filename: base64File?.name,
                mimetype: base64File?.type
            })

            const response = await fetch('/api/admin/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(submissionData)
            })

            const data = await response.json()

            if (data.success) {
                onSuccess(data.data)
                onClose()
            } else {
                setError(data.error || 'Failed to create application')
            }
        } catch (err) {
            setError('Network error while creating application')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const goBackToValidation = () => {
        setStep(1)
        setError('')
        setValidationError('')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {step === 1 ? 'Validate CR Number' : 'Create New Application'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Step 1: CR Number Validation */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex">
                                <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">Step 1: Validate Business User</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Enter the CR Number of the business user to validate they exist and don&apos;t have a submitted application yet.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {validationError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                    <div className="ml-3">
                                        <p className="text-sm text-red-600">{validationError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CR Number *
                            </label>
                            <input
                                type="text"
                                value={formData.cr_number}
                                onChange={(e) => handleInputChange('cr_number', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter CR Number"
                                disabled={validating}
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={validateCrNumber}
                                disabled={validating || !formData.cr_number.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {validating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="h-4 w-4 mr-2" />
                                        Validate CR Number
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Application Form */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <CheckIcon className="h-5 w-5 text-green-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-green-800">Step 2: Create Application</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        CR Number validated successfully! Business user: <strong>{formData.trade_name}</strong> (CR: {formData.cr_number})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                    <div className="ml-3">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Business Information (Read-only) */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Business Information (Auto-populated)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Trade Name</label>
                                    <input
                                        type="text"
                                        value={formData.trade_name}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">CR Number</label>
                                    <input
                                        type="text"
                                        value={formData.cr_number}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                                        placeholder="Enter contact person name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="contact_person_number"
                                        value={formData.contact_person_number}
                                        onChange={(e) => handleInputChange('contact_person_number', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Business Email</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter business email"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* POS Application Details */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                POS Application Details
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Provider Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.pos_provider_name}
                                        onChange={(e) => handleInputChange('pos_provider_name', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter POS provider name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Age Duration (months) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.pos_age_duration_months}
                                        onChange={(e) => handleInputChange('pos_age_duration_months', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter duration in months"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Average Monthly POS Sales (SAR) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.avg_monthly_pos_sales}
                                        onChange={(e) => handleInputChange('avg_monthly_pos_sales', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter monthly sales amount"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Requested Financing Amount (SAR) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.requested_financing_amount}
                                        onChange={(e) => handleInputChange('requested_financing_amount', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter financing amount"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Preferred Repayment Period (months)</label>
                                    <input
                                        type="number"
                                        value={formData.preferred_repayment_period_months}
                                        onChange={(e) => handleInputChange('preferred_repayment_period_months', e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Optional - Enter period in months"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Application notes..."
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Upload Document</label>
                                    <div className="mt-1">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                    {fileUpload && (
                                        <p className="mt-2 text-sm text-blue-600">
                                            File selected: {fileUpload.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={goBackToValidation}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Back to Validation
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="h-4 w-4 mr-2" />
                                        Create Application
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
