'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';

export default function MFASettings() {
    const [mfaStatus, setMfaStatus] = useState({
        enabled: false,
        loading: true
    });
    const [setupData, setSetupData] = useState(null);
    const [verificationToken, setVerificationToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Load MFA status on component mount
    useEffect(() => {
        loadMFAStatus();
    }, []);

    const loadMFAStatus = async () => {
        try {
            const response = await fetch('/api/admin/mfa/status');
            const data = await response.json();
            
            if (data.success) {
                setMfaStatus({
                    enabled: data.data.mfaEnabled,
                    loading: false
                });
            } else {
                setError('Failed to load MFA status');
                setMfaStatus(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            console.error('Error loading MFA status:', error);
            setError('Failed to load MFA status');
            setMfaStatus(prev => ({ ...prev, loading: false }));
        }
    };

    const setupMFA = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/admin/mfa/setup', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                setSetupData(data.data);
                setMessage('Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)');
            } else {
                setError(data.error || 'Failed to setup MFA');
            }
        } catch (error) {
            console.error('Error setting up MFA:', error);
            setError('Failed to setup MFA');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyMFA = async () => {
        if (!verificationToken.trim()) {
            setError('Please enter the verification token');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/mfa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: verificationToken }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setSetupData(null);
                setVerificationToken('');
                await loadMFAStatus(); // Reload status
            } else {
                setError(data.error || 'Invalid verification token');
            }
        } catch (error) {
            console.error('Error verifying MFA:', error);
            setError('Failed to verify MFA token');
        } finally {
            setIsLoading(false);
        }
    };

    const disableMFA = async () => {
        if (!confirm('Are you sure you want to disable two-factor authentication? This will reduce the security of your account.')) {
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/admin/mfa/disable', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                await loadMFAStatus(); // Reload status
            } else {
                setError(data.error || 'Failed to disable MFA');
            }
        } catch (error) {
            console.error('Error disabling MFA:', error);
            setError('Failed to disable MFA');
        } finally {
            setIsLoading(false);
        }
    };

    if (mfaStatus.loading) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Two-Factor Authentication (MFA)
                </h3>
                <p className="text-sm text-gray-600">
                    Add an extra layer of security to your admin account with time-based one-time passwords (TOTP).
                </p>
            </div>

            {/* Status Display */}
            <div className="mb-6">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${mfaStatus.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-900">
                        MFA is {mfaStatus.enabled ? 'enabled' : 'disabled'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* MFA Setup Flow */}
            {!mfaStatus.enabled && !setupData && (
                <div className="space-y-4">
                    <Button 
                        onClick={setupMFA}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-black"
                    >
                        {isLoading ? 'Setting up...' : 'Enable MFA'}
                    </Button>
                </div>
            )}

            {/* QR Code and Verification */}
            {setupData && (
                <div className="space-y-6">
                    <div className="text-center">
                        <img 
                            src={setupData.qrCodeDataURL} 
                            alt="MFA QR Code"
                            className="mx-auto border border-gray-200 rounded-lg"
                        />
                        <p className="mt-2 text-sm text-gray-600">
                            Scan this QR code with your authenticator app
                        </p>
                    </div>

                    {/* Backup Codes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                            Backup Codes (Save these in a secure location)
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm font-mono text-yellow-700">
                            {setupData.backupCodes.map((code, index) => (
                                <div key={index} className="bg-white px-2 py-1 rounded">
                                    {code}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Verification */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter verification code from your authenticator app
                            </label>
                            <input
                                type="text"
                                value={verificationToken}
                                onChange={(e) => setVerificationToken(e.target.value)}
                                placeholder="123456"
                                maxLength="6"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <Button 
                                onClick={verifyMFA}
                                disabled={isLoading || !verificationToken.trim()}
                                className="bg-green-600 hover:bg-green-700 text-black"
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Enable MFA'}
                            </Button>
                            <Button 
                                onClick={() => {
                                    setSetupData(null);
                                    setVerificationToken('');
                                    setError('');
                                    setMessage('');
                                }}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Already Enabled Status */}
            {mfaStatus.enabled && (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Two-factor authentication is active</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                    </p>
                    
                    {/* Disable MFA Section */}
                    <div className="border-t border-gray-200 pt-4 mt-6">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                                Disable Two-Factor Authentication
                            </h4>
                            <p className="text-sm text-red-700 mb-4">
                                Disabling MFA will reduce the security of your account. You will only need your password to log in.
                            </p>
                            <Button 
                                onClick={disableMFA}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700 text-black"
                            >
                                {isLoading ? 'Disabling...' : 'Disable MFA'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
