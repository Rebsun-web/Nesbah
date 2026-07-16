import React, { useState } from 'react';
import { XMarkIcon, BuildingOfficeIcon, EnvelopeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { collectErrors, checkRequired, checkNumber, checkSaudiMobile } from '@/lib/validators';

export default function CreateBankUserForm({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        entity_name: '',
        logo_url: '',
        contact_person: '',
        contact_person_number: '',
        credit_limit: 10000
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const validateForm = () => collectErrors({
        entity_name: () => checkRequired(formData.entity_name, 'Bank name'),
        credit_limit: () => checkNumber(formData.credit_limit, { min: 0, required: false, label: 'Credit limit' }),
        contact_person_number: () => (formData.contact_person_number
            ? checkSaudiMobile(formData.contact_person_number, { label: 'Contact number' })
            : null),
    });

    const handleFieldBlur = (field) => {
        const { errors } = validateForm();
        setFieldErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        setFormData(prev => ({
            ...prev,
            logo_url: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { valid, errors, firstError } = validateForm();
        if (!valid) {
            setFieldErrors(errors);
            setError(firstError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Handle logo file upload if present. Use the admin GCS-backed endpoint so
            // the logo is stored durably (Cloud Storage) rather than on the container's
            // ephemeral local disk (which is wiped on restart — the old cause of
            // "logos don't display").
            if (logoFile) {
                try {
                    const uploadFormData = new FormData();
                    uploadFormData.append('logo', logoFile);

                    const uploadResponse = await fetch('/api/admin/users/upload-bank-logo', {
                        method: 'POST',
                        credentials: 'include',
                        body: uploadFormData
                    });

                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
                    }

                    const uploadResult = await uploadResponse.json();

                    if (uploadResult.success) {
                        formData.logo_url = uploadResult.logo_url;
                    } else {
                        throw new Error(uploadResult.error || 'Logo upload failed');
                    }
                } catch (uploadError) {
                    throw new Error(`Logo upload failed: ${uploadError.message}`);
                }
            }

            const response = await fetch('/api/admin/users/create-bank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onSuccess(data.data);
                onClose();
            } else {
                setError(data.error || 'Failed to create bank user');
            }
        } catch (error) {
            console.error('Error creating bank user:', error);
            setError(error.message || 'Network error while creating bank user');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            entity_name: '',
            logo_url: '',
            contact_person: '',
            contact_person_number: '',
            credit_limit: 10000
        });
        setLogoFile(null);
        setLogoPreview(null);
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Create New Bank / Financing Partner
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        {/* Bank Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Bank Information</h4>
                            <p className="text-xs text-gray-500 mb-3">
                                A bank/financing partner is created as an entity. Login credentials are created
                                later by adding bank employees under this partner.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                                    <input
                                        type="text"
                                        name="entity_name"
                                        value={formData.entity_name}
                                        onChange={handleInputChange}
                                        onBlur={() => handleFieldBlur('entity_name')}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Bank Name"
                                    />
                                    {fieldErrors.entity_name && <p className="mt-1 text-sm text-red-600">{fieldErrors.entity_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (SAR)</label>
                                    <input
                                        type="number"
                                        name="credit_limit"
                                        value={formData.credit_limit}
                                        onChange={handleInputChange}
                                        onBlur={() => handleFieldBlur('credit_limit')}
                                        min="0"
                                        step="1000"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="10000"
                                    />
                                    {fieldErrors.credit_limit && <p className="mt-1 text-sm text-red-600">{fieldErrors.credit_limit}</p>}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Default credit limit for this bank
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contact Person Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="tel"
                                        name="contact_person_number"
                                        value={formData.contact_person_number}
                                        onChange={handleInputChange}
                                        onBlur={() => handleFieldBlur('contact_person_number')}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="+966 50 123 4567"
                                    />
                                    {fieldErrors.contact_person_number && <p className="mt-1 text-sm text-red-600">{fieldErrors.contact_person_number}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Bank Logo Section */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Bank Logo</h4>
                            <div className="space-y-4">
                                {/* Logo Preview */}
                                {logoPreview && (
                                    <div className="text-center">
                                        <img
                                            src={logoPreview}
                                            alt="Bank Logo Preview"
                                            className="mx-auto h-24 w-24 object-contain rounded-lg border border-gray-200"
                                        />
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
                                        Upload a logo image file (PNG, JPG, JPEG, GIF). Optional.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Partner'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
