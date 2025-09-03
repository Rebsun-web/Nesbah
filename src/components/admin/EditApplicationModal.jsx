'use client'

import { useState, useEffect } from 'react'
import { 
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline'
import BankLogo from '@/components/BankLogo'

export default function EditApplicationModal({ isOpen, onClose, application, onSave }) {
    const [fullApplication, setFullApplication] = useState(null)
    const [loadingData, setLoadingData] = useState(false)
    const [formData, setFormData] = useState({
        status: '',
        admin_notes: '',
        trade_name: '',
        cr_number: '',
        city: '',
        contact_person: '',
        contact_person_number: '',
        business_email: '',
        notes: '',
        pos_provider_name: '',
        pos_age_duration_months: '',
        avg_monthly_pos_sales: '',
        requested_financing_amount: '',
        preferred_repayment_period_months: '',
        assigned_user_id: null
    })
    const [crNumberError, setCrNumberError] = useState('')
    const [fileUpload, setFileUpload] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)

    const fetchFullApplication = async (applicationId) => {
        try {
            setLoadingData(true)
            const response = await fetch(`/api/admin/applications/${applicationId}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success) {
                setFullApplication(data.data)
                return data.data
            } else {
                console.error('Failed to fetch full application:', data.error)
                return null
            }
        } catch (err) {
            console.error('Error fetching full application:', err)
            return null
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        if (isOpen && application) {
            console.log('EditApplicationModal: Application data received:', application)
            // Fetch full application data
            fetchFullApplication(application.application_id).then(fullApp => {
                if (fullApp) {
                    setFormData({
                        status: fullApp.status || '',
                        admin_notes: fullApp.admin_notes || '',
                        trade_name: fullApp.trade_name || '',
                        cr_number: fullApp.cr_number || '',
                        city: fullApp.city || '',
                        contact_person: fullApp.contact_person || '',
                        contact_person_number: fullApp.contact_person_number || '',
                        business_email: fullApp.business_email || '',
                        notes: fullApp.notes || '',
                        pos_provider_name: fullApp.pos_provider_name || '',
                        pos_age_duration_months: fullApp.pos_age_duration_months ? String(fullApp.pos_age_duration_months) : '',
                        avg_monthly_pos_sales: fullApp.avg_monthly_pos_sales ? String(fullApp.avg_monthly_pos_sales) : '',
                        requested_financing_amount: fullApp.requested_financing_amount ? String(fullApp.requested_financing_amount) : '',
                        preferred_repayment_period_months: fullApp.preferred_repayment_period_months ? String(fullApp.preferred_repayment_period_months) : '',
                        assigned_user_id: fullApp.assigned_user_id || null
                    })
                    console.log('EditApplicationModal: Full application data loaded:', fullApp)
                    console.log('EditApplicationModal: Form data set:', {
                        status: fullApp.status || '',
                        admin_notes: fullApp.admin_notes || '',
                        trade_name: fullApp.trade_name || '',
                        cr_number: fullApp.cr_number || '',
                        city: fullApp.city || '',
                        contact_person: fullApp.contact_person || '',
                        contact_person_number: fullApp.contact_person_number || '',
                        business_email: fullApp.business_email || '',
                        notes: fullApp.notes || '',
                        pos_provider_name: fullApp.pos_provider_name || '',
                        pos_age_duration_months: fullApp.pos_age_duration_months ? String(fullApp.pos_age_duration_months) : '',
                        avg_monthly_pos_sales: fullApp.avg_monthly_pos_sales ? String(fullApp.avg_monthly_pos_sales) : '',
                        requested_financing_amount: fullApp.requested_financing_amount ? String(fullApp.requested_financing_amount) : '',
                        preferred_repayment_period_months: fullApp.preferred_repayment_period_months ? String(fullApp.preferred_repayment_period_months) : '',
                        assigned_user_id: fullApp.assigned_user_id || null
                    })
                }
            })
            fetchUsers()
        } else if (!isOpen) {
            // Reset state when modal closes
            setFullApplication(null)
            setFormData({
                status: '',
                admin_notes: '',
                trade_name: '',
                cr_number: '',
                city: '',
                contact_person: '',
                contact_person_number: '',
                business_email: '',
                notes: '',
                pos_provider_name: '',
                pos_age_duration_months: '',
                avg_monthly_pos_sales: '',
                requested_financing_amount: '',
                preferred_repayment_period_months: '',
                assigned_user_id: null
            })
            setFileUpload(null)
            setError(null)
            setCrNumberError('')
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
        
        // Clear CR number error when user starts typing
        if (name === 'cr_number') {
            setCrNumberError('')
        }
    }

    const validateCrNumber = async (crNumber) => {
        if (!crNumber || crNumber === (fullApplication ? fullApplication.cr_number : application?.cr_number)) {
            return true // No change or empty, no validation needed
        }
        
        try {
            const response = await fetch(`/api/admin/applications/check-cr-number?cr_number=${encodeURIComponent(crNumber)}&exclude_id=${fullApplication ? fullApplication.application_id : application.application_id}`, {
                credentials: 'include'
            })
            const data = await response.json()
            
            if (data.success && data.data.exists) {
                setCrNumberError('This CR number is already associated with another application')
                return false
            } else {
                setCrNumberError('')
                return true
            }
        } catch (err) {
            console.error('CR number validation error:', err)
            return true // Allow submission if validation fails
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFileUpload(file)
        }
    }

    const handleFileUpload = async () => {
        if (!fileUpload) return null
        
        try {
            const formDataFile = new FormData()
            formDataFile.append('file', fileUpload)
            formDataFile.append('application_id', fullApplication ? fullApplication.application_id : application.application_id)
            
            const response = await fetch('/api/upload/document', {
                method: 'POST',
                credentials: 'include',
                body: formDataFile
            })
            
            const data = await response.json()
            if (data.success) {
                return data.data.filename
            }
        } catch (err) {
            console.error('File upload error:', err)
        }
        return null
    }

    const getSelectedUser = () => {
        return users.find(user => user.user_id === formData.assigned_user_id)
    }

    const handleUserSelect = (userId) => {
        setFormData(prev => ({ ...prev, assigned_user_id: userId }))
        setUserDropdownOpen(false)
    }

    const getStatusInfo = (status) => {
        const statusConfig = {
            'live_auction': {
                label: 'Live Auction',
                color: 'bg-yellow-100 text-yellow-800',
                icon: ClockIcon
            },
            'completed': {
                label: 'Completed',
                color: 'bg-green-100 text-green-800',
                icon: CheckCircleIcon
            },
            'ignored': {
                label: 'Ignored',
                color: 'bg-gray-100 text-gray-800',
                icon: XCircleIcon
            }
        }
        return statusConfig[status] || {
            label: status,
            color: 'bg-gray-100 text-gray-800',
            icon: ClockIcon
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (loadingData) {
            return // Don't submit while data is still loading
        }
        
        if (!fullApplication) {
            setError('Application data not loaded yet. Please wait.')
            return
        }
        
        setLoading(true)
        setError(null)

        // Validate CR number before submission
        const isCrValid = await validateCrNumber(formData.cr_number)
        if (!isCrValid) {
            setLoading(false)
            return
        }

        try {
            // Handle file upload first if present
            let uploadedFilename = null
            if (fileUpload) {
                uploadedFilename = await handleFileUpload()
            }
            
            // Clean numeric fields - convert empty strings to null
            const cleanFormData = {
                ...formData,
                pos_age_duration_months: formData.pos_age_duration_months === '' ? null : formData.pos_age_duration_months,
                avg_monthly_pos_sales: formData.avg_monthly_pos_sales === '' ? null : formData.avg_monthly_pos_sales,
                requested_financing_amount: formData.requested_financing_amount === '' ? null : formData.requested_financing_amount,
                preferred_repayment_period_months: formData.preferred_repayment_period_months === '' ? null : formData.preferred_repayment_period_months,
                assigned_user_id: formData.assigned_user_id === '' ? null : formData.assigned_user_id
            }

            console.log('📤 EditApplicationModal: Sending data to API:', cleanFormData)
            console.log('📧 Business email being sent:', cleanFormData.business_email)

            // Determine if auction timer should be reset
            // Reset if status is 'live_auction' (whether changing or staying the same)
            const shouldResetAuction = cleanFormData.status === 'live_auction' && fullApplication

            // Prepare form data with file upload if present
            const submitData = {
                ...cleanFormData,
                reset_auction: shouldResetAuction, // Only reset if status changed to live_auction
                uploaded_filename: uploadedFilename || (fullApplication ? fullApplication.uploaded_filename : application.uploaded_filename)
            }

            if (shouldResetAuction) {
                console.log('🔄 EditApplicationModal: Status is live_auction, auction timer will be reset')
                console.log('📊 Current status:', fullApplication.status, 'New status:', cleanFormData.status)
            } else {
                console.log('ℹ️ EditApplicationModal: No auction timer reset needed')
                console.log('📊 Current status:', fullApplication?.status, 'New status:', cleanFormData.status)
            }

            const response = await fetch(`/api/admin/applications/${fullApplication ? fullApplication.application_id : application.application_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(submitData)
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

                {loadingData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-600">Loading application data...</p>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Warning for live auction applications */}
                {fullApplication && fullApplication.status === 'live_auction' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                            <div className="ml-3">
                                <p className="text-sm text-orange-600">
                                    <strong>Warning:</strong> This is a live auction application. Editing any details will remove all previous offers, reset the auction timer, and clean tracking arrays.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" style={{ opacity: loadingData ? 0.5 : 1, pointerEvents: loadingData ? 'none' : 'auto' }}>
                    {/* Header Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-semibold text-gray-900">{application?.trade_name}</h4>
                                <p className="text-sm text-gray-600">Application #{application?.application_id}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="block px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="live_auction">Live Auction</option>
                                        <option value="completed">Completed</option>
                                        <option value="ignored">Ignored</option>
                                    </select>
                                    {formData.status === 'live_auction' && fullApplication && (
                                        <div className="mt-1 space-y-1">
                                            <p className="text-sm text-blue-600">
                                                ℹ️ Live Auction status will reset the auction timer to 48 hours
                                            </p>
                                            <p className="text-sm text-orange-600">
                                                ⚠️ Editing this application will remove all previous offers and clean tracking data
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                                Business Information
                            </h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Trade Name</label>
                                    <input
                                        type="text"
                                        name="trade_name"
                                        value={formData.trade_name}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">CR Number</label>
                                    <input
                                        type="text"
                                        name="cr_number"
                                        value={formData.cr_number}
                                        onChange={handleInputChange}
                                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm ${
                                            crNumberError ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {crNumberError && (
                                        <p className="mt-1 text-sm text-red-600">{crNumberError}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <UserIcon className="h-5 w-5 mr-2" />
                                Contact Information
                            </h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="text"
                                        name="contact_person_number"
                                        value={formData.contact_person_number}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Business Email</label>
                                    <input
                                        type="email"
                                        name="business_email"
                                        value={formData.business_email}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Application Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Application Details
                        </h5>
                        
                        {/* POS Information */}
                        <div className="mt-6">
                            <h6 className="text-md font-medium text-gray-800 mb-3">POS Information</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Provider Name</label>
                                    <input
                                        type="text"
                                        name="pos_provider_name"
                                        value={formData.pos_provider_name}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">POS Age Duration (months)</label>
                                    <input
                                        type="number"
                                        name="pos_age_duration_months"
                                        value={formData.pos_age_duration_months}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Average Monthly POS Sales (SAR)</label>
                                    <input
                                        type="number"
                                        name="avg_monthly_pos_sales"
                                        value={formData.avg_monthly_pos_sales}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Requested Financing Amount (SAR)</label>
                                    <input
                                        type="number"
                                        name="requested_financing_amount"
                                        value={formData.requested_financing_amount}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Preferred Repayment Period (months)</label>
                                    <input
                                        type="number"
                                        name="preferred_repayment_period_months"
                                        value={formData.preferred_repayment_period_months}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Notes */}
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Application notes..."
                            />
                        </div>

                        {/* File Upload */}
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700">Upload Document</label>
                            <div className="mt-1">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </div>
                            {application.uploaded_filename && (
                                <p className="mt-2 text-sm text-gray-600">
                                    Current file: {application.uploaded_filename}
                                </p>
                            )}
                            {fileUpload && (
                                <p className="mt-2 text-sm text-blue-600">
                                    New file selected: {fileUpload.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4">Admin Notes</h5>
                        <textarea
                            name="admin_notes"
                            value={formData.admin_notes}
                            onChange={handleInputChange}
                            rows={4}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Internal admin notes..."
                        />
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
