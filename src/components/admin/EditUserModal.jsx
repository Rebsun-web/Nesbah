import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EditUserModal({ user, isOpen, onClose, onUpdate }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        if (user && isOpen) {
            // Initialize form data based on user type
            if (user.userType === 'business') {
                setFormData({
                    email: user.email || '',
                    trade_name: user.trade_name || '',
                    cr_number: user.cr_number || '',
                    cr_national_number: user.cr_national_number || '',
                    legal_form: user.legal_form || '',
                    registration_status: user.registration_status || '',
                    issue_date_gregorian: user.issue_date_gregorian || '',
                    confirmation_date_gregorian: user.confirmation_date_gregorian || '',
                    headquarter_city_name: user.headquarter_city_name || '',
                    city: user.city || user.headquarter_city_name || '', // Handle both city fields
                    contact_person: user.contact_person || '',
                    contact_person_number: user.contact_person_number || '',
                    activities: user.activities || '',
                    has_ecommerce: user.has_ecommerce || false,
                    store_url: user.store_url || '',
                    cr_capital: user.cr_capital || '',
                    cash_capital: user.cash_capital || '',
                    in_kind_capital: user.in_kind_capital || '',
                    avg_capital: user.avg_capital || '',
                    management_structure: user.management_structure || '',
                    management_managers: user.management_managers || '',
                    account_status: user.account_status || 'active',
                    user_type: user.userType || 'business'
                });
            } else if (user.userType === 'bank') {
                setFormData({
                    email: user.email || '',
                    entity_name: user.entity_name || '',
                    logo_url: user.logo_url || '',
                    account_status: user.account_status || 'active',
                    user_type: user.userType || 'bank'
                });
                // Reset file upload state
                setLogoFile(null);
                setLogoPreview(null);
            } else if (user.userType === 'employee') {
                setFormData({
                    email: user.email || '',
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    position: user.position || '',
                    phone: user.phone || '',
                    user_type: user.userType || 'employee'
                });
            }
        }
    }, [user, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let processedValue = value;
        
        // Handle numeric fields to prevent invalid values
        if (['cr_capital', 'cash_capital', 'in_kind_capital', 'avg_capital'].includes(name)) {
            if (value === '' || value === null || value === undefined) {
                processedValue = '';
            } else if (isNaN(parseFloat(value))) {
                processedValue = '';
            } else if (parseFloat(value) < 0) {
                processedValue = '';
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : processedValue
        }));
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            // Clear the logo URL when file is selected
            setFormData(prev => ({
                ...prev,
                logo_url: ''
            }));
        }
    };

    const removeLogoFile = () => {
        setLogoFile(null);
        setLogoPreview(null);
        // Restore original logo URL if it exists
        if (user && user.logo_url) {
            setFormData(prev => ({
                ...prev,
                logo_url: user.logo_url
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Clean numeric fields before submission to prevent empty strings
            const cleanFormData = { ...formData };
            
            // Remove uneditable fields from submission
            delete cleanFormData.cr_national_number;
            delete cleanFormData.cr_number;
            
            // Convert empty strings to null for numeric fields
            const numericFields = ['cr_capital', 'cash_capital', 'in_kind_capital', 'avg_capital'];
            numericFields.forEach(field => {
                if (cleanFormData[field] === '' || cleanFormData[field] === null || cleanFormData[field] === undefined) {
                    cleanFormData[field] = null;
                } else if (typeof cleanFormData[field] === 'string' && cleanFormData[field].trim() === '') {
                    cleanFormData[field] = null;
                }
            });

            // Handle logo file upload if present
            if (logoFile) {
                console.log('🔄 Starting logo upload for file:', logoFile.name, logoFile.size);
                try {
                    const formData = new FormData();
                    formData.append('logo', logoFile);
                    
                    console.log('🔄 Sending logo upload request to /api/upload/bank-logo');
                    const uploadResponse = await fetch('/api/upload/bank-logo', {
                        method: 'POST',
                        body: formData
                    });
                    
                    console.log('🔄 Upload response status:', uploadResponse.status);
                    
                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        console.error('❌ Upload failed with status:', uploadResponse.status, errorText);
                        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
                    }
                    
                    const uploadResult = await uploadResponse.json();
                    console.log('🔄 Upload result:', uploadResult);
                    
                    if (uploadResult.success) {
                        cleanFormData.logo_url = uploadResult.logo_url;
                        console.log('✅ Logo uploaded successfully:', uploadResult.logo_url);
                    } else {
                        throw new Error(uploadResult.error || 'Logo upload failed');
                    }
                } catch (uploadError) {
                    console.error('❌ Logo upload error:', uploadError);
                    throw new Error(`Logo upload failed: ${uploadError.message}`);
                }
            } else {
                console.log('ℹ️ No logo file to upload');
            }

            await onUpdate(cleanFormData);
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderBusinessUserForm = () => (
        <div className="space-y-6">
            {/* Basic Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trade Name *</label>
                        <input
                            type="text"
                            name="trade_name"
                            value={formData.trade_name || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CR National Number <span className="text-gray-500 text-xs">(Read-only)</span>
                        </label>
                        <input
                            type="text"
                            name="cr_national_number"
                            value={formData.cr_national_number || ''}
                            readOnly
                            disabled
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CR Number <span className="text-gray-500 text-xs">(Read-only)</span>
                        </label>
                        <input
                            type="text"
                            name="cr_number"
                            value={formData.cr_number || ''}
                            readOnly
                            disabled
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Legal & Registration */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Legal & Registration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Legal Form</label>
                        <input
                            type="text"
                            name="legal_form"
                            value={formData.legal_form || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                        <input
                            type="date"
                            name="issue_date_gregorian"
                            value={formData.issue_date_gregorian || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Date</label>
                        <input
                            type="date"
                            name="confirmation_date_gregorian"
                            value={formData.confirmation_date_gregorian || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Location Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Location Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Business Activities */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Business Activities</h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activities</label>
                    <textarea
                        name="activities"
                        value={Array.isArray(formData.activities) ? formData.activities.join(', ') : (formData.activities || '')}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter business activities separated by commas"
                    />
                </div>
            </div>

            {/* Capital Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Capital Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CR Capital</label>
                        <input
                            type="number"
                            name="cr_capital"
                            value={formData.cr_capital || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                            step="0.01"
                            min="0"
                        />
                    </div>
                </div>
            </div>

            {/* E-commerce Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">E-commerce Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="has_ecommerce"
                            checked={formData.has_ecommerce || false}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Has E-commerce</label>
                    </div>
                    {formData.has_ecommerce && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                            <input
                                type="url"
                                name="store_url"
                                value={formData.store_url || ''}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Management Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Management Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Management Structure</label>
                        <input
                            type="text"
                            name="management_structure"
                            value={formData.management_structure || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Managers</label>
                        <textarea
                            name="management_managers"
                            value={Array.isArray(formData.management_managers) ? formData.management_managers.join(', ') : (formData.management_managers || '')}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter manager names separated by commas"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBankUserForm = () => (
        <div className="space-y-6">
            {/* Bank Information */}
            <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Bank Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                        <input
                            type="text"
                            name="entity_name"
                            value={formData.entity_name || ''}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                        <div className="space-y-4">
                            {/* Current Logo Display */}
                            {(formData.logo_url || logoPreview) && (
                                <div className="text-center">
                                    <img
                                        src={logoPreview || formData.logo_url}
                                        alt="Current Bank Logo"
                                        className="mx-auto h-24 w-24 object-contain rounded-lg border border-gray-200"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div className="hidden mx-auto h-24 w-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400 text-sm">Logo</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* File Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo File</label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {logoFile && (
                                        <button
                                            type="button"
                                            onClick={removeLogoFile}
                                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload a logo image file (PNG, JPG, JPEG, GIF)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEmployeeForm = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                        type="text"
                        name="position"
                        value={formData.position || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

            </div>

        </div>
    );

    if (!isOpen || !user) return null;

    const getUserTypeDisplay = () => {
        switch (user.userType) {
            case 'business': return 'Business User';
            case 'bank': return 'Bank User';
            case 'employee': return 'Bank Employee';
            default: return 'User';
        }
    };

    const renderForm = () => {
        switch (user.userType) {
            case 'business':
                return renderBusinessUserForm();
            case 'bank':
                return renderBankUserForm();
            case 'employee':
                return renderEmployeeForm();
            default:
                return <div>Unknown user type</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Edit {getUserTypeDisplay()}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-4">
                        {renderForm()}

                        {/* Footer */}
                        <div className="mt-6 flex justify-end space-x-3">
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
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
