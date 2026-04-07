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
import { calculateApplicationStatus } from '@/lib/application-status'
import { getCorrectStatus } from '@/lib/client-status-utils'
import { auctionConfig } from '@/lib/config/auction-config'

export default function EditApplicationModal({ isOpen, onClose, application, onSuccess }) {
    const [fullApplication, setFullApplication] = useState(null)
    const [loadingData, setLoadingData] = useState(false)
    const [formData, setFormData] = useState({
        status: '',
        admin_notes: '',
        trade_name: '',
        city_of_operation: '',
        sector: '',
        financing_type: '',
        approximate_financing_amount: '',
        contact_person: '',
        contact_person_number: '',
        business_contact_email: '',
        notes: '',
        assigned_user_id: null
    })
    const [crNumberError, setCrNumberError] = useState('')
    const [fileUpload, setFileUpload] = useState(null)
    const [base64File, setBase64File] = useState(null)
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
                    // Always use the correct calculated status - there should be only one status
                    const correctStatus = getCorrectStatus(fullApp);
                    console.log('EditApplicationModal: Status synchronization:', {
                        rawStatus: fullApp.status,
                        currentStatus: fullApp.current_application_status,
                        correctStatus: correctStatus,
                        auctionEndTime: fullApp.auction_end_time,
                        offersCount: fullApp.offers_count,
                        needsSync: correctStatus !== (fullApp.current_application_status || fullApp.status)
                    });
                    
                    setFormData({
                        status: correctStatus || '',
                        admin_notes: fullApp.admin_notes || '',
                        trade_name: fullApp.trade_name || '',
                        city_of_operation: fullApp.city_of_operation || '',
                        sector: fullApp.sector || '',
                        financing_type: fullApp.financing_type || '',
                        approximate_financing_amount: fullApp.approximate_financing_amount || '',
                        contact_person: fullApp.contact_person || '',
                        contact_person_number: fullApp.contact_person_number || '',
                        business_contact_email: fullApp.business_contact_email || '',
                        notes: fullApp.notes || '',
                        assigned_user_id: fullApp.assigned_user_id || null
                    })
                    console.log('EditApplicationModal: Full application data loaded:', fullApp)
                    console.log('EditApplicationModal: Form data set:', {
                        status: correctStatus || '',
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
                city_of_operation: '',
                sector: '',
                financing_type: '',
                approximate_financing_amount: '',
                contact_person: '',
                contact_person_number: '',
                business_contact_email: '',
                notes: '',
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

            // Prepare form data with file upload if present (base64)
            const submitData = {
                ...cleanFormData,
                reset_auction: shouldResetAuction, // Only reset if status changed to live_auction
                // If new file uploaded, use base64 data; otherwise keep existing file reference
                uploaded_document: base64File?.data || undefined,
                uploaded_filename: base64File?.name || (fullApplication ? fullApplication.uploaded_filename : application.uploaded_filename),
                uploaded_mimetype: base64File?.type || undefined
            }

            console.log('📤 Submitting with file data:', {
                has_new_file: !!base64File,
                filename: submitData.uploaded_filename,
                mimetype: submitData.uploaded_mimetype
            })

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
            
            console.log('📡 EditApplicationModal: Response status:', response.status)
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ EditApplicationModal: Response not ok:', response.status, errorText)
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('📡 EditApplicationModal: Response data:', data)
            
            if (data.success) {
                console.log('✅ EditApplicationModal: Update successful, calling onSuccess and onClose')
                if (onSuccess) {
                    await onSuccess()
                }
                onClose()
            } else {
                console.error('❌ EditApplicationModal: Update failed:', data.error)
                setError(data.error || 'Failed to update application')
            }
        } catch (err) {
            console.error('❌ EditApplicationModal: Error during update:', err)
            console.error('Error details:', {
                message: err.message,
                stack: err.stack
            })
            setError(err.message || 'Network error while updating application')
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
                {fullApplication && formData.status === 'live_auction' && (
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

                {/* Warning for completed applications */}
                {fullApplication && formData.status === 'completed' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                            <div className="ml-3">
                                <p className="text-sm text-blue-600">
                                    <strong>Info:</strong> This application is completed. Changing the status to "Live Auction" will reset the auction timer to {auctionConfig.durationHours} hours and remove all existing offers. Changing to "Ignored" will mark it as expired with no offers.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning for ignored applications */}
                {fullApplication && formData.status === 'ignored' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">
                                    <strong>Info:</strong> This application is ignored (expired with no offers). Changing the status to "Live Auction" will reset the auction timer to {auctionConfig.durationHours} hours and allow new offers. Changing to "Completed" will mark it as having offers.
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
                                                ℹ️ Live Auction status will reset the auction timer to {auctionConfig.durationHours} hours
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
                                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                                    <input
                                        type="text"
                                        name="trade_name"
                                        value={formData.trade_name}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        name="city_of_operation"
                                        value={formData.city_of_operation}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Sector</label>
                                    <input
                                        type="text"
                                        name="sector"
                                        value={formData.sector}
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
                                        name="business_contact_email"
                                        value={formData.business_contact_email}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financing Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            Financing Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Financing Type</label>
                                <select
                                    name="financing_type"
                                    value={formData.financing_type}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="">Select type</option>
                                    <option value="business">Business Financing</option>
                                    <option value="working_capital">Working Capital</option>
                                    <option value="expansion">Expansion Financing</option>
                                    <option value="equipment">Equipment Financing</option>
                                    <option value="project">Project Financing</option>
                                    <option value="real_estate">Real Estate</option>
                                    <option value="pos">POS Financing</option>
                                    <option value="general">General / Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Approximate Amount Needed</label>
                                <select
                                    name="approximate_financing_amount"
                                    value={formData.approximate_financing_amount}
                                    onChange={handleInputChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option value="">Select range</option>
                                    <option value="Less than 250K SAR">Less than 250K SAR</option>
                                    <option value="250K – 1M SAR">250K – 1M SAR</option>
                                    <option value="1M – 5M SAR">1M – 5M SAR</option>
                                    <option value="More than 5M SAR">More than 5M SAR</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700">Purpose of Financing</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Purpose of financing..."
                            />
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
