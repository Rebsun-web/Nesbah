'use client'

import { useState, useEffect } from 'react'
import { 
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import BankLogo from '@/components/BankLogo'

export default function EditApplicationModal({ isOpen, onClose, application, onSave }) {
    const [formData, setFormData] = useState({
        status: '',
        admin_notes: '',
        priority_level: 'normal',
        trade_name: '',
        cr_number: '',
        city: '',
        contact_person: '',
        contact_person_number: '',
        notes: '',
        assigned_user_id: null
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)

    useEffect(() => {
        if (isOpen && application) {
            setFormData({
                status: application.status || '',
                admin_notes: application.admin_notes || '',
                priority_level: application.priority_level || 'normal',
                trade_name: application.trade_name || '',
                cr_number: application.cr_number || '',
                city: application.city || '',
                contact_person: application.contact_person || '',
                contact_person_number: application.contact_person_number || '',
                notes: application.notes || '',
                assigned_user_id: application.assigned_user_id || null
            })
            fetchUsers()
        }
    }, [isOpen, application])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownOpen && !event.target.closest('.user-dropdown')) {
                setUserDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [userDropdownOpen])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users?user_type=bank', {
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                setUsers(data.data.users || [])
            }
        } catch (err) {
            console.error('Failed to fetch users:', err)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const getSelectedUser = () => {
        return users.find(user => user.user_id === formData.assigned_user_id)
    }

    const handleUserSelect = (userId) => {
        setFormData(prev => ({ ...prev, assigned_user_id: userId }))
        setUserDropdownOpen(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/admin/applications/${application.application_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                onSave(data.data)
                onClose()
            } else {
                setError(data.error || 'Failed to update application')
            }
        } catch (err) {
            setError('Network error while updating application')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Edit Application</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Application Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Status</option>
                                <option value="live_auction">Live Auction</option>
                                <option value="completed">Completed</option>
                                <option value="ignored">Ignored</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority Level
                            </label>
                            <select
                                name="priority_level"
                                value={formData.priority_level}
                                onChange={handleInputChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Business Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trade Name
                                </label>
                                <input
                                    type="text"
                                    name="trade_name"
                                    value={formData.trade_name}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CR Number
                                </label>
                                <input
                                    type="text"
                                    name="cr_number"
                                    value={formData.cr_number}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    name="contact_person"
                                    value={formData.contact_person}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Phone
                                </label>
                                <input
                                    type="text"
                                    name="contact_person_number"
                                    value={formData.contact_person_number}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assign to User
                                </label>
                                <div className="relative user-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                                    >
                                        {formData.assigned_user_id ? (
                                            <div className="flex items-center space-x-3">
                                                <BankLogo
                                                    bankName={getSelectedUser()?.trade_name || getSelectedUser()?.entity_name}
                                                    logoUrl={getSelectedUser()?.logo_url}
                                                    size="sm"
                                                />
                                                <span className="text-gray-900">
                                                    {getSelectedUser()?.trade_name || getSelectedUser()?.entity_name || getSelectedUser()?.email}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">Not Assigned</span>
                                        )}
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                    </button>

                                    {userDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                            <button
                                                type="button"
                                                onClick={() => handleUserSelect(null)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-500 text-sm">—</span>
                                                </div>
                                                <span className="text-gray-500">Not Assigned</span>
                                            </button>
                                            {users.map(user => (
                                                <button
                                                    key={user.user_id}
                                                    type="button"
                                                    onClick={() => handleUserSelect(user.user_id)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <BankLogo
                                                        bankName={user.trade_name || user.entity_name}
                                                        logoUrl={user.logo_url}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.trade_name || user.entity_name || 'Unnamed Bank'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Application Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Application notes..."
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
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Internal admin notes..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
