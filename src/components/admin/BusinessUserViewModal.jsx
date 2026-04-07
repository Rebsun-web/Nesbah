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
            const response = await fetch(`/api/admin/users/business/${user.user_id}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) setDetailedUser(result.data);
                else setDetailedUser(null);
            } else {
                setDetailedUser(null);
            }
        } catch {
            setDetailedUser(null);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    const d = detailedUser;

    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const formatMoney = (amount) => {
        if (!amount) return null;
        return `SAR ${parseFloat(amount).toLocaleString()}`;
    };

    const Field = ({ label, value }) => {
        if (!value) return null;
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <p className="text-sm text-gray-900">{value}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">Business User Details</h3>
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                            )}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide text-gray-500">Business</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="Email" value={d?.email || user?.email} />
                                <Field label="Trade Name" value={d?.trade_name || user?.trade_name} />
                                <Field label="CR National Number" value={d?.cr_national_number || user?.cr_national_number} />
                                <Field label="CR Number" value={d?.cr_number || user?.cr_number} />
                                <Field label="City" value={d?.city || d?.headquarter_city_name || user?.city} />
                            </div>
                        </div>

                        {/* Application Info */}
                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Application</h4>
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading...</p>
                            ) : d?.application_id ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {d.application_contact_person && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Contact Person</label>
                                                <p className="text-sm text-gray-900">{d.application_contact_person}</p>
                                            </div>
                                        )}
                                        {d.application_contact_phone && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Phone</label>
                                                <p className="text-sm text-gray-900">{d.application_contact_phone}</p>
                                            </div>
                                        )}
                                        {d.application_contact_email && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Email</label>
                                                <p className="text-sm text-gray-900">{d.application_contact_email}</p>
                                            </div>
                                        )}
                                        {d.financing_type && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Financing Type</label>
                                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full capitalize">
                                                    {d.financing_type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        )}
                                        {d.city_of_operation && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">City of Operation</label>
                                                <p className="text-sm text-gray-900">{d.city_of_operation}</p>
                                            </div>
                                        )}
                                        {d.approximate_financing_amount && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Approximate Amount</label>
                                                <p className="text-sm text-gray-900">{d.approximate_financing_amount}</p>
                                            </div>
                                        )}
                                        {d.application_submitted_at && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600">Submitted</label>
                                                <p className="text-sm text-gray-900">{formatDate(d.application_submitted_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                    {d.calculated_application_status && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                                            <span className="text-xs text-gray-600">Status:</span>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                d.calculated_application_status === 'live_auction' ? 'bg-green-100 text-green-800' :
                                                d.calculated_application_status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                d.calculated_application_status === 'ignored' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {d.calculated_application_status}
                                            </span>
                                            {d.offers_count !== null && (
                                                <span className="text-xs text-gray-500">• {d.offers_count} offer{d.offers_count !== 1 ? 's' : ''}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : d ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                    <p className="text-sm text-gray-600">No application submitted yet</p>
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm text-red-600">Error loading user details</p>
                                </div>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-6 text-xs text-gray-500">
                                {(d?.is_verified ?? user?.is_verified) !== undefined && (
                                    <span>{(d?.is_verified ?? user?.is_verified) ? '✓ Verified' : 'Not verified'}</span>
                                )}
                                {formatDate(d?.created_at || user?.created_at) && (
                                    <span>Joined {formatDate(d?.created_at || user?.created_at)}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
