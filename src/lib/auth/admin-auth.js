import JWTUtils from './jwt-utils.js'
import pool from '../db.cjs'

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
}

// Add default export
export default AdminAuth;