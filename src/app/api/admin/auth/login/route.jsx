import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

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

        // Authenticate admin user
        const authResult = await AdminAuth.authenticateAdmin(email, password)
        
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
            const isMFATokenValid = AdminAuth.verifyMFAToken(mfaToken, adminUser.mfa_secret)
            
            if (!isMFATokenValid) {
                return NextResponse.json(
                    { success: false, error: 'Invalid MFA token' },
                    { status: 401 }
                )
            }
        }

        // Generate JWT token
        const token = AdminAuth.generateToken(adminUser)

        // Set HTTP-only cookie
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            adminUser: {
                admin_id: adminUser.admin_id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                role: adminUser.role,
                permissions: adminUser.permissions,
                mfa_enabled: adminUser.mfa_enabled
            }
        })

        // Set secure HTTP-only cookie
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60, // 8 hours
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
