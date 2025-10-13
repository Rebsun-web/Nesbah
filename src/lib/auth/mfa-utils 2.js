/**
 * Multi-Factor Authentication (MFA) Utilities
 * Provides TOTP-based two-factor authentication for admin users
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

class MFAUtils {
    /**
     * Generate a new MFA secret for a user
     * @param {string} userEmail - User's email address
     * @param {string} serviceName - Service name (default: Nesbah Admin)
     * @returns {object} - Secret, QR code URL, and backup codes
     */
    static generateSecret(userEmail, serviceName = 'Nesbah Admin') {
        try {
            const secret = speakeasy.generateSecret({
                name: userEmail,
                issuer: serviceName,
                length: 32
            });

            return {
                secret: secret.base32,
                otpauthURL: secret.otpauth_url,
                qrCodeURL: null // Will be generated separately
            };
        } catch (error) {
            console.error('Error generating MFA secret:', error);
            throw new Error('Failed to generate MFA secret');
        }
    }

    /**
     * Generate QR code as base64 data URL
     * @param {string} otpauthURL - OTPAUTH URL from secret generation
     * @returns {Promise<string>} - Base64 data URL of QR code
     */
    static async generateQRCode(otpauthURL) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(otpauthURL, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            return qrCodeDataURL;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Verify a TOTP token
     * @param {string} token - 6-digit TOTP token
     * @param {string} secret - Base32 encoded secret
     * @param {number} window - Time window tolerance (default: 1)
     * @returns {boolean} - True if token is valid
     */
    static verifyToken(token, secret, window = 1) {
        try {
            if (!token || !secret) {
                return false;
            }

            // Remove any spaces or special characters from token
            const cleanToken = token.replace(/\s/g, '');

            // Verify the token
            return speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: cleanToken,
                window: window // Allow 1 time step before/after for clock skew
            });
        } catch (error) {
            console.error('Error verifying MFA token:', error);
            return false;
        }
    }

    /**
     * Generate backup codes for emergency access
     * @param {number} count - Number of backup codes to generate (default: 10)
     * @returns {string[]} - Array of backup codes
     */
    static generateBackupCodes(count = 10) {
        const codes = [];
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        
        for (let i = 0; i < count; i++) {
            let code = '';
            for (let j = 0; j < 8; j++) {
                code += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            // Format as XXXX-XXXX for better readability
            codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
        }
        
        return codes;
    }

    /**
     * Validate backup code format
     * @param {string} code - Backup code to validate
     * @returns {boolean} - True if format is valid
     */
    static isValidBackupCodeFormat(code) {
        // Check for XXXX-XXXX format with alphanumeric characters
        const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(code.toUpperCase());
    }

    /**
     * Get current TOTP value (for testing purposes)
     * @param {string} secret - Base32 encoded secret
     * @returns {string} - Current 6-digit TOTP value
     */
    static getCurrentToken(secret) {
        try {
            return speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });
        } catch (error) {
            console.error('Error generating current token:', error);
            return null;
        }
    }

    /**
     * Validate MFA setup completeness
     * @param {object} mfaData - MFA data object
     * @returns {object} - Validation result
     */
    static validateMFASetup(mfaData) {
        const errors = [];

        if (!mfaData.secret) {
            errors.push('MFA secret is required');
        }

        if (!mfaData.otpauthURL) {
            errors.push('OTPAUTH URL is required');
        }

        if (!mfaData.backupCodes || !Array.isArray(mfaData.backupCodes) || mfaData.backupCodes.length === 0) {
            errors.push('Backup codes are required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Create MFA setup data for a user
     * @param {string} userEmail - User's email
     * @param {string} serviceName - Service name
     * @returns {Promise<object>} - Complete MFA setup data
     */
    static async createMFASetup(userEmail, serviceName = 'Nesbah Admin') {
        try {
            const secretData = this.generateSecret(userEmail, serviceName);
            const qrCodeDataURL = await this.generateQRCode(secretData.otpauthURL);
            const backupCodes = this.generateBackupCodes();

            return {
                secret: secretData.secret,
                otpauthURL: secretData.otpauthURL,
                qrCodeDataURL,
                backupCodes,
                setupComplete: false,
                enabled: false
            };
        } catch (error) {
            console.error('Error creating MFA setup:', error);
            throw new Error('Failed to create MFA setup');
        }
    }
}

export default MFAUtils;
