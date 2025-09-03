import React, { useState } from 'react';
import { XMarkIcon, BuildingOfficeIcon, EnvelopeIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function CreateBankUserForm({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        email: '',
        entity_name: '',
        password: '',
        logo_url: '',
        contact_person: '',
        contact_person_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

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
        setLoading(true);
        setError('');

        try {
            // Handle logo file upload if present
            if (logoFile) {
                console.log('🔄 Starting logo upload for file:', logoFile.name, logoFile.size);
                try {
                    const uploadFormData = new FormData();
                    uploadFormData.append('logo', logoFile);
                    
                    console.log('🔄 Sending logo upload request to /api/upload/bank-logo');
                    const uploadResponse = await fetch('/api/upload/bank-logo', {
                        method: 'POST',
                        body: uploadFormData
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
                        formData.logo_url = uploadResult.logo_url;
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
            email: '',
            entity_name: '',
            password: '',
            logo_url: '',
            contact_person: '',
            contact_person_number: ''
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
                            Create New Bank User
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="bank@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                                    <input
                                        type="text"
                                        name="entity_name"
                                        value={formData.entity_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Bank Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required
                                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const generatedPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    password: generatedPassword
                                                }));
                                            }}
                                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                            title="Generate random password"
                                        >
                                            🔑
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Password must be at least 8 characters long
                                    </p>
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
                                {loading ? 'Creating...' : 'Create Bank User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
