import { NextResponse } from 'next/server';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'MFA token is required' },
                { status: 400 }
            );
        }

        // Verify admin authentication
        const adminUser = await AdminAuth.verifyAdmin(req);
        if (!adminUser) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify the MFA setup with the provided token
        const verificationResult = await AdminAuth.verifyMFASetup(adminUser.user_id, token);

        if (verificationResult.success) {
            return NextResponse.json({
                success: true,
                message: 'MFA has been successfully enabled for your account'
            });
        } else {
            return NextResponse.json(
                { success: false, error: verificationResult.error },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('MFA verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to verify MFA token' },
            { status: 500 }
        );
    }
}
