import React, { useState } from 'react';
import PasswordField from './PasswordField';

const UserCreationForm = () => {
    const [formData, setFormData] = useState({
        userType: 'business',
        email: '',
        password: '',
        entityName: '',
        firstName: '',
        lastName: '',
        registrationStatus: 'active'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        setFormData(prev => ({
            ...prev,
            password: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_type: formData.userType,
                    email: formData.email,
                    password: formData.password,
                    entity_name: formData.entityName,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    registration_status: formData.registrationStatus
                })
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`✅ User created successfully! User ID: ${result.data.user_id}`);
                // Reset form
                setFormData({
                    userType: 'business',
                    email: '',
                    password: '',
                    entityName: '',
                    firstName: '',
                    lastName: '',
                    registrationStatus: 'active'
                });
            } else {
                setMessage(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Network error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New User</h2>
            
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                    message.includes('✅') 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Type *
                    </label>
                    <select
                        name="userType"
                        value={formData.userType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="business">Business User</option>
                        <option value="individual">Individual User</option>
                        <option value="bank">Bank User</option>
                    </select>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="user@example.com"
                        required
                    />
                </div>

                {/* Password Field with OS Suggestion */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <PasswordField
                        value={formData.password}
                        onChange={handlePasswordChange}
                        placeholder="Enter a secure password"
                        required
                        autoComplete="new-password"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        💡 Focus on this field to trigger your browser's password suggestion feature
                    </p>
                </div>

                {/* Entity Name (for business and bank users) */}
                {(formData.userType === 'business' || formData.userType === 'bank') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Entity Name *
                        </label>
                        <input
                            type="text"
                            name="entityName"
                            value={formData.entityName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Company or Bank Name"
                            required
                        />
                    </div>
                )}

                {/* First Name and Last Name (for individual users) */}
                {formData.userType === 'individual' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Registration Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Status
                    </label>
                    <select
                        name="registrationStatus"
                        value={formData.registrationStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`
                            px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            transition-colors duration-200
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isLoading ? 'Creating User...' : 'Create User'}
                    </button>
                </div>
            </form>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">How to use OS Password Suggestion:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Click on the password field to focus it</li>
                    <li>• Your browser should show a password suggestion (key icon)</li>
                    <li>• Click the suggestion to use the generated password</li>
                    <li>• Or click the generate button (⚙️) to trigger the suggestion</li>
                    <li>• The password strength indicator will show the security level</li>
                </ul>
            </div>
        </div>
    );
};

export default UserCreationForm;
