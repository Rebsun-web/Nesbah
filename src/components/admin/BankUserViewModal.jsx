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
            const response = await fetch(`/api/admin/users/${user.user_id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setDetailedUser(result.data);
                } else {
                    console.error('API returned error:', result.error);
                }
            } else {
                console.error('HTTP error:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching detailed user info:', error);
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
                            Bank User Details
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
                            {/* Bank Logo */}
                            <div className="text-center">
                                {detailedUser.logo_url ? (
                                    <img
                                        src={detailedUser.logo_url}
                                        alt={`${detailedUser.entity_name || 'Bank'} Logo`}
                                        className="mx-auto h-24 w-24 object-contain rounded-lg border border-gray-200"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                {(!detailedUser.logo_url || detailedUser.logo_url === '') && (
                                    <div className="mx-auto h-24 w-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                        <PhotoIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Bank Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Bank Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start">
                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                            <p className="text-sm text-gray-900">{detailedUser.entity_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="text-sm text-gray-900">{detailedUser.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            {(detailedUser.contact_person || detailedUser.contact_person_number) && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Contact Information</h4>
                                    <div className="space-y-3">
                                        {detailedUser.contact_person && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                                <p className="text-sm text-gray-900">{detailedUser.contact_person}</p>
                                            </div>
                                        )}
                                        {detailedUser.contact_person_number && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                                <p className="text-sm text-gray-900">{detailedUser.contact_person_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Account Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Account Information</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">User ID</label>
                                        <p className="text-sm text-gray-900">{detailedUser.user_id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Account Status</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            detailedUser.account_status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : detailedUser.account_status === 'suspended'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {detailedUser.account_status || 'active'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Created</label>
                                        <p className="text-sm text-gray-900">{formatDate(detailedUser.created_at)}</p>
                                    </div>
                                    {detailedUser.updated_at && detailedUser.updated_at !== detailedUser.created_at && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                                            <p className="text-sm text-gray-900">{formatDate(detailedUser.updated_at)}</p>
                                        </div>
                                    )}
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
