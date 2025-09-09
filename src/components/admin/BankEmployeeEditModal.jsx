import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, BuildingOfficeIcon, PhoneIcon, BriefcaseIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function BankEmployeeEditModal({ user, isOpen, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        position: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detailedUser, setDetailedUser] = useState(null);

    useEffect(() => {
        if (user && isOpen) {
            // Initialize form data
            setFormData({
                email: user.email || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                position: user.position || '',
                phone: user.phone || ''
            });
            
            // Fetch detailed user info if needed
            if (user.employee_id) {
                fetchDetailedUserInfo();
            }
        }
    }, [user, isOpen]);

    const fetchDetailedUserInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${user.employee_id}?user_type=employee`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setDetailedUser(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching detailed user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Clean form data - remove empty strings
            const cleanFormData = Object.fromEntries(
                Object.entries(formData).filter(([_, value]) => value !== '')
            );

            await onUpdate(cleanFormData);
            onClose();
        } catch (error) {
            console.error('Error updating bank employee:', error);
            setError('Failed to update bank employee');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Edit Bank Employee
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Employee Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                Employee Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter first name"
                                        />
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter last name"
                                        />
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="employee@bank.com"
                                        />
                                        <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Position
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Relationship Manager"
                                        />
                                        <BriefcaseIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="+966 50 123 4567"
                                        />
                                        <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bank Information - Read Only */}
                        {detailedUser && (
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Bank Information (Read Only)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                        <p className="text-sm text-gray-900 mt-1">{detailedUser.bank_entity_name || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bank Logo</label>
                                        {detailedUser.bank_logo_url ? (
                                            <div className="mt-1">
                                                <img 
                                                    src={detailedUser.bank_logo_url} 
                                                    alt="Bank Logo" 
                                                    className="h-12 w-12 rounded object-cover border border-gray-200"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-1">No logo available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Information - Read Only */}
                        {detailedUser && (
                            <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Account Information (Read Only)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                                        <p className="text-sm text-gray-900 font-mono mt-1">{detailedUser.employee_id || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Last Login</label>
                                        <p className="text-sm text-gray-900 mt-1 flex items-center">
                                            <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                            {formatDate(detailedUser.last_login_at)}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Created At</label>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {detailedUser.created_at ? new Date(detailedUser.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <div className="flex">
                                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4">
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
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Update Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
