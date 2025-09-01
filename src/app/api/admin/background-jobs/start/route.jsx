import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import backgroundTaskManager from '@/lib/background-tasks'

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

        // Start the background task manager
        backgroundTaskManager.start()
        
        // Get the current status
        const status = backgroundTaskManager.getStatus()
        
        return NextResponse.json({
            success: true,
            message: 'Background task manager started successfully',
            data: {
                status,
                message: 'Background tasks are now running and will automatically update application statuses every 5 minutes'
            }
        })
        
    } catch (error) {
        console.error('Error starting background task manager:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to start background task manager' },
            { status: 500 }
        )
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

        // Get the current status
        const status = backgroundTaskManager.getStatus()
        
        return NextResponse.json({
            success: true,
            data: {
                status,
                isRunning: backgroundTaskManager.isRunning,
                message: backgroundTaskManager.isRunning 
                    ? 'Background tasks are running' 
                    : 'Background tasks are stopped'
            }
        })
        
    } catch (error) {
        console.error('Error getting background task manager status:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to get background task manager status' },
            { status: 500 }
        )
    }
}
