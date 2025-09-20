import { NextResponse } from 'next/server';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Verify admin authentication
        const adminUser = await AdminAuth.verifyAdmin(req);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if MFA is enabled for this user
        const mfaEnabled = await AdminAuth.isMFAEnabled(adminUser.user_id);

        return NextResponse.json({
            success: true,
            data: {
                mfaEnabled,
                email: adminUser.email
            }
        });

    } catch (error) {
        console.error('MFA status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check MFA status' },
            { status: 500 }
        );
    }
}
