'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function NewApplicationModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        assigned_user_id: '',
        trade_name: '',
        cr_number: '',
        cr_national_number: '',
        legal_form: '',
        registration_status: 'active',
        issue_date: null, // Fixed: use null instead of empty string
        city: '',
        activities: '',
        contact_info: {
            phone: '',
            email: '',
            website: ''
        },
        has_ecommerce: false,
        store_url: '',
        cr_capital: '',
        cash_capital: '',
        management_structure: '',
        management_names: '',
        contact_person: '',
        contact_person_number: '',
        number_of_pos_devices: '',
        city_of_operation: '',
        own_pos_system: false,
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [businessUsers, setBusinessUsers] = useState([])
    const [loadingUsers, setLoadingUsers] = useState(false)

    // Fetch business users for assignment
    useEffect(() => {
        if (isOpen) {
            fetchBusinessUsers()
        }
    }, [isOpen])

    const fetchBusinessUsers = async () => {
        try {
            setLoadingUsers(true)
            const response = await fetch('/api/admin/users/available-for-assignment', {
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                setBusinessUsers(data.data.users || [])
            }
        } catch (err) {
            console.error('Failed to fetch available business users:', err)
        } finally {
            setLoadingUsers(false)
        }
    }

    // Auto-populate fields when assigned user is selected
    const handleAssignedUserChange = (userId) => {
        if (userId) {
            const selectedUser = businessUsers.find(user => user.user_id === parseInt(userId))
            if (selectedUser) {
                setFormData(prev => ({
                    ...prev,
                    assigned_user_id: userId,
                    // Auto-populate fields from selected user
                    trade_name: selectedUser.entity_name || '', // Fixed: was selectedUser.trade_name
                    cr_number: selectedUser.cr_number || '',
                    cr_national_number: selectedUser.cr_national_number || '',
                    legal_form: selectedUser.legal_form || '',
                    registration_status: selectedUser.registration_status || 'active',
                    issue_date: selectedUser.issue_date_gregorian || null, // Fixed: send null instead of empty string
                    city: selectedUser.city || selectedUser.address || '',
                    activities: selectedUser.sector || '',
                    contact_info: {
                        phone: selectedUser.contact_info?.phone || '',
                        email: selectedUser.email || '',
                        website: selectedUser.store_url || ''
                    },
                    has_ecommerce: selectedUser.has_ecommerce || false,
                    store_url: selectedUser.store_url || '',
                    cr_capital: selectedUser.cr_capital || '',
                    cash_capital: selectedUser.cash_capital || '',
                    management_structure: selectedUser.management_structure || '',
                    management_names: selectedUser.management_managers ? selectedUser.management_managers.join(', ') : '',
                    contact_person: selectedUser.contact_person || '',
                    contact_person_number: selectedUser.contact_person_number || ''
                }))
            }
        } else {
            // Reset fields when no user is selected
            setFormData(prev => ({
                ...prev,
                assigned_user_id: '',
                trade_name: '',
                cr_number: '',
                cr_national_number: '',
                legal_form: '',
                registration_status: 'active',
                issue_date: null, // Fixed: send null instead of empty string
                city: '',
                activities: '',
                contact_info: {
                    phone: '',
                    email: '',
                    website: ''
                },
                has_ecommerce: false,
                store_url: '',
                cr_capital: '',
                cash_capital: '',
                management_structure: '',
                management_names: '',
                contact_person: '',
                contact_person_number: ''
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/admin/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                onSuccess(data.data)
                onClose()
                // Reset form
                setFormData({
                    trade_name: '',
                    cr_number: '',
                    cr_national_number: '',
                    legal_form: '',
                    registration_status: 'active',
                    issue_date: null, // Fixed: use null instead of empty string
                    city: '',
                    activities: '',
                    contact_info: {
                        phone: '',
                        email: '',
                        website: ''
                    },
                    has_ecommerce: false,
                    store_url: '',
                    cr_capital: '',
                    cash_capital: '',
                    management_structure: '',
                    management_names: '',
                    contact_person: '',
                    contact_person_number: '',
                    number_of_pos_devices: '',
                    city_of_operation: '',
                    own_pos_system: false,
                    notes: '',
                    assigned_user_id: ''
                })
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
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }))
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Create New Application</h3>
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
                    {/* Assigned User Selection - Moved to top */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Assign Business User</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Business User *</label>
                            <select
                                required
                                value={formData.assigned_user_id}
                                onChange={(e) => handleAssignedUserChange(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a business user to assign</option>
                                {loadingUsers ? (
                                    <option value="">Loading available users...</option>
                                ) : businessUsers.length === 0 ? (
                                    <option value="">No available business users found</option>
                                ) : (
                                    businessUsers.map(user => (
                                        <option key={user.user_id} value={user.user_id}>
                                            {user.entity_name} ({user.email}) - {user.city || user.address}
                                        </option>
                                    ))
                                )}
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                Only business users without existing applications are shown
                            </p>
                            {formData.assigned_user_id && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-700">
                                        <strong>Note:</strong> Business information fields below will be auto-populated from the selected user&apos;s data and cannot be edited.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Trade Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.trade_name}
                                    onChange={(e) => handleInputChange('trade_name', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CR Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.cr_number}
                                    onChange={(e) => handleInputChange('cr_number', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CR National Number</label>
                                <input
                                    type="text"
                                    value={formData.cr_national_number}
                                    onChange={(e) => handleInputChange('cr_national_number', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Legal Form</label>
                                <input
                                    type="text"
                                    value={formData.legal_form}
                                    onChange={(e) => handleInputChange('legal_form', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Status</label>
                                <input
                                    type="text"
                                    value={formData.registration_status}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 cursor-not-allowed`}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                <input
                                    type="text"
                                    value={formData.issue_date}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CR Capital (SAR)</label>
                                <input
                                    type="number"
                                    value={formData.cr_capital}
                                    onChange={(e) => handleInputChange('cr_capital', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cash Capital (SAR)</label>
                                <input
                                    type="number"
                                    value={formData.cash_capital}
                                    onChange={(e) => handleInputChange('cash_capital', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contact_person}
                                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                <input
                                    type="text"
                                    value={formData.contact_person_number}
                                    onChange={(e) => handleInputChange('contact_person_number', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="text"
                                    value={formData.contact_info.phone}
                                    onChange={(e) => handleInputChange('contact_info.phone', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.contact_info.email}
                                    onChange={(e) => handleInputChange('contact_info.email', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Website</label>
                                <input
                                    type="url"
                                    value={formData.contact_info.website}
                                    onChange={(e) => handleInputChange('contact_info.website', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                        </div>
                    </div>

                    {/* POS Information */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">POS Information</h4>
                        {formData.assigned_user_id && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-700">
                                    <strong>Editable Fields:</strong> The following POS-specific fields can still be customized for this application.
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Number of POS Devices</label>
                                <input
                                    type="number"
                                    value={formData.number_of_pos_devices}
                                    onChange={(e) => handleInputChange('number_of_pos_devices', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City of Operation</label>
                                <input
                                    type="text"
                                    value={formData.city_of_operation}
                                    onChange={(e) => handleInputChange('city_of_operation', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="has_ecommerce"
                                    checked={formData.has_ecommerce}
                                    onChange={(e) => handleInputChange('has_ecommerce', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    disabled={!!formData.assigned_user_id}
                                />
                                <label htmlFor="has_ecommerce" className="ml-2 block text-sm text-gray-900">
                                    Has E-commerce
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="own_pos_system"
                                    checked={formData.own_pos_system}
                                    onChange={(e) => handleInputChange('own_pos_system', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    disabled={!!formData.assigned_user_id}
                                />
                                <label htmlFor="own_pos_system" className="ml-2 block text-sm text-gray-900">
                                    Own POS System
                                </label>
                            </div>
                        </div>
                        {formData.has_ecommerce && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Store URL</label>
                                <input
                                    type="url"
                                    value={formData.store_url}
                                    onChange={(e) => handleInputChange('store_url', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                        )}
                    </div>

                    {/* Additional Information */}
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">Additional Information</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Activities</label>
                                <textarea
                                    value={formData.activities}
                                    onChange={(e) => handleInputChange('activities', e.target.value)}
                                    rows={3}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                    placeholder="Describe the business activities..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Management Structure</label>
                                <input
                                    type="text"
                                    value={formData.management_structure}
                                    onChange={(e) => handleInputChange('management_structure', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Management Names</label>
                                <input
                                    type="text"
                                    value={formData.management_names}
                                    onChange={(e) => handleInputChange('management_names', e.target.value)}
                                    className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                        formData.assigned_user_id ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    readOnly={!!formData.assigned_user_id}
                                    placeholder="Comma-separated names"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.assigned_user_id}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : !formData.assigned_user_id ? 'Select a Business User First' : 'Create Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
