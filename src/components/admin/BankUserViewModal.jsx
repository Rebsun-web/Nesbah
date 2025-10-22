import React, { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, EnvelopeIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function BankUserViewModal({ user, isOpen, onClose }) {
    const [detailedUser, setDetailedUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user?.user_id) {
            fetchDetailedUserInfo();
        }
    }, [isOpen, user?.user_id]);

    const fetchDetailedUserInfo = async () => {
        setLoading(true);
        try {
            console.log(`🔍 Fetching detailed user info for ID: ${user.user_id}, type: ${user.userType}`);
            const userType = user.userType === 'employee' ? 'employee' : 'bank';
            const response = await fetch(`/api/admin/users/${user.user_id}?user_type=${userType}`, {
                credentials: 'include'
            });
            
            console.log(`🔍 Response status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`🔍 API response:`, result);
                if (result.success) {
                    setDetailedUser(result.data);
                } else {
                    console.error('API returned error:', result.error);
                    setDetailedUser(null);
                }
            } else {
                const errorText = await response.text();
                console.error('HTTP error:', response.status, response.statusText, errorText);
                setDetailedUser(null);
            }
        } catch (error) {
            console.error('Error fetching detailed user info:', error);
            setDetailedUser(null);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            {user.userType === 'employee' ? 'Bank Employee Details' : 'Bank User Details'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading...</span>
                        </div>
                    ) : detailedUser ? (
                        <div className="mt-4 space-y-6">
                            {/* Bank Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="text-sm text-gray-900">{detailedUser.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                            <p className="text-sm text-gray-900">{detailedUser.entity_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                        <p className="text-sm text-gray-900">{detailedUser.contact_person || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                        <p className="text-sm text-gray-900">{detailedUser.contact_person_number || 'N/A'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                                        <p className="text-sm text-gray-900">
                                            {detailedUser.credit_limit ? 
                                                `SAR ${parseFloat(detailedUser.credit_limit).toLocaleString()}` : 
                                                'N/A'
                                            }
                                        </p>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Logo</label>
                                        {detailedUser.logo_url ? (
                                            <div className="mt-2">
                                                <img 
                                                    src={detailedUser.logo_url} 
                                                    alt="Bank Logo" 
                                                    className="h-16 w-16 rounded object-cover border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.src = '/logo/blank_profile.png';
                                                        e.target.alt = 'Default Logo';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No logo uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 text-center py-8">
                            <div className="text-gray-500">
                                <p>No detailed information available</p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
