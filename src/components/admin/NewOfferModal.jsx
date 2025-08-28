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
        offer_validity_days: '30',
        deal_value: '',
        commission_rate: '3.0',
        includes_hardware: false,
        includes_software: false,
        includes_support: false,
        support_hours: '',
        warranty_months: '',
        pricing_tier: 'standard',
        volume_discount_threshold: '',
        volume_discount_percentage: '',
        settlement_time: '',
        bank_name: '',
        bank_contact_person: '',
        bank_contact_email: '',
        bank_contact_phone: '',
        admin_notes: '',
        is_featured: false,
        featured_reason: ''
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
                    offer_validity_days: '30',
                    deal_value: '',
                    commission_rate: '3.0',
                    includes_hardware: false,
                    includes_software: false,
                    includes_support: false,
                    support_hours: '',
                    warranty_months: '',
                    pricing_tier: 'standard',
                    volume_discount_threshold: '',
                    volume_discount_percentage: '',

                    settlement_time: '',
                    bank_name: '',
                    bank_contact_person: '',
                    bank_contact_email: '',
                    bank_contact_phone: '',
                    admin_notes: '',
                    is_featured: false,
                    featured_reason: ''
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

                    {/* Bank Contact Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Bank Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    name="bank_contact_person"
                                    value={formData.bank_contact_person}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Contact person name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    name="bank_contact_email"
                                    value={formData.bank_contact_email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="contact@bank.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Phone
                                </label>
                                <input
                                    type="tel"
                                    name="bank_contact_phone"
                                    value={formData.bank_contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="+966 50 123 4567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Financial Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Device Setup Fee (SAR)
                                </label>
                                <input
                                    type="number"
                                    name="offer_device_setup_fee"
                                    value={formData.offer_device_setup_fee}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mada Transaction Fee (%)
                                </label>
                                <input
                                    type="number"
                                    name="offer_transaction_fee_mada"
                                    value={formData.offer_transaction_fee_mada}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Visa/MC Transaction Fee (%)
                                </label>
                                <input
                                    type="number"
                                    name="offer_transaction_fee_visa_mc"
                                    value={formData.offer_transaction_fee_visa_mc}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="2.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deal Value (SAR)
                                </label>
                                <input
                                    type="text"
                                    value={calculateDealValue()}
                                    readOnly
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                                    placeholder="Auto-calculated"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commission Rate (%)
                                </label>
                                <input
                                    type="number"
                                    name="commission_rate"
                                    value={formData.commission_rate}
                                    onChange={handleInputChange}
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="3.0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Settlement & Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mada Settlement Time (hours)
                            </label>
                            <input
                                type="number"
                                name="offer_settlement_time_mada"
                                value={formData.offer_settlement_time_mada}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="12"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visa/MC Settlement Time (hours)
                            </label>
                            <input
                                type="number"
                                name="offer_settlement_time_visa_mc"
                                value={formData.offer_settlement_time_visa_mc}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="24"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                General Settlement Time
                            </label>
                            <input
                                type="text"
                                name="settlement_time"
                                value={formData.settlement_time}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="24-48 hours"
                            />
                        </div>
                    </div>

                    {/* Offer Features */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Offer Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includes_hardware"
                                    checked={formData.includes_hardware}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-700">Hardware Included</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includes_software"
                                    checked={formData.includes_software}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-700">Software Included</span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includes_support"
                                    checked={formData.includes_support}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-700">Support Included</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Support Hours
                                </label>
                                <input
                                    type="text"
                                    name="support_hours"
                                    value={formData.support_hours}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="24/7"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Warranty (months)
                                </label>
                                <input
                                    type="number"
                                    name="warranty_months"
                                    value={formData.warranty_months}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Volume Discounts */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Pricing & Volume Discounts</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pricing Tier
                                </label>
                                <select
                                    name="pricing_tier"
                                    value={formData.pricing_tier}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="basic">Basic</option>
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Volume Discount Threshold (SAR)
                                </label>
                                <input
                                    type="number"
                                    name="volume_discount_threshold"
                                    value={formData.volume_discount_threshold}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="10000.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Volume Discount (%)
                                </label>
                                <input
                                    type="number"
                                    name="volume_discount_percentage"
                                    value={formData.volume_discount_percentage}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="5.00"
                                />
                            </div>
                        </div>
                    </div>



                    {/* Offer Terms & Validity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Terms
                            </label>
                            <textarea
                                name="offer_terms"
                                value={formData.offer_terms}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Detailed terms and conditions of this offer..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Validity (days)
                            </label>
                            <input
                                type="number"
                                name="offer_validity_days"
                                value={formData.offer_validity_days}
                                onChange={handleInputChange}
                                min="1"
                                max="365"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="30"
                            />
                        </div>
                    </div>

                    {/* Comments & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Comment
                            </label>
                            <textarea
                                name="offer_comment"
                                value={formData.offer_comment}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional details about this offer..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Notes
                            </label>
                            <textarea
                                name="admin_notes"
                                value={formData.admin_notes}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Internal notes..."
                            />
                        </div>
                    </div>

                    {/* Featured Offer Settings */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Featured Offer Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_featured"
                                    checked={formData.is_featured}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm text-gray-700">Mark as Featured Offer</span>
                            </label>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Featured Reason
                                </label>
                                <input
                                    type="text"
                                    name="featured_reason"
                                    value={formData.featured_reason}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Why this offer should be featured..."
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
