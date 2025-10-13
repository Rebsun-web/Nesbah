'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';

export default function MFASettings() {
    const [mfaStatus, setMfaStatus] = useState({
        enabled: false,
        loading: true,
        setupInProgress: false
    });
    const [setupData, setSetupData] = useState(null);
    const [verificationToken, setVerificationToken] = useState('');
    const [disableToken, setDisableToken] = useState('');
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
                    loading: false,
                    setupInProgress: data.data.setupInProgress
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
        if (!disableToken.trim()) {
            setError('Please enter your current MFA token to disable');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/mfa/disable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: disableToken }),
            });
            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setDisableToken('');
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
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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
                                className="bg-green-600 hover:bg-green-700 text-white"
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

            {/* Disable MFA */}
            {mfaStatus.enabled && (
                <div className="space-y-4 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900">Disable MFA</h4>
                    <p className="text-sm text-gray-600">
                        Enter your current MFA token to disable two-factor authentication.
                    </p>
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={disableToken}
                            onChange={(e) => setDisableToken(e.target.value)}
                            placeholder="Current MFA token"
                            maxLength="6"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                        <Button 
                            onClick={disableMFA}
                            disabled={isLoading || !disableToken.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? 'Disabling...' : 'Disable MFA'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
