import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

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
