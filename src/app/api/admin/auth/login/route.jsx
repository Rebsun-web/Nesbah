import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import pool from '@/lib/db'
import JWTUtils from '@/lib/auth/jwt-utils'

// Direct admin authentication function
async function authenticateAdminDirectly(email, password) {
    return await pool.withConnection(async (client) => {
        const result = await client.query(
            'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
            [email]
        )
        
        if (result.rows.length === 0) {
            return { success: false, error: 'Invalid credentials' }
        }
        
        const adminUser = result.rows[0]
        const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash)
        
        if (!isPasswordValid) {
            return { success: false, error: 'Invalid credentials' }
        }
        
        // Update last login
        await client.query(
            'UPDATE admin_users SET last_login = NOW() WHERE admin_id = $1',
            [adminUser.admin_id]
        )
        
        // Generate JWT token
        const token = JWTUtils.generateAdminToken(adminUser);
        
        return { 
            success: true, 
            adminUser,
            token: token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }
    })
}

// Verify MFA token directly
function verifyMFATokenDirectly(token, secret) {
    const crypto = require('crypto')
    
    // Get current timestamp
    const now = Math.floor(Date.now() / 1000)
    const timeStep = 30 // 30 seconds window
    
    // Check current and adjacent time steps
    for (let i = -1; i <= 1; i++) {
        const time = now + (i * timeStep)
        const expectedToken = generateTOTP(secret, time)
        if (token === expectedToken) {
            return true
        }
    }
    
    return false
}

// Generate TOTP (Time-based One-Time Password)
function generateTOTP(secret, time) {
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

export async function POST(req) {
    try {
        const body = await req.json()
        const { email, password, mfaToken } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Authenticate admin user directly
        const authResult = await authenticateAdminDirectly(email, password)
        
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            )
        }

        const adminUser = authResult.adminUser

        // Check if MFA is enabled
        if (adminUser.mfa_enabled) {
            if (!mfaToken) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'MFA token required',
                        requiresMFA: true,
                        admin_id: adminUser.admin_id
                    },
                    { status: 401 }
                )
            }

            // Verify MFA token
            const isMFATokenValid = verifyMFATokenDirectly(mfaToken, adminUser.mfa_secret)
            
            if (!isMFATokenValid) {
                return NextResponse.json(
                    { success: false, error: 'Invalid MFA token' },
                    { status: 401 }
                )
            }
        }

        // The authenticateAdmin method now returns JWT token
        const { token, expiresAt } = authResult;

        console.log('🔧 Admin login: Generated token:', token ? 'Token generated successfully' : 'No token generated');
        console.log('🔧 Admin login: Token length:', token ? token.length : 0);

        // Set HTTP-only cookie with JWT token
        const response = NextResponse.json({
            success: true,
            adminUser: {
                admin_id: adminUser.admin_id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                is_active: adminUser.is_active,
                user_type: 'admin_user' // Add this field for authentication context
            },
            message: 'Admin login successful'
        })

        // Set JWT token as HTTP-only cookie
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
        })

        return response

    } catch (error) {
        console.error('Admin login error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
