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
import { BuildingOfficeIcon, BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Register() {
    const { t } = useLanguage();
    const [userType, setUserType] = useState(null); // 'business' or 'bank'
    const [showPassword, setShowPassword] = useState(false);
    const [cr_national_number, setCrNationalNumber] = useState('');
    const [sama_license_number, setSamaLicenseNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isOpen, setIsModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [modalMessage, setModalMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStep, setVerificationStep] = useState('initial'); // 'initial', 'verifying', 'verified', 'details'
    const [verifiedData, setVerifiedData] = useState(null);
    const [bankLogo, setBankLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    
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

    const validateSAMALicense = (license) => {
        const licenseRegex = /^\d{4}$/;
        return licenseRegex.test(license);
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
        if (userType === 'business' && (!cr_national_number || !validateCRNumber(cr_national_number))) {
            errors.cr_national_number = 'Please enter a valid 10-digit CR number';
        }
        
        // SAMA License validation for bank
        if (userType === 'bank' && (!sama_license_number || !validateSAMALicense(sama_license_number))) {
            errors.sama_license_number = 'Please enter a valid 4-digit SAMA license number';
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

    const handleUserTypeSelection = (type) => {
        setUserType(type);
        setVerificationStep('initial');
        setVerifiedData(null);
        // Reset form fields
        setCrNationalNumber('');
        setSamaLicenseNumber('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setBankLogo(null);
        setLogoPreview(null);
        setFieldErrors({});
        setPhoneNumber('');
        setContactPerson('');
        setTermsAccepted(false);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrorMessage('Please select a valid image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMessage('Logo file size must be less than 5MB');
                return;
            }
            
            setBankLogo(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVerifyAndContinue = async (e) => {
        e.preventDefault();
        
        // Validate initial form
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);

        try {
            let endpoint = '';
            let payload = {};

            if (userType === 'business') {
                endpoint = '/api/users/register/business_users/verify';
                payload = { cr_national_number, email };
            } else if (userType === 'bank') {
                endpoint = '/api/users/register/bank_users/verify';
                payload = { sama_license_number, email };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setVerifiedData(data.data);
                setVerificationStep('verified');
            } else {
                setErrorMessage(data.error || 'Verification failed');
                setIsModalOpen(true);
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
        
        // Validate final form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            let endpoint = '';
            let payload = {
                email,
                password,
                phone_number: phoneNumber,
                contact_person: contactPerson,
                ...verifiedData
            };

            // Handle logo upload for bank users
            if (userType === 'bank' && bankLogo) {
                const formData = new FormData();
                formData.append('logo', bankLogo);
                
                // Upload logo first
                const uploadResponse = await fetch('/api/upload/bank-logo', {
                    method: 'POST',
                    body: formData
                });
                
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    payload.logo_url = uploadData.logo_url;
                } else {
                    console.error('Logo upload failed, proceeding without logo');
                }
            }

            if (userType === 'business') {
                endpoint = '/api/users/register/business_users/';
            } else if (userType === 'bank') {
                endpoint = '/api/users/register/bank_users/';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setModalMessage(userType === 'business' 
                    ? 'تم تسجيل حسابك بنجاح! سيتم إرسال تفاصيل الحساب إلى بريدك الإلكتروني.'
                    : 'تم تقديم طلب التسجيل بنجاح! سيتم مراجعة طلبك والرد عليك خلال 3-5 أيام عمل.'
                );
            } else {
                setIsSuccess(false);
                setModalMessage(data?.error || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setIsSuccess(false);
            setModalMessage('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى لاحقًا.');
        } finally {
            setIsModalOpen(true);
            setIsLoading(false);
        }
    };

    const goBack = () => {
        setVerificationStep('initial');
        setVerifiedData(null);
    };

    // User Type Selection Screen
    if (!userType) {
        return (
            <main className="overflow-hidden bg-white">
                <Container className="relative">
                    <Navbar />
                </Container>
                <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                    <div className="w-full max-w-4xl">
                        {/* Language Switcher */}
                        <div className="flex justify-end mb-4">
                            <LanguageSwitcher variant="minimal" />
                        </div>
                        
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome to Nesbah
                            </h1>
                            <p className="text-lg text-gray-600">
                                Choose Your Registration Type
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Business Registration Card */}
                            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 p-8">
                                <div className="text-center mb-6">
                                    <BuildingOfficeIcon className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Business Registration</h2>
                                    <p className="text-gray-600 mb-4">For companies, SMEs, and startups</p>
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Companies & Corporations
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Small & Medium Enterprises
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Startups & New Ventures
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUserTypeSelection('business')}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
                                >
                                    REGISTER AS BUSINESS
                                </button>
                            </div>

                            {/* Bank Registration Card */}
                            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 p-8">
                                <div className="text-center mb-6">
                                    <BanknotesIcon className="mx-auto h-16 w-16 text-purple-600 mb-4" />
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bank Registration</h2>
                                    <p className="text-gray-600 mb-4">For licensed banks and financial institutions</p>
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Licensed Commercial Banks
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Islamic Banks
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                                        Investment Companies
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUserTypeSelection('bank')}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
                                >
                                    REGISTER AS BANK
                                </button>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <p className="text-gray-500">
                                Already have an account?{' '}
                                <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

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
                                    {userType === 'business' ? 'Business Registration' : 'Bank Registration'}
                                </h2>
                            </div>

                            <div className="flex items-center justify-center pb-4 pt-6">
                                {userType === 'business' ? (
                                    <BuildingOfficeIcon className="h-16 w-16 text-purple-600" />
                                ) : (
                                    <BanknotesIcon className="h-16 w-16 text-purple-600" />
                                )}
                            </div>

                            {userType === 'business' ? (
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
                                            fieldErrors.cr_national_number ? 'border-red-500' : 'border-gray-300'
                                        } focus:border-purple-500 focus:ring-purple-500`}
                                    />
                                    {fieldErrors.cr_national_number && (
                                        <p className="text-sm text-red-500 flex items-center">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {fieldErrors.cr_national_number}
                                        </p>
                                    )}
                                </Field>
                            ) : (
                                <Field className="mt-4 space-y-3">
                                    <Label className="text-sm/5 font-medium text-gray-700">
                                        رقم ترخيص مؤسسة النقد (SAMA License Number)
                                    </Label>
                                    <input
                                        type="text"
                                        value={sama_license_number}
                                        onChange={(e) => {
                                            setSamaLicenseNumber(e.target.value);
                                            if (fieldErrors.sama_license_number) {
                                                setFieldErrors(prev => ({ ...prev, sama_license_number: null }));
                                            }
                                        }}
                                        required
                                        placeholder="1000"
                                        className={`block w-full rounded-lg border px-4 py-2 shadow ${
                                            fieldErrors.sama_license_number ? 'border-red-500' : 'border-gray-300'
                                        } focus:border-purple-500 focus:ring-purple-500`}
                                    />
                                    {fieldErrors.sama_license_number && (
                                        <p className="text-sm text-red-500 flex items-center">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            {fieldErrors.sama_license_number}
                                        </p>
                                    )}
                                </Field>
                            )}

                            <Field className="mt-4 space-y-3">
                                <Label className="text-sm/5 font-medium text-gray-700">
                                    البريد الإلكتروني
                                </Label>
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
                                    placeholder={userType === 'business' ? "user@company.com" : "admin@saudibank.com"}
                                    className={`block w-full rounded-lg border px-4 py-2 shadow ${
                                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                                    } focus:border-purple-500 focus:ring-purple-500`}
                                />
                                {fieldErrors.email && (
                                    <p className="text-sm text-red-500 flex items-center">
                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </Field>

                            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-sm text-purple-800 text-center">
                                    {userType === 'business' 
                                        ? "We'll extract your business details automatically using Wathiq."
                                        : "We'll extract your bank details automatically using SAMA registry."
                                    }
                                </p>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setUserType(null)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-all duration-200"
                                >
                                    BACK
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        );
    }

    // Verified Data Display and Final Registration
    if (verificationStep === 'verified' && verifiedData) {
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
                                    {userType === 'business' ? 'Business Details' : 'Bank Details'}
                                </h2>
                            </div>

                            {/* Verification Success Banner */}
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-800">
                                        Verified via {userType === 'business' ? 'Wathiq' : 'SAMA Registry'}
                                    </span>
                                </div>
                            </div>

                            {/* Auto-populated Information */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-md font-semibold mb-4 text-gray-900">Verified Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {userType === 'business' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                                <p className="text-sm text-gray-900">{verifiedData.trade_name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">CR Number</label>
                                                <p className="text-sm text-gray-900">{verifiedData.cr_number}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <p className="text-sm text-green-600 font-medium">Active</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Capital</label>
                                                <p className="text-sm text-gray-900">SAR {verifiedData.cr_capital?.toLocaleString()}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                                <p className="text-sm text-gray-900">{verifiedData.entity_name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">SAMA License</label>
                                                <p className="text-sm text-gray-900">{verifiedData.sama_license_number}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <p className="text-sm text-green-600 font-medium">Active</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Bank Type</label>
                                                <p className="text-sm text-gray-900">{verifiedData.bank_type}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-md font-semibold mb-4 text-gray-900">Contact Information</h3>
                                <div className="space-y-4">
                                    <Field>
                                        <Label className="text-sm/5 font-medium text-gray-700">Email Address</Label>
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
                                    
                                    <Field>
                                        <Label className="text-sm/5 font-medium text-gray-700">Phone Number</Label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                setPhoneNumber(e.target.value);
                                                if (fieldErrors.phoneNumber) {
                                                    setFieldErrors(prev => ({ ...prev, phoneNumber: null }));
                                                }
                                            }}
                                            placeholder="+966501234567"
                                            className={`block w-full rounded-lg border px-4 py-2 shadow mt-1 ${
                                                fieldErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                            } focus:border-purple-500 focus:ring-purple-500`}
                                        />
                                        {fieldErrors.phoneNumber && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                {fieldErrors.phoneNumber}
                                            </p>
                                        )}
                                    </Field>
                                    
                                    <Field>
                                        <Label className="text-sm/5 font-medium text-gray-700">Contact Person</Label>
                                        <input
                                            type="text"
                                            value={contactPerson}
                                            onChange={(e) => {
                                                setContactPerson(e.target.value);
                                                if (fieldErrors.contactPerson) {
                                                    setFieldErrors(prev => ({ ...prev, contactPerson: null }));
                                                }
                                            }}
                                            placeholder="Full Name"
                                            className={`block w-full rounded-lg border px-4 py-2 shadow mt-1 ${
                                                fieldErrors.contactPerson ? 'border-red-500' : 'border-gray-300'
                                            } focus:border-purple-500 focus:ring-purple-500`}
                                        />
                                        {fieldErrors.contactPerson && (
                                            <p className="text-sm text-red-500 flex items-center mt-1">
                                                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                                {fieldErrors.contactPerson}
                                            </p>
                                        )}
                                    </Field>
                                </div>
                            </div>

                            {/* Bank Logo Upload */}
                            {userType === 'bank' && (
                                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                    <h3 className="text-md font-semibold mb-4 text-gray-900">Bank Logo</h3>
                                    <div className="space-y-4">
                                        <Field>
                                            <Label className="text-sm/5 font-medium text-gray-700">Upload Bank Logo</Label>
                                            <div className="mt-1 flex items-center space-x-4">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Upload your bank logo (JPG, PNG, GIF). Max size: 5MB.
                                            </p>
                                        </Field>
                                        
                                        {logoPreview && (
                                            <div className="mt-4">
                                                <Label className="text-sm/5 font-medium text-gray-700">Logo Preview</Label>
                                                <div className="mt-2 flex items-center space-x-4">
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo preview"
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setBankLogo(null);
                                                            setLogoPreview(null);
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                    </Field>
                                </div>
                            </div>

                            {/* Terms and Conditions */}
                            <div className="mb-6">
                                <Field className="flex items-center gap-3">
                                    <Checkbox
                                        name="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            if (fieldErrors.terms) {
                                                setFieldErrors(prev => ({ ...prev, terms: null }));
                                            }
                                        }}
                                        className={clsx(
                                            'group block size-4 rounded border border-transparent shadow ring-1 ring-black/10 focus:outline-none',
                                            'data-[checked]:bg-purple-600 data-[checked]:ring-purple-600',
                                            'data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-purple-600',
                                        )}
                                    >
                                        <CheckIcon className="fill-white opacity-0 group-data-[checked]:opacity-100" />
                                    </Checkbox>
                                    <Label className="text-sm text-gray-700">
                                        I agree to the{' '}
                                        <Link href="/terms" className="text-purple-600 hover:text-purple-800">
                                            Terms & Conditions
                                        </Link>{' '}
                                        and{' '}
                                        <Link href="/privacy" className="text-purple-600 hover:text-purple-800">
                                            Privacy Policy
                                        </Link>
                                    </Label>
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
                                    {isLoading ? 'SUBMITTING...' : 'SUBMIT REGISTRATION'}
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
