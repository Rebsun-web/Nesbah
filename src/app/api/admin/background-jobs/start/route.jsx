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

        console.log('🚀 Manual request to start background tasks...');
        
        // Start the background task manager
        backgroundTaskManager.start();
        
        // Get current status
        const status = backgroundTaskManager.getStatus();
        
        return NextResponse.json({
            success: true,
            message: 'Background tasks started successfully',
            data: {
                status,
                startedBy: adminUser.email,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error starting background tasks:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to start background tasks' },
            { status: 500 }
        );
    }
}

export async function GET(req) {
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

        // Get current status
        const status = backgroundTaskManager.getStatus();
        
        return NextResponse.json({
            success: true,
            data: {
                status,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error getting background task status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get background task status' },
            { status: 500 }
        );
    }
}