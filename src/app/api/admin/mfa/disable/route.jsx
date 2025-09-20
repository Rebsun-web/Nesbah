import { NextResponse } from 'next/server';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        // Verify admin authentication
        const adminUser = await AdminAuth.verifyAdmin(req);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Disable MFA for the admin user
        const disableResult = await AdminAuth.disableMFA(adminUser.user_id);

        if (disableResult.success) {
            return NextResponse.json({
                success: true,
                message: disableResult.message
            });
        } else {
            return NextResponse.json(
                { success: false, error: disableResult.error },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('MFA disable error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to disable MFA' },
            { status: 500 }
        );
    }
}
