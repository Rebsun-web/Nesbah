'use client'

import { useState, useEffect } from 'react'
import { 
    XMarkIcon,
    BuildingOfficeIcon,
    BanknotesIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import BankLogo from '@/components/BankLogo'

export default function NewOfferModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [applications, setApplications] = useState([])
    const [banks, setBanks] = useState([])
    const [bankDropdownOpen, setBankDropdownOpen] = useState(false)
    
    // Form state
    const [formData, setFormData] = useState({
        application_id: '',
        bank_user_id: '',
        offer_device_setup_fee: '',
        offer_transaction_fee_mada: '',
        offer_transaction_fee_visa_mc: '',
        offer_settlement_time_mada: '',
        offer_settlement_time_visa_mc: '',
        offer_comment: '',
        offer_terms: '',
        deal_value: '',
        commission_rate: '3.0',
        settlement_time: '',
        bank_name: '',
        bank_contact_person: '',
        bank_contact_email: '',
        bank_contact_phone: '',
        admin_notes: '',
        is_featured: false,
        featured_reason: '',
        approved_financing_amount: '',
        proposed_repayment_period_months: '',
        interest_rate: '',
        monthly_installment_amount: '',
        grace_period_months: '',
        relationship_manager_name: '',
        relationship_manager_email: '',
        relationship_manager_phone: ''
    })

    useEffect(() => {
        if (isOpen) {
            fetchApplications()
            fetchBanks()
        }
    }, [isOpen])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bankDropdownOpen && !event.target.closest('.bank-dropdown')) {
                setBankDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [bankDropdownOpen])

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/admin/applications?status=live_auction&limit=100', {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setApplications(data.data.applications || [])
            }
        } catch (err) {
            console.error('Failed to fetch applications:', err)
        }
    }

    const fetchBanks = async () => {
        try {
            const response = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setBanks(data.banks || [])
            }
        } catch (err) {
            console.error('Failed to fetch banks:', err)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const getSelectedBank = () => {
        return banks.find(bank => bank.user_id === formData.bank_user_id)
    }

    const handleBankSelect = (bankId) => {
        const selectedBank = banks.find(bank => bank.user_id === bankId)
        setFormData(prev => ({ 
            ...prev, 
            bank_user_id: bankId,
            bank_name: selectedBank?.entity_name || '',
            bank_contact_person: selectedBank?.contact_person || '',
            bank_contact_email: selectedBank?.email || '',
            bank_contact_phone: selectedBank?.contact_person_number || ''
        }))
        setBankDropdownOpen(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                onSuccess(data.offer)
                onClose()
                // Reset form
                setFormData({
                    application_id: '',
                    bank_user_id: '',
                    offer_device_setup_fee: '',
                    offer_transaction_fee_mada: '',
                    offer_transaction_fee_visa_mc: '',
                    offer_settlement_time_mada: '',
                    offer_settlement_time_visa_mc: '',
                    offer_comment: '',
                    offer_terms: '',
                    deal_value: '',
                    commission_rate: '3.0',
                    settlement_time: '',
                    bank_name: '',
                    bank_contact_person: '',
                    bank_contact_email: '',
                    bank_contact_phone: '',
                    admin_notes: '',
                    is_featured: false,
                    featured_reason: '',
                    approved_financing_amount: '',
                    proposed_repayment_period_months: '',
                    interest_rate: '',
                    monthly_installment_amount: '',
                    grace_period_months: '',
                    relationship_manager_name: '',
                    relationship_manager_email: '',
                    relationship_manager_phone: ''
                })
            } else {
                setError(data.error || 'Failed to create offer')
            }
        } catch (err) {
            setError('Network error while creating offer')
        } finally {
            setLoading(false)
        }
    }

    const calculateDealValue = () => {
        const setupFee = parseFloat(formData.offer_device_setup_fee) || 0
        const madaFee = parseFloat(formData.offer_transaction_fee_mada) || 0
        const visaFee = parseFloat(formData.offer_transaction_fee_visa_mc) || 0
        
        if (setupFee > 0) {
            return (setupFee + (setupFee * (madaFee / 100))).toFixed(2)
        }
        return ''
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <BanknotesIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Create New Offer</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Application *
                            </label>
                            <select
                                name="application_id"
                                value={formData.application_id}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select an application</option>
                                {applications.map(app => (
                                    <option key={app.application_id} value={app.application_id}>
                                        {app.business_name || app.trade_name} #{app.application_id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bank *
                            </label>
                            <div className="relative bank-dropdown">
                                <button
                                    type="button"
                                    onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                                >
                                    {formData.bank_user_id ? (
                                        <div className="flex items-center space-x-3">
                                            <BankLogo
                                                bankName={getSelectedBank()?.entity_name}
                                                logoUrl={getSelectedBank()?.logo_url}
                                                size="sm"
                                            />
                                            <span className="text-gray-900">
                                                {getSelectedBank()?.entity_name || getSelectedBank()?.email}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Select a bank</span>
                                    )}
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                </button>

                                {bankDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {banks.map(bank => (
                                            <button
                                                key={bank.user_id}
                                                type="button"
                                                onClick={() => handleBankSelect(bank.user_id)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                                            >
                                                <BankLogo
                                                    bankName={bank.entity_name}
                                                    logoUrl={bank.logo_url}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {bank.entity_name || 'Unnamed Bank'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {bank.email}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Required Financing Fields */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-blue-900 mb-4">Required Financing Fields</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Approved Financing Amount (SAR) *
                                </label>
                                <input
                                    type="number"
                                    name="approved_financing_amount"
                                    value={formData.approved_financing_amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proposed Repayment Period (months) *
                                </label>
                                <input
                                    type="number"
                                    name="proposed_repayment_period_months"
                                    value={formData.proposed_repayment_period_months}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="12"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Interest/Profit Rate (%) *
                                </label>
                                <input
                                    type="number"
                                    name="interest_rate"
                                    value={formData.interest_rate}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="5.50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monthly Installment Amount (SAR) *
                                </label>
                                <input
                                    type="number"
                                    name="monthly_installment_amount"
                                    value={formData.monthly_installment_amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grace Period (months) - Optional
                                </label>
                                <input
                                    type="number"
                                    name="grace_period_months"
                                    value={formData.grace_period_months}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0 (if applicable)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Relationship Manager Details */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-green-900 mb-4">Relationship Manager Contact Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    name="relationship_manager_name"
                                    value={formData.relationship_manager_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Full Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="relationship_manager_email"
                                    value={formData.relationship_manager_email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="manager@bank.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="relationship_manager_phone"
                                    value={formData.relationship_manager_phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+966 50 123 4567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
