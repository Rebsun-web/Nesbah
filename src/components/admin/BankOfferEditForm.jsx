'use client'

import { useState, useEffect } from 'react'
import { 
    XMarkIcon,
    DocumentArrowUpIcon,
    TrashIcon
} from '@heroicons/react/24/outline'

export default function BankOfferEditForm({ offer, banks, applications, onSubmit, onCancel, isEditing = true }) {
    const [formData, setFormData] = useState({
        // Financial Terms
        approved_financing_amount: '',
        proposed_repayment_period_months: '',
        interest_rate: '',
        monthly_installment_amount: '',
        grace_period_months: '',
        
        // Additional Information
        offer_comment: '',
        offer_terms: '',
        admin_notes: '',
        
        // File upload
        uploaded_document: null,
        uploaded_filename: '',
        uploaded_mimetype: ''
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (offer) {
            setFormData({
                approved_financing_amount: offer.approved_financing_amount || '',
                proposed_repayment_period_months: offer.proposed_repayment_period_months || '',
                interest_rate: offer.interest_rate || '',
                monthly_installment_amount: offer.monthly_installment_amount || '',
                grace_period_months: offer.grace_period_months || '',
                offer_comment: offer.offer_comment || '',
                offer_terms: offer.offer_terms || '',
                admin_notes: offer.admin_notes || '',
                uploaded_document: null,
                uploaded_filename: offer.uploaded_filename || '',
                uploaded_mimetype: offer.uploaded_mimetype || ''
            })
        }
    }, [offer])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const handleFileChange = (e) => {
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

    const validateForm = () => {
        const newErrors = {}

        // Required fields validation
        if (!formData.approved_financing_amount) {
            newErrors.approved_financing_amount = 'Approved amount is required'
        }
        if (!formData.proposed_repayment_period_months) {
            newErrors.proposed_repayment_period_months = 'Repayment period is required'
        }
        if (!formData.interest_rate) {
            newErrors.interest_rate = 'Interest rate is required'
        }
        if (!formData.monthly_installment_amount) {
            newErrors.monthly_installment_amount = 'Monthly installment is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        
        try {
            // Create FormData for file upload
            const submitData = new FormData()
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== '') {
                    submitData.append(key, formData[key])
                }
            })

            await onSubmit(submitData)
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Financial Terms */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Financial Terms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Approved Amount (SAR)
                        </label>
                        <input
                            type="number"
                            name="approved_financing_amount"
                            value={formData.approved_financing_amount}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.approved_financing_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                            step="0.01"
                        />
                        {errors.approved_financing_amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.approved_financing_amount}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repayment Period (months)
                        </label>
                        <input
                            type="number"
                            name="proposed_repayment_period_months"
                            value={formData.proposed_repayment_period_months}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.proposed_repayment_period_months ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="12"
                            min="1"
                        />
                        {errors.proposed_repayment_period_months && (
                            <p className="mt-1 text-sm text-red-600">{errors.proposed_repayment_period_months}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Rate (%)
                        </label>
                        <input
                            type="number"
                            name="interest_rate"
                            value={formData.interest_rate}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.interest_rate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                            step="0.01"
                        />
                        {errors.interest_rate && (
                            <p className="mt-1 text-sm text-red-600">{errors.interest_rate}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Installment (SAR)
                        </label>
                        <input
                            type="number"
                            name="monthly_installment_amount"
                            value={formData.monthly_installment_amount}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.monthly_installment_amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                            step="0.01"
                        />
                        {errors.monthly_installment_amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.monthly_installment_amount}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grace Period (months)
                        </label>
                        <input
                            type="number"
                            name="grace_period_months"
                            value={formData.grace_period_months}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0"
                            min="0"
                        />
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Offer Comment
                        </label>
                        <textarea
                            name="offer_comment"
                            value={formData.offer_comment}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter offer comment..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Offer Terms
                        </label>
                        <textarea
                            name="offer_terms"
                            value={formData.offer_terms}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter offer terms..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Notes
                        </label>
                        <textarea
                            name="admin_notes"
                            value={formData.admin_notes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter admin notes..."
                        />
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Document Upload</h4>
                
                {/* Current File Display */}
                {formData.uploaded_filename && !formData.uploaded_document && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-blue-800">
                                    Current file: {formData.uploaded_filename}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="text-red-600 hover:text-red-800"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* File Upload Input */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload New Document
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                        </p>
                    </div>

                    {/* New File Preview */}
                    {formData.uploaded_document && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <DocumentArrowUpIcon className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-800">
                                        New file: {formData.uploaded_filename}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Updating...' : 'Update Offer'}
                </button>
            </div>
        </form>
    )
}
