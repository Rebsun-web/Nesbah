import { NextResponse } from 'next/server';
import backgroundTaskManager from '@/lib/background-tasks';
import AdminAuth from '@/lib/auth/admin-auth';

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

        // Get admin user from session
        const adminUser = sessionValidation.adminUser;

        console.log('🛑 Manual request to stop background tasks...');
        
        // Stop the background task manager
        backgroundTaskManager.stop();
        
        return NextResponse.json({
            success: true,
            message: 'Background tasks stopped successfully',
            data: {
                stoppedBy: adminUser.email,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error stopping background tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to stop background tasks' },
            { status: 500 }
        );
    }
}
