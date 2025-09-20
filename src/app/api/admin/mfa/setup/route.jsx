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

        // Check if MFA is already enabled
        const mfaEnabled = await AdminAuth.isMFAEnabled(adminUser.user_id);
        if (mfaEnabled) {
            return NextResponse.json(
                { success: false, error: 'MFA is already enabled for this account' },
                { status: 400 }
            );
        }

        // Setup MFA for the admin user
        const mfaSetup = await AdminAuth.setupMFA(adminUser.user_id, adminUser.email);

        return NextResponse.json({
            success: true,
            data: {
                qrCodeDataURL: mfaSetup.qrCodeDataURL,
                backupCodes: mfaSetup.backupCodes,
                message: 'MFA setup initiated. Please scan the QR code with your authenticator app.'
            }
        });

    } catch (error) {
        console.error('MFA setup error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to setup MFA' },
            { status: 500 }
        );
    }
}
