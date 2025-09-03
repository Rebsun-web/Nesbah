import React, { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, UserIcon, PhoneIcon, BriefcaseIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function CreateBankEmployeeForm({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        position: '',
        phone: '',
        bank_user_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [banks, setBanks] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    
    // Bank search state
    const [bankSearchTerm, setBankSearchTerm] = useState('');
    const [showBankDropdown, setShowBankDropdown] = useState(false);

    // Fetch available banks when component mounts
    useEffect(() => {
        if (isOpen) {
            fetchBanks();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showBankDropdown && !event.target.closest('.bank-dropdown-container')) {
                setShowBankDropdown(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showBankDropdown]);

    // Filter banks based on search term
    const filteredBanks = banks.filter(bank => {
        const searchTerm = bankSearchTerm.toLowerCase().trim();
        if (!searchTerm) return false;
        
        const bankName = (bank.entity_name || '').toLowerCase();
        const bankEmail = (bank.email || '').toLowerCase();
        
        const matches = bankName.includes(searchTerm) || bankEmail.includes(searchTerm);
        
        // Debug logging
        if (bankSearchTerm.trim()) {
            console.log(`🔍 Bank search: "${bankSearchTerm}" -> "${bankName}" (${bankEmail}) - Match: ${matches}`);
        }
        
        return matches;
    }).slice(0, 10); // Limit to 10 results for better UX
    
    console.log(`🏦 Available banks: ${banks.length}, Search term: "${bankSearchTerm}", Filtered: ${filteredBanks.length}`);

    const fetchBanks = async () => {
        try {
            const response = await fetch('/api/admin/users/bank-users', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setBanks(data.banks || []);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBankSelect = (bank) => {
        console.log('🎯 handleBankSelect called with bank:', bank);
        console.log('🎯 Setting bank_user_id to:', bank.user_id);
        console.log('🎯 Setting bankSearchTerm to:', bank.entity_name);
        
        setFormData(prev => ({ ...prev, bank_user_id: bank.user_id }));
        setBankSearchTerm(bank.entity_name || bank.email);
        setShowBankDropdown(false);
        
        console.log('🎯 Bank selection completed');
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/users/create-bank-employee', {
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
                setError(data.error || 'Failed to create bank employee');
            }
        } catch (error) {
            console.error('Error creating bank employee:', error);
            setError(error.message || 'Network error while creating bank employee');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            position: '',
            phone: '',
            bank_user_id: ''
        });
        setError('');
        setShowPassword(false);
        setBankSearchTerm('');
        setShowBankDropdown(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Create Bank Employee</h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bank Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bank *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={bankSearchTerm}
                                    onChange={(e) => {
                                        setBankSearchTerm(e.target.value);
                                        setShowBankDropdown(true);
                                    }}
                                    onFocus={() => setShowBankDropdown(true)}
                                    placeholder={formData.bank_user_id ? "Bank selected" : "Search bank by name or email..."}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        !formData.bank_user_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                    readOnly={!!formData.bank_user_id}
                                />
                                {formData.bank_user_id ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, bank_user_id: '' }));
                                            setBankSearchTerm('');
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600"
                                        title="Clear bank selection"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                ) : (
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                )}
                                
                                {/* Bank Dropdown */}
                                {showBankDropdown && (
                                    <div 
                                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto bank-dropdown-container"
                                    >
                                        {filteredBanks.length > 0 ? (
                                            filteredBanks.map((bank) => (
                                                <div
                                                    key={bank.user_id}
                                                    onClick={() => handleBankSelect(bank)}
                                                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{bank.entity_name || 'Unnamed Bank'}</div>
                                                            <div className="text-sm text-gray-600">{bank.email}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                                    <span>No banks found matching "{bankSearchTerm}"</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {formData.bank_user_id && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-green-800 font-medium">
                                            Bank selected: {banks.find(b => b.user_id === formData.bank_user_id)?.entity_name || 'Unknown Bank'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                The employee will inherit this bank's logo and access permissions
                            </p>
                            {!formData.bank_user_id && (
                                <p className="mt-1 text-sm text-red-600">Bank selection is required</p>
                            )}
                        </div>

                        {/* Employee Information */}
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Email */}
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
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    minLength={8}
                                    className="w-full border border-gray-300 rounded-md pl-10 pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter password"
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div className="absolute right-2 top-1 flex space-x-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Password must be at least 8 characters long. Use the Generate button for a secure password.
                            </p>
                        </div>

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
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
