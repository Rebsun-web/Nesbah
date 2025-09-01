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
                'SELECT * FROM admin_users WHERE admin_id = $1 AND is_active = true',
                [adminId]
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
                'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
                [email]
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
                    admin_id: decoded.admin_id,
                    email: decoded.email,
                    full_name: decoded.full_name,
                    role: decoded.role,
                    permissions: decoded.permissions,
                    is_active: true
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

    // Check if admin has all of the specified permissions
    static hasAllPermissions(adminUser, permissions) {
        if (!adminUser || !adminUser.permissions) {
            return false;
        }
        
        // Check for all permissions
        if (adminUser.permissions.all_permissions === true) {
            return true;
        }
        
        // Check if admin has all of the specified permissions
        return permissions.every(permission => adminUser.permissions[permission] === true);
    }

    // Get admin permissions as array
    static getPermissionsArray(adminUser) {
        if (!adminUser || !adminUser.permissions) {
            return [];
        }
        
        if (adminUser.permissions.all_permissions === true) {
            return ['all_permissions'];
        }
        
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
        
        const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
        
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
                'UPDATE admin_users SET last_login = NOW() WHERE admin_id = $1',
                    [adminId]
            );
        } finally {
            client.release();
        }
    }
}

// Add default export
export default AdminAuth;