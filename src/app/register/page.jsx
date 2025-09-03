"use client";

import { Button } from '@/components/button';
import { GradientBackground } from '@/components/gradient';
import { Link } from '@/components/link';
import { Checkbox, Field, Input, Label } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/16/solid';
import { clsx } from 'clsx';
import React, { useState } from 'react';
import RegistrationModal from '@/components/RegistrationModal';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {Navbar} from "@/components/navbar";
import {Container} from "@/components/container";
import { BuildingOfficeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Register() {
    const { t } = useLanguage();
    const [userType, setUserType] = useState('business'); // Set to business by default
    const [showPassword, setShowPassword] = useState(false);
    const [cr_national_number, setCrNationalNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [modalMessage, setModalMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStep, setVerificationStep] = useState('initial'); // 'initial', 'verifying', 'verified', 'account_creation'
    const [verifiedData, setVerifiedData] = useState(null);
    
    // Field validation states
    const [fieldErrors, setFieldErrors] = useState({});
    const [phoneNumber, setPhoneNumber] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateCRNumber = (crNumber) => {
        const crRegex = /^\d{10}$/;
        return crRegex.test(crNumber);
    };

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^(\+966|966)?[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            errors: {
                length: !minLength ? 'Password must be at least 8 characters' : null,
                uppercase: !hasUpperCase ? 'Must contain uppercase letter' : null,
                lowercase: !hasLowerCase ? 'Must contain lowercase letter' : null,
                numbers: !hasNumbers ? 'Must contain number' : null,
                special: !hasSpecialChar ? 'Must contain special character' : null
            }
        };
    };

    const validateForm = () => {
        const errors = {};
        
        // Email validation
        if (!email || !validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        // CR Number validation for business
        if (!cr_national_number || !validateCRNumber(cr_national_number)) {
            errors.cr_national_number = 'Please enter a valid 10-digit CR number';
        }
        
        // Phone number validation
        if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
            errors.phoneNumber = 'Please enter a valid Saudi phone number (+966XXXXXXXXX)';
        }
        
        // Contact person validation
        if (!contactPerson.trim()) {
            errors.contactPerson = 'Contact person name is required';
        }
        
        // Password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.password = Object.values(passwordValidation.errors).filter(Boolean);
        }
        
        // Confirm password validation
        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        // Terms acceptance validation
        if (!termsAccepted) {
            errors.terms = 'You must accept the terms and conditions';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setVerificationStep('initial');
        setVerifiedData(null);
        // Reset form fields
        setCrNationalNumber('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setFieldErrors({});
        setPhoneNumber('');
        setContactPerson('');
        setTermsAccepted(false);
    };



    const handleVerifyAndContinue = async (e) => {
        e.preventDefault();
        
        // Only validate CR number for verification
        if (!cr_national_number || !validateCRNumber(cr_national_number)) {
            setFieldErrors({ cr_national_number: 'Please enter a valid 10-digit CR number' });
            return;
        }
        
        setIsLoading(true);

        try {
            const endpoint = '/api/users/register/business_users/verify';
            const payload = { cr_national_number };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setVerifiedData(data.data);
                setVerificationStep('account_creation');
            } else {
                let errorMsg = data.error || 'Verification failed';
                let isExistingAccount = false;
                
                // Handle specific error cases
                if (response.status === 409) {
                    isExistingAccount = true;
                    if (data.existingEmail) {
                        errorMsg = `This business is already registered with email: ${data.existingEmail}. Please log in with that account instead.`;
                    } else {
                        errorMsg = 'This business is already registered. Please log in with your existing account.';
                    }
                }
                
                setErrorMessage(errorMsg);
                setIsModalOpen(true);
                
                // If it's an existing account, also show a prominent banner
                if (isExistingAccount) {
                    setFieldErrors(prev => ({
                        ...prev,
                        cr_national_number: 'This CR number is already registered. Please enter new CR number or log in with your existing account.'
                    }));
                }
            }
        } catch (error) {
            console.error('Verification error:', error);
            setErrorMessage('Verification temporarily unavailable. Please try again.');
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalRegistration = async (e) => {
        e.preventDefault();
        
        // Validate account creation form
        const errors = {};
        
        if (!email || !validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            errors.password = 'Password is required';
        } else {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                errors.password = Object.values(passwordValidation.errors).filter(Boolean);
            }
        }
        
        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (!termsAccepted) {
            errors.terms = 'You must accept the terms and conditions';
        }
        
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = '/api/users/register/business_users/';
            const payload = {
                email,
                password,
                cr_national_number: verifiedData.cr_national_number,
                ...verifiedData
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Auto-login the user after successful registration
                try {
                    const loginResponse = await fetch('/api/users/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const loginData = await loginResponse.json();

                    if (loginResponse.ok && loginData.success) {
                        // Store user data in localStorage
                        localStorage.setItem('user', JSON.stringify(loginData.user));
                        
                        // Redirect to portal
                        window.location.href = '/portal';
                    } else {
                        // If auto-login fails, redirect to login page
                        setErrorMessage('Account created successfully! Please log in with your credentials.');
                        setIsModalOpen(true);
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    }
                } catch (loginError) {
                    console.error('Auto-login error:', loginError);
                    // If auto-login fails, redirect to login page
                    setErrorMessage('Account created successfully! Please log in with your credentials.');
                    setIsModalOpen(true);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            } else {
                setErrorMessage(data?.error || 'Account creation failed. Please try again.');
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage('Account creation failed. Please try again later.');
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        resetForm();
    };



    // Initial Verification Screen
    if (verificationStep === 'initial') {
        return (
            <main className="overflow-hidden bg-white">
                <Container className="relative">
                    <Navbar />
                </Container>
                <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                    <div className="w-full max-w-xl rounded-xl bg-white shadow-lg border border-gray-200">
                        <form onSubmit={handleVerifyAndContinue} className="p-3 sm:p-11">
                            <div className="flex items-center justify-center pb-6">
                                <h2 className="text-center text-lg font-semibold text-gray-900">
                                    Business Registration
                                </h2>
                            </div>

                            <Field className="mt-4 space-y-3">
                                <Label className="text-sm/5 font-medium text-gray-700">
                                    رقم السجل التجاري (CR National Number)
                                </Label>
                                <input
                                    type="text"
                                    value={cr_national_number}
                                    onChange={(e) => {
                                        setCrNationalNumber(e.target.value);
                                        if (fieldErrors.cr_national_number) {
                                            setFieldErrors(prev => ({ ...prev, cr_national_number: null }));
                                        }
                                    }}
                                    required
                                    placeholder="1010XXXXXX"
                                    className={`block w-full rounded-lg border px-4 py-2 shadow ${
                                        fieldErrors.cr_national_number ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                                    } focus:border-purple-500 focus:ring-purple-500`}
                                />
                                {fieldErrors.cr_national_number && (
                                    <p className={`text-sm flex items-center ${
                                        fieldErrors.cr_national_number.includes('already registered') 
                                            ? 'text-orange-600' 
                                            : 'text-red-500'
                                    }`}>
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                        {fieldErrors.cr_national_number}
                                    </p>
                                )}
                            </Field>
                            


                            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-800 text-center">
                                    We&apos;ll verify your business registration and retrieve details from Wathiq.
                                </p>
                            </div>

                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'VERIFYING...' : 'VERIFY BUSINESS'}
                                </button>
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-gray-500">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    // Account Creation Screen
    if (verificationStep === 'account_creation' && verifiedData) {
        return (
            <main className="overflow-hidden bg-white">
                <Container className="relative">
                    <Navbar />
                </Container>
                <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg border border-gray-200">
                        <form onSubmit={handleFinalRegistration} className="p-3 sm:p-11">
                            <div className="flex items-center justify-center pb-6">
                                <h2 className="text-center text-lg font-semibold text-gray-900">
                                    Create Your Account
                                </h2>
                            </div>

                            {/* Verification Success Banner */}
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-800">
                                        Business verified successfully via Wathiq
                                    </span>
                                </div>
                            </div>

                            {/* Business Information Display */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-md font-semibold mb-4 text-gray-900">Business Information from Wathiq</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                        <p className="text-sm text-gray-900 font-medium">{verifiedData.trade_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                        <p className="text-sm text-gray-900">{verifiedData.cr_number || verifiedData.cr_national_number}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Legal Form</label>
                                        <p className="text-sm text-gray-900">{verifiedData.legal_form || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <p className="text-sm text-green-600 font-medium">{verifiedData.registration_status || 'Active'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <p className="text-sm text-gray-900">{verifiedData.city || verifiedData.headquarter_city_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">CR Capital</label>
                                        <p className="text-sm text-gray-900">SAR {verifiedData.cr_capital?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                        <p className="text-sm text-gray-900">{verifiedData.issue_date_gregorian || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">E-commerce</label>
                                        <p className="text-sm text-gray-900">{verifiedData.has_ecommerce ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Creation Form */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-md font-semibold mb-4 text-gray-900">Account Details</h3>
                                <div className="space-y-4">
                                    <Field>
                                        <Label className="text-sm/5 font-medium text-gray-700">Email Address *</Label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (fieldErrors.email) {
                                                    setFieldErrors(prev => ({ ...prev, email: null }));
                                                }
                                            }}
                                            required
                                            placeholder="user@company.com"
                                            className={`block w-full rounded-lg border px-4 py-2 shadow mt-1 ${
                                                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                                            } focus:border-purple-500 focus:ring-purple-500`}
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                {fieldErrors.email}
                                            </p>
                                        )}
                                    </Field>
                                </div>
                            </div>

                            {/* Password Setup */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-md font-semibold mb-4 text-gray-900">Account Security</h3>
                                <div className="space-y-4">
                                    <Field className="relative">
                                        <Label className="text-sm/5 font-medium text-gray-700">Password</Label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (fieldErrors.password) {
                                                        setFieldErrors(prev => ({ ...prev, password: null }));
                                                    }
                                                    // Check if passwords match in real-time when password changes
                                                    if (confirmPassword && e.target.value && e.target.value !== confirmPassword) {
                                                        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                                                    } else if (confirmPassword && e.target.value && e.target.value === confirmPassword) {
                                                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                                                    }
                                                }}
                                                required
                                                placeholder="Create a strong password"
                                                className={`block w-full rounded-lg border px-4 py-2 pr-12 shadow mt-1 ${
                                                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                                                } focus:border-purple-500 focus:ring-purple-500`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 mt-1"
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="h-5 w-5" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        {fieldErrors.password && (
                                            <div className="mt-2">
                                                {Array.isArray(fieldErrors.password) ? (
                                                    fieldErrors.password.map((error, index) => (
                                                        <p key={index} className="text-sm text-red-500 flex items-center">
                                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                            {error}
                                                        </p>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-red-500 flex items-center">
                                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                        {fieldErrors.password}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </Field>

                                    <Field className="relative">
                                        <Label className="text-sm/5 font-medium text-gray-700">Confirm Password</Label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (fieldErrors.confirmPassword) {
                                                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                                                    }
                                                    // Check if passwords match in real-time
                                                    if (password && e.target.value && password !== e.target.value) {
                                                        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                                                    } else if (password && e.target.value && password === e.target.value) {
                                                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                                                    }
                                                }}
                                                required
                                                placeholder="Confirm your password"
                                                className={`block w-full rounded-lg border px-4 py-2 pr-12 shadow mt-1 ${
                                                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                } focus:border-purple-500 focus:ring-purple-500`}
                                            />
                                        </div>
                                        {fieldErrors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-500 flex items-center">
                                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                {fieldErrors.confirmPassword}
                                            </p>
                                        )}
                                        {password && confirmPassword && password === confirmPassword && !fieldErrors.confirmPassword && (
                                            <p className="mt-1 text-sm text-green-600 flex items-center">
                                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                Passwords match
                                            </p>
                                        )}
                                    </Field>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="mb-6">
                                <Field className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        name="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            if (fieldErrors.terms) {
                                                setFieldErrors(prev => ({ ...prev, terms: null }));
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                                        I agree to the{' '}
                                        <Link href="/terms" className="text-purple-600 hover:text-purple-800">
                                            Terms & Conditions
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="/privacy" className="text-purple-600 hover:text-purple-800">
                                            Privacy Policy
                                        </Link>
                                    </label>
                                </Field>
                                {fieldErrors.terms && (
                                    <p className="text-sm text-red-500 flex items-center mt-1">
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                        {fieldErrors.terms}
                                    </p>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-all duration-200"
                                >
                                    BACK
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    return null;
}
