'use client'

import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, BuildingOfficeIcon, MapPinIcon, CalendarIcon, UserIcon, PhoneIcon, EnvelopeIcon, CreditCardIcon, UsersIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function CreateBusinessUserForm({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState('cr-validation'); // 'cr-validation', 'user-details', 'review'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // CR Validation states
    const [crNumber, setCrNumber] = useState('');
    const [crValidationStatus, setCrValidationStatus] = useState('pending'); // 'pending', 'validating', 'valid', 'invalid'
    const [wathiqData, setWathiqData] = useState(null);
    
    // User details form
    const [userDetails, setUserDetails] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    // Form validation
    const [validationErrors, setValidationErrors] = useState({});

    // CR Number validation
    const validateCRNumber = (crNumber) => {
        const crRegex = /^\d{10}$/;
        return crRegex.test(crNumber);
    };

    // Handle CR number input change
    const handleCRNumberChange = (e) => {
        const value = e.target.value;
        setCrNumber(value);
        
        // Clear validation status when user types
        if (crValidationStatus !== 'pending') {
            setCrValidationStatus('pending');
        }
        
        // Clear error when user starts typing
        if (error) {
            setError('');
        }
    };

    // Validate CR number via Wathiq API
    const validateCRNumberWithWathiq = async () => {
        if (!validateCRNumber(crNumber)) {
            setError('Please enter a valid 10-digit CR number');
            return;
        }

        setLoading(true);
        setError('');
        setCrValidationStatus('validating');

        try {
            const response = await fetch('/api/users/register/business_users/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cr_national_number: crNumber })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setWathiqData(data.data);
                setCrValidationStatus('valid');
                setStep('user-details');
                console.log('✅ Wathiq data extracted:', data.data);
            } else {
                setCrValidationStatus('invalid');
                if (response.status === 409) {
                    setError('This CR number is already registered. Please use a different CR number.');
                } else {
                    setError(data.error || 'Failed to validate CR number');
                }
            }
        } catch (error) {
            console.error('Error validating CR number:', error);
            setCrValidationStatus('invalid');
            setError('Network error while validating CR number');
        } finally {
            setLoading(false);
        }
    };

    // Handle user details form submission
    const handleUserDetailsSubmit = (e) => {
        e.preventDefault();
        
        // Validate form
        const errors = {};
        if (!userDetails.email) errors.email = 'Email is required';
        if (!userDetails.password) errors.password = 'Password is required';
        if (userDetails.password !== userDetails.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        
        setStep('review');
    };

    // Create business user
    const createBusinessUser = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users/create-business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    cr_national_number: crNumber,
                    email: userDetails.email,
                    password: userDetails.password,
                    fetch_from_wathiq: true
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onSuccess(data.data);
                onClose();
            } else {
                setError(data.error || 'Failed to create business user');
            }
        } catch (error) {
            console.error('Error creating business user:', error);
            setError('Network error while creating business user');
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setStep('cr-validation');
        setCrNumber('');
        setCrValidationStatus('pending');
        setWathiqData(null);
        setUserDetails({ email: '', password: '', confirmPassword: '' });
        setValidationErrors({});
        setError('');
    };

    // Handle close
    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Create New Business User
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-6 mt-4">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center ${step === 'cr-validation' ? 'text-blue-600' : step === 'user-details' ? 'text-green-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'cr-validation' ? 'border-blue-600 bg-blue-600 text-white' : step === 'user-details' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-gray-300 text-gray-600'}`}>
                                    1
                                </div>
                                <span className="ml-2 text-sm font-medium">CR Validation</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className={`flex items-center ${step === 'user-details' ? 'text-blue-600' : step === 'review' ? 'text-green-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'user-details' ? 'border-blue-600 bg-blue-600 text-white' : step === 'review' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-gray-300 text-gray-600'}`}>
                                    2
                                </div>
                                <span className="ml-2 text-sm font-medium">User Details</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className={`flex items-center ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'review' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-gray-300 text-gray-600'}`}>
                                    3
                                </div>
                                <span className="ml-2 text-sm font-medium">Review & Create</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: CR Validation */}
                    {step === 'cr-validation' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-blue-600" />
                                <h4 className="mt-2 text-lg font-medium text-gray-900">Validate Business Registration</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Enter the 10-digit CR number to automatically extract business information from Wathiq API
                                </p>
                            </div>

                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CR National Number *
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={crNumber}
                                        onChange={handleCRNumberChange}
                                        placeholder="1234567890"
                                        maxLength={10}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={validateCRNumberWithWathiq}
                                        disabled={loading || !crNumber || !validateCRNumber(crNumber)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Validating...' : 'Validate'}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter exactly 10 digits (e.g., 1234567890)
                                </p>
                            </div>

                            {/* Validation Status */}
                            {crValidationStatus === 'validating' && (
                                <div className="text-center">
                                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-sm text-blue-700">Validating CR number...</span>
                                    </div>
                                </div>
                            )}

                            {crValidationStatus === 'valid' && wathiqData && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                        <div className="flex">
                                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                            <div className="ml-3">
                                                <h5 className="text-sm font-medium text-green-800">CR Number Validated Successfully!</h5>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Business data extracted from Wathiq API
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Extracted Data Preview */}
                                    <div className="mt-4 bg-gray-50 rounded-md p-4">
                                        <h6 className="text-sm font-medium text-gray-900 mb-3">Extracted Business Information:</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Business Name:</span>
                                                <p className="text-gray-900">{wathiqData.trade_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">CR Number:</span>
                                                <p className="text-gray-900">{wathiqData.cr_number || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Legal Form:</span>
                                                <p className="text-gray-900">{wathiqData.legal_form || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">City:</span>
                                                <p className="text-gray-900">{wathiqData.city || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Status:</span>
                                                <p className="text-gray-900">{wathiqData.registration_status || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">CR Capital:</span>
                                                <p className="text-gray-900">
                                                    {wathiqData.cr_capital ? `SAR ${wathiqData.cr_capital.toLocaleString()}` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: User Details */}
                    {step === 'user-details' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <UserIcon className="mx-auto h-12 w-12 text-blue-600" />
                                <h4 className="mt-2 text-lg font-medium text-gray-900">Create User Account</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Set up the email and password for the business user account
                                </p>
                            </div>

                            <form onSubmit={handleUserDetailsSubmit} className="max-w-md mx-auto space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={userDetails.email}
                                        onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="business@example.com"
                                    />
                                    {validationErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={userDetails.password}
                                        onChange={(e) => setUserDetails(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter password"
                                    />
                                    {validationErrors.password && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        value={userDetails.confirmPassword}
                                        onChange={(e) => setUserDetails(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Confirm password"
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Continue to Review
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Review & Create */}
                    {step === 'review' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                                <h4 className="mt-2 text-lg font-medium text-gray-900">Review & Create Business User</h4>
                                <p className="mt-1 text-sm text-gray-500">
                                    Review the information before creating the business user account
                                </p>
                            </div>

                            {/* Business Information Review */}
                            <div className="bg-gray-50 rounded-md p-6">
                                <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                                    Business Information (from Wathiq)
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">CR National Number:</span>
                                        <p className="text-gray-900">{crNumber}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">CR Number:</span>
                                        <p className="text-gray-900">{wathiqData?.cr_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Business Name:</span>
                                        <p className="text-gray-900">{wathiqData?.trade_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Legal Form:</span>
                                        <p className="text-gray-900">{wathiqData?.legal_form || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Registration Status:</span>
                                        <p className="text-gray-900">{wathiqData?.registration_status || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">City:</span>
                                        <p className="text-gray-900">{wathiqData?.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Issue Date:</span>
                                        <p className="text-gray-900">{wathiqData?.issue_date_gregorian || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Confirmation Date:</span>
                                        <p className="text-gray-900">{wathiqData?.confirmation_date_gregorian || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">CR Capital:</span>
                                        <p className="text-gray-900">
                                            {wathiqData?.cr_capital ? `SAR ${wathiqData.cr_capital.toLocaleString()}` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Cash Capital:</span>
                                        <p className="text-gray-900">
                                            {wathiqData?.cash_capital ? `SAR ${wathiqData.cash_capital.toLocaleString()}` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Management Structure:</span>
                                        <p className="text-gray-900">{wathiqData?.management_structure || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">E-commerce:</span>
                                        <p className="text-gray-900">{wathiqData?.has_ecommerce ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {wathiqData?.contact_info && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h6 className="font-medium text-gray-700 mb-2">Contact Information:</h6>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {wathiqData.contact_info.email && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Email:</span>
                                                    <p className="text-gray-900">{wathiqData.contact_info.email}</p>
                                                </div>
                                            )}
                                            {wathiqData.contact_info.phone && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Phone:</span>
                                                    <p className="text-gray-900">{wathiqData.contact_info.phone}</p>
                                                </div>
                                            )}
                                            {wathiqData.contact_info.mobile && (
                                                <div>
                                                    <span className="font-medium text-gray-700">Mobile:</span>
                                                    <p className="text-gray-900">{wathiqData.contact_info.mobile}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Business Activities */}
                                {wathiqData?.activities && wathiqData.activities.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h6 className="font-medium text-gray-700 mb-2">Business Activities:</h6>
                                        <div className="flex flex-wrap gap-2">
                                            {wathiqData.activities.map((activity, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {typeof activity === 'string' ? activity : activity.name || activity.activityName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Account Information */}
                            <div className="bg-gray-50 rounded-md p-6">
                                <h5 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <UserIcon className="h-5 w-5 mr-2" />
                                    User Account Information
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Email:</span>
                                        <p className="text-gray-900">{userDetails.email}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Password:</span>
                                        <p className="text-gray-900">••••••••</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'user-details') {
                                    setStep('cr-validation');
                                } else if (step === 'review') {
                                    setStep('user-details');
                                }
                            }}
                            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                step === 'cr-validation' ? 'invisible' : ''
                            }`}
                        >
                            Back
                        </button>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            
                            {step === 'review' && (
                                <button
                                    onClick={createBusinessUser}
                                    disabled={loading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Business User'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
