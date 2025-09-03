import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function BusinessUserViewModal({ user, isOpen, onClose }) {
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
            const response = await fetch(`/api/admin/users/business/${user.user_id}`);
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

    const formatAuctionEndTime = (endTime) => {
        if (!endTime) return 'N/A';
        try {
            const endDate = new Date(endTime);
            const now = new Date();
            const timeDiff = endDate - now;
            
            if (timeDiff <= 0) {
                return 'Auction ended';
            }
            
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            return `${hours}h ${minutes}m ${seconds}s remaining`;
        } catch {
            return endTime;
        }
    };

    const formatCapital = (amount) => {
        if (!amount) return 'N/A';
        return `SAR ${parseFloat(amount).toLocaleString()}`;
    };

    const formatArray = (array) => {
        if (!array) return 'N/A';
        if (Array.isArray(array)) {
            return array.join(', ');
        }
        return array;
    };

    const formatActivities = (activities) => {
        if (!activities) return 'N/A';
        
        // If it's a string, try to split by comma
        if (typeof activities === 'string') {
            const activityList = activities.split(',').map(activity => activity.trim());
            return activityList.map((activity, index) => (
                <div key={index} className="mb-1">
                    • {activity}
                </div>
            ));
        }
        
        // If it's an array, format each item
        if (Array.isArray(activities)) {
            return activities.map((activity, index) => (
                <div key={index} className="mb-1">
                    • {activity}
                </div>
            ));
        }
        
        return activities;
    };

    const formatContactInfo = (contactInfo) => {
        if (!contactInfo) return 'N/A';
        if (typeof contactInfo === 'string') {
            try {
                contactInfo = JSON.parse(contactInfo);
            } catch {
                return contactInfo;
            }
        }
        
        const parts = [];
        if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
        if (contactInfo.phone) parts.push(`Phone: ${contactInfo.phone}`);
        if (contactInfo.mobile) parts.push(`Mobile: ${contactInfo.mobile}`);
        if (contactInfo.website) parts.push(`Website: ${contactInfo.website}`);
        
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                                Business User Details
                            </h3>
                            {loading && (
                                <div className="flex items-center space-x-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-4 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trade Name</label>
                                    <p className="text-sm text-gray-900">{user.trade_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR National Number</label>
                                    <p className="text-sm text-gray-900">{user.cr_national_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                    <p className="text-sm text-gray-900">{user.cr_number || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Legal & Registration Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Legal & Registration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Legal Form</label>
                                    <p className="text-sm text-gray-900">{user.legal_form || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                    <p className="text-sm text-gray-900">{formatDate(user.issue_date_gregorian)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Confirmation Date</label>
                                    <p className="text-sm text-gray-900">{formatDate(user.confirmation_date_gregorian)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Location Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <p className="text-sm text-gray-900">{user.city || user.headquarter_city_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Business Activities */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Business Activities</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Activities</label>
                                    <div className="text-sm text-gray-900">
                                        {formatActivities(user.activities)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Capital Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Capital Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CR Capital</label>
                                    <p className="text-sm text-gray-900">{formatCapital(user.cr_capital)}</p>
                                </div>

                            </div>
                        </div>

                        {/* E-commerce Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">E-commerce Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Has E-commerce</label>
                                    <p className="text-sm text-gray-900">
                                        {user.has_ecommerce ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Management Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Management Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Management Structure</label>
                                    <p className="text-sm text-gray-900">{user.management_structure || 'N/A'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Managers</label>
                                    <p className="text-sm text-gray-900">{formatArray(user.management_managers)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Application Contact Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    {loading ? (
                                        <p className="text-sm text-gray-500">Loading application details...</p>
                                    ) : detailedUser?.application_id ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600">Contact Person</label>
                                                    <p className="text-sm text-gray-900">{detailedUser.application_contact_person || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600">Contact Phone</label>
                                                    <p className="text-sm text-gray-900">{detailedUser.application_contact_phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600">Contact Email</label>
                                                    <p className="text-sm text-gray-900">{detailedUser.application_contact_email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600">Application Date</label>
                                                    <p className="text-sm text-gray-900">{formatDate(detailedUser.application_submitted_at)}</p>
                                                </div>
                                            </div>
                                                                                            <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Current Status:</span>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            detailedUser.calculated_application_status === 'live_auction' ? 'bg-green-100 text-green-800' :
                                                            detailedUser.calculated_application_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                            detailedUser.calculated_application_status === 'ignored' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {detailedUser.calculated_application_status || 'N/A'}
                                                        </span>
                                                    </div>
                                                {detailedUser.auction_end_time && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Auction End:</span>
                                                        <span className="text-xs text-gray-900">{formatAuctionEndTime(detailedUser.auction_end_time)}</span>
                                                    </div>
                                                )}
                                                {detailedUser.offers_count !== null && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Offers Received:</span>
                                                        <span className="text-xs text-gray-900">{detailedUser.offers_count}</span>
                                                    </div>
                                                )}
                                                {detailedUser.status_was_corrected && (
                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                        <p className="text-xs text-green-700">
                                                            ✅ Status automatically corrected from {detailedUser.application_status} to {detailedUser.calculated_application_status}
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Reason: {detailedUser.status_correction_reason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : detailedUser ? (
                                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                            <p className="text-sm text-gray-600">No application submitted yet</p>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                            <p className="text-sm text-yellow-700">Unable to load application details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Verification Information */}
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Verification Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                                    <p className="text-sm text-gray-900">
                                        {user.is_verified ? 'Verified' : 'Not Verified'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Verification Date</label>
                                    <p className="text-sm text-gray-900">{formatDate(user.verification_date)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                                    <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                                    <p className="text-sm text-gray-900">{formatDate(user.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
