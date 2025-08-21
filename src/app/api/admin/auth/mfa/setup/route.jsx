import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

export async function POST(req) {
    try {
        // Authenticate the request
        const authResult = await AdminAuth.authenticateRequest(req)
        
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: 401 }
            )
        }

        const adminUser = authResult.adminUser

        // Enable MFA for the admin user
        const mfaResult = await AdminAuth.toggleMFA(adminUser.admin_id, true)
        
        if (!mfaResult.success) {
            return NextResponse.json(
                { success: false, error: 'Failed to enable MFA' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'MFA enabled successfully',
            mfaQRCode: mfaResult.mfaQRCode
        })

    } catch (error) {
        console.error('MFA setup error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
