import bcrypt from 'bcrypt'
import pool from '../db.cjs'
import JWTUtils from './jwt-utils.js'
import adminSessionManager from './admin-session.js'

// MFA secret key
const MFA_SECRET = process.env.MFA_SECRET || 'your-mfa-secret-key-change-in-production'

export class AdminAuth {
    // Generate JWT token for admin user (using JWTUtils)
    static generateToken(adminUser) {
        return JWTUtils.generateAdminToken(adminUser)
    }

    // Verify JWT token (using JWTUtils)
    static verifyToken(token) {
        return JWTUtils.verifyToken(token)
    }

    // Hash password
    static async hashPassword(password) {
        const saltRounds = 12
        return await bcrypt.hash(password, saltRounds)
    }

    // Compare password
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword)
    }

    // Generate MFA secret for admin user
    static generateMFASecret() {
        const crypto = require('crypto')
        return crypto.randomBytes(20).toString('hex')
    }

    // Generate MFA QR code URL
    static generateMFAQRCode(email, secret) {
        const issuer = 'Nesbah Admin'
        const accountName = email
        const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
        return otpauth
    }

    // Verify MFA token
    static verifyMFAToken(token, secret) {
        const crypto = require('crypto')
        
        // Get current timestamp
        const now = Math.floor(Date.now() / 1000)
        const timeStep = 30 // 30 seconds window
        
        // Check current and adjacent time steps
        for (let i = -1; i <= 1; i++) {
            const time = now + (i * timeStep)
            const expectedToken = this.generateTOTP(secret, time)
            if (token === expectedToken) {
                return true
            }
        }
        
        return false
    }

    // Generate TOTP (Time-based One-Time Password)
    static generateTOTP(secret, time) {
        const crypto = require('crypto')
        
        // Convert time to buffer
        const timeBuffer = Buffer.alloc(8)
        timeBuffer.writeBigUInt64BE(BigInt(time), 0)
        
        // Create HMAC
        const hmac = crypto.createHmac('sha1', secret)
        hmac.update(timeBuffer)
        const hash = hmac.digest()
        
        // Get offset
        const offset = hash[hash.length - 1] & 0xf
        
        // Generate 4-byte code
        const code = ((hash[offset] & 0x7f) << 24) |
                    ((hash[offset + 1] & 0xff) << 16) |
                    ((hash[offset + 2] & 0xff) << 8) |
                    (hash[offset + 3] & 0xff)
        
        // Return 6-digit code
        return (code % 1000000).toString().padStart(6, '0')
    }

    // Authenticate admin user
    static async authenticateAdmin(email, password) {
        return await pool.withConnection(async (client) => {
            const result = await client.query(
                'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
                [email]
            )
            
            if (result.rows.length === 0) {
                return { success: false, error: 'Invalid credentials' }
            }
            
            const adminUser = result.rows[0]
            const isPasswordValid = await this.comparePassword(password, adminUser.password_hash)
            
            if (!isPasswordValid) {
                return { success: false, error: 'Invalid credentials' }
            }
            
            // Update last login
            await client.query(
                'UPDATE admin_users SET last_login = NOW() WHERE admin_id = $1',
                [adminUser.admin_id]
            )
            
            // Generate JWT token instead of session (no database storage needed)
            const token = JWTUtils.generateAdminToken(adminUser);
            
            return { 
                success: true, 
                adminUser,
                token: token,
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            }
        })
    }

    // Get admin user by ID (database query - use sparingly)
    static async getAdminById(adminId) {
        const client = await pool.connectWithRetry();
        try {
            const result = await client.query(
                'SELECT admin_id, email, full_name, role, permissions, is_active FROM admin_users WHERE admin_id = $1',
                [adminId]
            )
            
            return result.rows[0] || null
        } finally {
            client.release();
        }
    }

    // Validate admin session (JWT-based, no database query)
    static async validateAdminSession(token) {
        try {
            // Verify JWT token (no database query needed)
            const decoded = JWTUtils.verifyToken(token);
            
            if (!decoded || decoded.user_type !== 'admin_user') {
                return { valid: false, error: 'Invalid token' };
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

    // Refresh admin session
    static refreshAdminSession(sessionId) {
        return adminSessionManager.refreshSession(sessionId);
    }

    // Invalidate admin session (logout)
    static async invalidateAdminSession(sessionId) {
        return await adminSessionManager.invalidateSession(sessionId);
    }

    // Check if admin has permission
    static hasPermission(adminUser, permission) {
        if (!adminUser || !adminUser.permissions) {
            return false
        }
        
        // Super admin has all permissions
        if (adminUser.role === 'super_admin') {
            return true
        }
        
        // Check specific permission
        if (adminUser.permissions.all_permissions) {
            return true
        }
        
        return adminUser.permissions[permission] === true
    }

    // Middleware to authenticate admin requests
    static async authenticateRequest(req) {
        const authHeader = req.headers.get('authorization')
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, error: 'No token provided' }
        }
        
        const token = authHeader.substring(7)
        const decoded = this.verifyToken(token)
        
        if (!decoded) {
            return { success: false, error: 'Invalid token' }
        }
        
        const adminUser = await this.getAdminById(decoded.admin_id)
        
        if (!adminUser || !adminUser.is_active) {
            return { success: false, error: 'Admin user not found or inactive' }
        }
        
        return { success: true, adminUser }
    }

    // Create new admin user
    static async createAdminUser(adminData) {
        const client = await pool.connectWithRetry()
        
        try {
            const { email, password, full_name, role = 'admin', permissions = {} } = adminData
            
            // Check if email already exists
            const existingUser = await client.query(
                'SELECT admin_id FROM admin_users WHERE email = $1',
                [email]
            )
            
            if (existingUser.rows.length > 0) {
                return { success: false, error: 'Email already exists' }
            }
            
            // Hash password
            const hashedPassword = await this.hashPassword(password)
            
            // Generate MFA secret
            const mfa_secret = this.generateMFASecret()
            
            // Insert new admin user
            const result = await client.query(
                `
                INSERT INTO admin_users 
                    (email, password_hash, full_name, role, permissions, mfa_secret, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                RETURNING admin_id, email, full_name, role, permissions, mfa_secret
                `,
                [email, hashedPassword, full_name, role, JSON.stringify(permissions), mfa_secret]
            )
            
            const newAdmin = result.rows[0]
            
            return {
                success: true,
                adminUser: newAdmin,
                mfaQRCode: this.generateMFAQRCode(email, mfa_secret)
            }
        } finally {
            client.release()
        }
    }

    // Update admin user
    static async updateAdminUser(adminId, updateData) {
        const client = await pool.connectWithRetry()
        
        try {
            const { email, full_name, role, permissions, is_active } = updateData
            const updates = []
            const values = []
            let paramCount = 0
            
            if (email !== undefined) {
                paramCount++
                updates.push(`email = $${paramCount}`)
                values.push(email)
            }
            
            if (full_name !== undefined) {
                paramCount++
                updates.push(`full_name = $${paramCount}`)
                values.push(full_name)
            }
            
            if (role !== undefined) {
                paramCount++
                updates.push(`role = $${paramCount}`)
                values.push(role)
            }
            
            if (permissions !== undefined) {
                paramCount++
                updates.push(`permissions = $${paramCount}`)
                values.push(JSON.stringify(permissions))
            }
            
            if (is_active !== undefined) {
                paramCount++
                updates.push(`is_active = $${paramCount}`)
                values.push(is_active)
            }
            
            if (updates.length === 0) {
                return { success: false, error: 'No updates provided' }
            }
            
            paramCount++
            updates.push(`updated_at = $${paramCount}`)
            values.push(new Date())
            
            paramCount++
            values.push(adminId)
            
            const result = await client.query(
                `UPDATE admin_users SET ${updates.join(', ')} WHERE admin_id = $${paramCount} RETURNING admin_id, email, full_name, role, permissions, is_active`,
                values
            )
            
            if (result.rows.length === 0) {
                return { success: false, error: 'Admin user not found' }
            }
            
            return { success: true, adminUser: result.rows[0] }
        } finally {
            client.release()
        }
    }

    // Change admin password
    static async changePassword(adminId, currentPassword, newPassword) {
        const client = await pool.connectWithRetry()
        
        try {
            // Get current password hash
            const result = await client.query(
                'SELECT password_hash FROM admin_users WHERE admin_id = $1',
                [adminId]
            )
            
            if (result.rows.length === 0) {
                return { success: false, error: 'Admin user not found' }
            }
            
            const currentHash = result.rows[0].password_hash
            
            // Verify current password
            const isCurrentValid = await this.comparePassword(currentPassword, currentHash)
            if (!isCurrentValid) {
                return { success: false, error: 'Current password is incorrect' }
            }
            
            // Hash new password
            const newHash = await this.hashPassword(newPassword)
            
            // Update password
            await client.query(
                'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE admin_id = $2',
                [newHash, adminId]
            )
            
            return { success: true }
        } finally {
            client.release()
        }
    }

    // Enable/disable MFA for admin user
    static async toggleMFA(adminId, enable) {
        const client = await pool.connectWithRetry()
        
        try {
            if (enable) {
                // Generate new MFA secret
                const mfa_secret = this.generateMFASecret()
                
                await client.query(
                    'UPDATE admin_users SET mfa_enabled = true, mfa_secret = $1, updated_at = NOW() WHERE admin_id = $2',
                    [mfa_secret, adminId]
                )
                
                const result = await client.query(
                    'SELECT email FROM admin_users WHERE admin_id = $1',
                    [adminId]
                )
                
                return {
                    success: true,
                    mfaQRCode: this.generateMFAQRCode(result.rows[0].email, mfa_secret)
                }
            } else {
                // Disable MFA
                await client.query(
                    'UPDATE admin_users SET mfa_enabled = false, mfa_secret = NULL, updated_at = NOW() WHERE admin_id = $2',
                    [adminId]
                )
                
                return { success: true }
            }
        } finally {
            client.release()
        }
    }
}

export default AdminAuth
