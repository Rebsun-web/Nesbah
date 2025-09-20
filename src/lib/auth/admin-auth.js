import JWTUtils from './jwt-utils.js'
import pool from '../db.js'
import MFAUtils from './mfa-utils.js'

export class AdminAuth {
    // Generate JWT token for admin user (using JWTUtils)
    static generateToken(adminUser) {
        return JWTUtils.generateAdminToken(adminUser)
    }

    // Get admin by ID from database (for login validation only)
    static async getAdminById(adminId) {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE user_id = $1 AND user_type = $2 AND account_status = $3',
                [adminId, 'admin_user', 'active']
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get admin by email from database (for login validation only)
    static async getAdminByEmail(email) {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE email = $1 AND user_type = $2 AND account_status = $3',
                [email, 'admin_user', 'active']
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Validate admin JWT token (no database query needed)
    static async validateAdminSession(token) {
        try {
            // Verify JWT token (no database query needed)
            const verificationResult = JWTUtils.verifyToken(token);
            
            if (!verificationResult.valid) {
                return { valid: false, error: verificationResult.error || 'Invalid token' };
            }
            
            const decoded = verificationResult.payload;
            
            if (!decoded || decoded.user_type !== 'admin_user') {
                return { valid: false, error: 'Invalid token type' };
            }
            
            // Return admin user from JWT payload (no database query)
            return {
                valid: true,
                adminUser: {
                    admin_id: decoded.user_id, // Map user_id to admin_id for compatibility
                    user_id: decoded.user_id,
                    email: decoded.email,
                    full_name: decoded.entity_name, // Map entity_name to full_name for compatibility
                    entity_name: decoded.entity_name,
                    role: decoded.role,
                    permissions: decoded.permissions,
                    is_active: decoded.account_status === 'active'
                }
            };
        } catch (error) {
            console.error('Admin session validation error:', error);
            return { valid: false, error: 'Invalid token' };
        }
    }

    // Check if admin has specific permission
    static hasPermission(adminUser, permission) {
        if (!adminUser || !adminUser.permissions) {
            return false;
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true;
        }
        
        // Check specific permission
        return adminUser.permissions[permission] === true;
    }

    // Check if admin has any of the specified permissions
    static hasAnyPermission(adminUser, permissions) {
        if (!adminUser || !adminUser.permissions) {
            return false;
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true;
        }
        
        // Check if admin has any of the specified permissions
        return permissions.some(permission => adminUser.permissions[permission] === true);
    }

    // Get permissions as array
    static getPermissionsArray(adminUser) {
        if (!adminUser || !adminUser.permissions) {
            return [];
        }
        
        // If all permissions, return special array
        if (adminUser.permissions.all_permissions === true) {
            return ['all_permissions'];
        }
        
        // Return array of permissions that are true
        return Object.keys(adminUser.permissions).filter(key => adminUser.permissions[key] === true);
    }

    // Validate admin credentials (for login)
    static async validateCredentials(email, password) {
        const adminUser = await this.getAdminByEmail(email);
        
        if (!adminUser) {
            return { valid: false, error: 'Invalid credentials' };
        }
        
        // Import bcrypt dynamically to avoid SSR issues
        const bcrypt = (await import('bcrypt')).default;
        
        const isPasswordValid = await bcrypt.compare(password, adminUser.password);
        
        if (!isPasswordValid) {
            return { valid: false, error: 'Invalid credentials' };
        }
        
        return { valid: true, adminUser };
    }

    // Update admin last login
    static async updateLastLogin(adminId) {
        const client = await pool.connectWithRetry();
        
        try {
            await client.query(
                'UPDATE users SET last_login_at = NOW() WHERE user_id = $1 AND user_type = $2',
                [adminId, 'admin_user']
            );
        } finally {
            client.release();
        }
    }

    // Create new admin user
    static async createAdminUser(email, password, fullName, role = 'admin', permissions = {}) {
        const client = await pool.connectWithRetry();
        
        try {
            // Import bcrypt dynamically to avoid SSR issues
            const bcrypt = (await import('bcrypt')).default;
            const passwordHash = await bcrypt.hash(password, 12);
            
            const result = await client.query(
                `INSERT INTO users (
                    email, password, user_type, entity_name, account_status, 
                    role, permissions, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING user_id, email, entity_name, role, permissions`,
                [email, passwordHash, 'admin_user', fullName, 'active', role, permissions]
            );
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Update admin user
    static async updateAdminUser(adminId, updates) {
        const client = await pool.connectWithRetry();
        
        try {
            const allowedFields = ['entity_name', 'role', 'permissions', 'account_status', 'mfa_enabled', 'mfa_secret'];
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            
            for (const [field, value] of Object.entries(updates)) {
                if (allowedFields.includes(field)) {
                    updateFields.push(`${field} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }
            
            if (updateFields.length === 0) {
                return null;
            }
            
            values.push(adminId);
            updateFields.push('updated_at = NOW()');
            
            const result = await client.query(
                `UPDATE users SET ${updateFields.join(', ')} 
                 WHERE user_id = $${paramCount} AND user_type = 'admin_user'
                 RETURNING user_id, email, entity_name, role, permissions, account_status`,
                values
            );
            
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    // Delete admin user
    static async deleteAdminUser(adminId) {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                'DELETE FROM users WHERE user_id = $1 AND user_type = $2 RETURNING user_id',
                [adminId, 'admin_user']
            );
            
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }

    // Get all admin users
    static async getAllAdminUsers() {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                `SELECT user_id, email, entity_name, role, permissions, account_status, 
                        mfa_enabled, created_at, last_login_at
                 FROM users 
                 WHERE user_type = 'admin_user'
                 ORDER BY created_at DESC`
            );
            
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Verify admin authentication from request
    static async verifyAdmin(req) {
        try {
            let token = null;
            
            // Debug: Log all request headers
            console.log('🔧 AdminAuth: All request headers:', Object.fromEntries(req.headers.entries()));
            
            // First try to get token from Authorization header
            const authHeader = req.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                console.log('🔧 AdminAuth: Token found in Authorization header');
            }
            
            // If no Authorization header, try to get token from cookies
            if (!token) {
                const cookieHeader = req.headers.get('cookie');
                if (cookieHeader) {
                    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        if (key && value) {
                            acc[key.trim()] = value.trim();
                        }
                        return acc;
                    }, {});
                    
                    token = cookies['admin_token'];
                    if (token) {
                        console.log('🔧 AdminAuth: Token found in cookies');
                    } else {
                        console.log('🔧 AdminAuth: No admin_token found in cookies. Available cookies:', Object.keys(cookies));
                        // Also check for any cookie that might contain 'admin' or 'token'
                        const adminCookies = Object.keys(cookies).filter(key => 
                            key.toLowerCase().includes('admin') || key.toLowerCase().includes('token')
                        );
                        if (adminCookies.length > 0) {
                            console.log('🔧 AdminAuth: Potential admin-related cookies found:', adminCookies);
                        }
                    }
                } else {
                    console.log('🔧 AdminAuth: No cookie header found');
                }
            }
            
            // If no token found, return null
            if (!token) {
                console.log('🔧 AdminAuth: No token found in request');
                return null;
            }
            
            console.log('🔧 AdminAuth: Token found, validating...');
            
            // Validate admin session
            const validationResult = await this.validateAdminSession(token);
            
            if (!validationResult.valid) {
                console.log('🔧 AdminAuth: Token validation failed:', validationResult.error);
                return null;
            }
            
            console.log('🔧 AdminAuth: Token validation successful');
            return validationResult.adminUser;
        } catch (error) {
            console.error('Admin verification error:', error);
            return null;
        }
    }

    // ===== MFA METHODS =====

    /**
     * Setup MFA for an admin user
     * @param {number} adminId - Admin user ID
     * @param {string} email - Admin email
     * @returns {Promise<object>} - MFA setup data including QR code
     */
    static async setupMFA(adminId, email) {
        try {
            // Generate MFA setup data
            const mfaSetup = await MFAUtils.createMFASetup(email, 'Nesbah Admin Portal');
            
            // Store the secret in database (temporarily disabled until verified)
            const client = await pool.connectWithRetry();
            
            try {
                await client.query(
                    `UPDATE users SET 
                        mfa_secret = $1, 
                        mfa_enabled = false,
                        updated_at = NOW()
                     WHERE user_id = $2 AND user_type = 'admin_user'`,
                    [mfaSetup.secret, adminId]
                );
                
                return {
                    success: true,
                    qrCodeDataURL: mfaSetup.qrCodeDataURL,
                    backupCodes: mfaSetup.backupCodes
                };
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error setting up MFA:', error);
            throw new Error('Failed to setup MFA');
        }
    }

    /**
     * Verify MFA setup with initial token
     * @param {number} adminId - Admin user ID
     * @param {string} token - 6-digit verification token
     * @returns {Promise<object>} - Verification result
     */
    static async verifyMFASetup(adminId, token) {
        const client = await pool.connectWithRetry();
        
        try {
            // Get the user's temporary MFA secret
            const result = await client.query(
                'SELECT mfa_secret FROM users WHERE user_id = $1 AND user_type = $2',
                [adminId, 'admin_user']
            );
            
            if (result.rows.length === 0 || !result.rows[0].mfa_secret) {
                return { success: false, error: 'MFA setup not found' };
            }
            
            const secret = result.rows[0].mfa_secret;
            
            // Verify the token
            const isValid = MFAUtils.verifyToken(token, secret);
            
            if (isValid) {
                // Enable MFA for the user
                await client.query(
                    `UPDATE users SET 
                        mfa_enabled = true,
                        updated_at = NOW()
                     WHERE user_id = $1 AND user_type = 'admin_user'`,
                    [adminId]
                );
                
                return { success: true, message: 'MFA enabled successfully' };
            } else {
                return { success: false, error: 'Invalid verification token' };
            }
        } catch (error) {
            console.error('Error verifying MFA setup:', error);
            return { success: false, error: 'Failed to verify MFA setup' };
        } finally {
            client.release();
        }
    }

    /**
     * Verify MFA token during login
     * @param {number} adminId - Admin user ID
     * @param {string} token - 6-digit MFA token
     * @returns {Promise<boolean>} - True if token is valid
     */
    static async verifyMFAToken(adminId, token) {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                'SELECT mfa_secret, mfa_enabled FROM users WHERE user_id = $1 AND user_type = $2',
                [adminId, 'admin_user']
            );
            
            if (result.rows.length === 0) {
                return false;
            }
            
            const { mfa_secret, mfa_enabled } = result.rows[0];
            
            if (!mfa_enabled || !mfa_secret) {
                return false;
            }
            
            return MFAUtils.verifyToken(token, mfa_secret);
        } catch (error) {
            console.error('Error verifying MFA token:', error);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Check if admin user has MFA enabled
     * @param {number} adminId - Admin user ID
     * @returns {Promise<boolean>} - True if MFA is enabled
     */
    static async isMFAEnabled(adminId) {
        const client = await pool.connectWithRetry();
        
        try {
            const result = await client.query(
                'SELECT mfa_enabled FROM users WHERE user_id = $1 AND user_type = $2',
                [adminId, 'admin_user']
            );
            
            return result.rows.length > 0 && result.rows[0].mfa_enabled === true;
        } catch (error) {
            console.error('Error checking MFA status:', error);
            return false;
        } finally {
            client.release();
        }
    }

    /**
     * Enhanced admin validation with MFA support
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @param {string} mfaToken - Optional MFA token
     * @returns {Promise<object>} - Validation result
     */
    static async validateCredentialsWithMFA(email, password, mfaToken = null) {
        // First validate basic credentials
        const basicValidation = await this.validateCredentials(email, password);
        
        if (!basicValidation.valid) {
            return basicValidation;
        }
        
        const adminUser = basicValidation.adminUser;
        
        // Check if MFA is enabled for this user
        const mfaEnabled = await this.isMFAEnabled(adminUser.user_id);
        
        if (mfaEnabled) {
            if (!mfaToken) {
                return { 
                    valid: false, 
                    error: 'MFA token required', 
                    requiresMFA: true,
                    adminUser: {
                        user_id: adminUser.user_id,
                        email: adminUser.email
                    }
                };
            }
            
            // Verify MFA token
            const mfaValid = await this.verifyMFAToken(adminUser.user_id, mfaToken);
            
            if (!mfaValid) {
                return { 
                    valid: false, 
                    error: 'Invalid MFA token', 
                    requiresMFA: true,
                    adminUser: {
                        user_id: adminUser.user_id,
                        email: adminUser.email
                    }
                };
            }
        }
        
        return { valid: true, adminUser, mfaVerified: mfaEnabled };
    }

    /**
     * Disable MFA for an admin user
     * @param {number} adminId - Admin user ID
     * @returns {Promise<object>} - Success/error result
     */
    static async disableMFA(adminId) {
        const client = await pool.connectWithRetry();
        
        try {
            // Check if MFA is currently enabled
            const mfaEnabled = await this.isMFAEnabled(adminId);
            
            if (!mfaEnabled) {
                return {
                    success: false,
                    error: 'MFA is not enabled for this account'
                };
            }
            
            // Disable MFA by setting mfa_enabled to false and clearing the secret
            await client.query(
                'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE user_id = $1 AND user_type = $2',
                [adminId, 'admin_user']
            );
            
            console.log(`✅ MFA disabled for admin user ${adminId}`);
            
            return {
                success: true,
                message: 'MFA has been successfully disabled for your account'
            };
            
        } catch (error) {
            console.error('Error disabling MFA:', error);
            return {
                success: false,
                error: 'Failed to disable MFA'
            };
        } finally {
            client.release();
        }
    }
}

// Add default export
export default AdminAuth;