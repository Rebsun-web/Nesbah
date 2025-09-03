import { NextResponse } from 'next/server';
import { getEmailNotificationStatus } from '@/lib/email/emailNotifications';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get email notification status
        const emailStatus = getEmailNotificationStatus();
        
        return NextResponse.json({
            success: true,
            email_notifications: emailStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting email notification status:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

/**
 * POST endpoint to toggle email notifications on/off
 */
export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        if (!action || !['enable', 'disable', 'status'].includes(action)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid action. Must be: enable, disable, or status' 
            }, { status: 400 });
        }

        let message;
        let currentStatus;

        if (action === 'enable') {
            message = 'Email notifications enabled. Update your .env.local file and restart the application.';
            currentStatus = 'enabled';
        } else if (action === 'disable') {
            message = 'Email notifications disabled. Add DISABLE_EMAIL_NOTIFICATIONS=true to your .env.local file and restart the application.';
            currentStatus = 'disabled';
        } else {
            currentStatus = getEmailNotificationStatus();
            message = currentStatus.message;
        }

        return NextResponse.json({
            success: true,
            action: action,
            message: message,
            current_status: currentStatus,
            note: 'Environment variable changes require application restart to take effect'
        });

    } catch (error) {
        console.error('Error toggling email notifications:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
