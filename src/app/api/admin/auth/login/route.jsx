import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

export async function POST(req) {
    try {
        const body = await req.json()
        const { email, password } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Validate admin credentials
        const authResult = await AdminAuth.validateCredentials(email, password)
        
        if (!authResult.valid) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            )
        }

        const adminUser = authResult.adminUser

        // Update last login timestamp
        await AdminAuth.updateLastLogin(adminUser.admin_id)

        // Generate JWT token
        const JWTUtils = (await import('@/lib/auth/jwt-utils.js')).default
        const token = JWTUtils.generateAdminToken(adminUser)

        console.log('🔧 Admin login: Generated JWT token successfully')

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
                user_type: 'admin_user'
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

        console.log('🔧 Admin login: JWT token set in HTTP-only cookie')
        return response

    } catch (error) {
        console.error('Admin login error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
