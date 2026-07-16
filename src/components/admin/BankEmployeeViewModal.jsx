import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, BuildingOfficeIcon, PhoneIcon, BriefcaseIcon, EnvelopeIcon, ClockIcon, KeyIcon } from '@heroicons/react/24/outline';

export default function BankEmployeeViewModal({ user, isOpen, onClose }) {
    const [detailedUser, setDetailedUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // "Set & reveal" password state. Passwords are one-way hashed and cannot be
    // read back, so recovering a forgotten login means setting it to a known
    // value and showing that value once.
    const [pwInput, setPwInput] = useState('');
    const [settingPw, setSettingPw] = useState(false);
    const [revealedPw, setRevealedPw] = useState('');
    const [pwError, setPwError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && user?.employee_id) {
            fetchDetailedUserInfo();
            // Reset credential UI whenever a new employee is opened.
            setPwInput('');
            setRevealedPw('');
            setPwError('');
            setCopied(false);
        }
    }, [isOpen, user?.employee_id]);

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
                } else {
                    setDetailedUser(null);
                }
            } else {
                setDetailedUser(null);
            }
        } catch (error) {
            console.error('Error fetching detailed bank employee info:', error);
            setDetailedUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Set the employee's password to a known value (typed, or auto-generated when
    // blank) and reveal it. Uses the existing reset endpoint, which returns the
    // plaintext it just hashed. The employee can log in immediately with it.
    const handleSetAndReveal = async () => {
        if (!detailedUser?.user_id) return;
        const trimmed = pwInput.trim();
        if (trimmed && trimmed.length < 8) {
            setPwError('Password must be at least 8 characters long');
            return;
        }
        setSettingPw(true);
        setPwError('');
        setRevealedPw('');
        setCopied(false);
        try {
            const response = await fetch('/api/admin/users/reset-bank-employee-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                // Blank input → server generates a secure password.
                body: JSON.stringify(trimmed ? { user_id: detailedUser.user_id, custom_password: trimmed } : { user_id: detailedUser.user_id })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setRevealedPw(data.password);
                setPwInput('');
            } else {
                setPwError(data.error || 'Failed to set password');
            }
        } catch (error) {
            setPwError('Network error while setting password');
        } finally {
            setSettingPw(false);
        }
    };

    const copyRevealed = async () => {
        try {
            await navigator.clipboard.writeText(revealedPw);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard may be unavailable; the value is visible for manual copy.
        }
    };

    if (!isOpen || !user) return null;

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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
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

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Bank Employee Details
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
                            {/* Employee Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Employee Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                                            <p className="text-sm text-gray-900">{detailedUser.first_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                            <p className="text-sm text-gray-900">{detailedUser.last_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                {detailedUser.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Position</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                {detailedUser.position || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                {detailedUser.phone || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Last Login</label>
                                            <p className="text-sm text-gray-900 flex items-center">
                                                <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                {formatDate(detailedUser.last_login_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Information */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                                    Bank Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                            <p className="text-sm text-gray-900">{detailedUser.bank_entity_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Bank Logo</label>
                                            {detailedUser.bank_logo_url ? (
                                                <div className="mt-1">
                                                    <img 
                                                        src={detailedUser.bank_logo_url} 
                                                        alt="Bank Logo" 
                                                        className="h-12 w-12 rounded object-cover border border-gray-200"
                                                        onError={(e) => {
                                                            e.target.src = '/logo/blank_profile.png';
                                                            e.target.alt = 'Default Logo';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No logo available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-4">Account Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                                            <p className="text-sm text-gray-900 font-mono">{detailedUser.employee_id || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">User ID</label>
                                            <p className="text-sm text-gray-900 font-mono">{detailedUser.user_id || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700">Created At</label>
                                            <p className="text-sm text-gray-900">{formatDateTime(detailedUser.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Login Credentials */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                                    <KeyIcon className="h-5 w-5 mr-2 text-amber-600" />
                                    Login Credentials
                                </h4>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Login Email</label>
                                    <p className="text-sm text-gray-900 flex items-center">
                                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        {detailedUser.email || 'N/A'}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    Passwords are stored securely (hashed) and cannot be displayed. If the login
                                    is forgotten, set a known password below and reveal it — the employee can log
                                    in immediately with it. Leave blank to auto-generate a secure password.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <input
                                        type="text"
                                        value={pwInput}
                                        onChange={(e) => setPwInput(e.target.value)}
                                        placeholder="New password (min 8 chars) or leave blank to generate"
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSetAndReveal}
                                        disabled={settingPw}
                                        className="px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                                    >
                                        {settingPw ? 'Setting...' : 'Set & reveal'}
                                    </button>
                                </div>
                                {pwError && (
                                    <p className="mt-2 text-sm text-red-600">{pwError}</p>
                                )}
                                {revealedPw && (
                                    <div className="mt-3 p-3 bg-white border border-amber-300 rounded-md">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Current password</label>
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-sm text-gray-900 break-all">{revealedPw}</code>
                                            <button
                                                type="button"
                                                onClick={copyRevealed}
                                                className="shrink-0 px-2 py-1 text-xs font-medium text-amber-700 border border-amber-300 rounded hover:bg-amber-50"
                                            >
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Share this securely with the employee. It won&apos;t be shown again after you close this modal.
                                        </p>
                                    </div>
                                )}
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
