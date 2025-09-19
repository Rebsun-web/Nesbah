import { NextResponse } from 'next/server';
import backgroundTaskManager from '@/lib/background-tasks';
import AdminAuth from '@/lib/auth/admin-auth';

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
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        });
    } catch (error) {
        console.error('❌ Error getting background job status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get background job status' },
            { status: 500 }
        );
    }
}

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

        const { action } = await req.json();
        
        if (action === 'restart') {
            console.log('🔄 Admin requested background task restart...');
            
            // Stop if running
            if (backgroundTaskManager.isRunning) {
                backgroundTaskManager.stop();
                // Wait a moment for cleanup
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Start again
            backgroundTaskManager.start();
            
            const status = backgroundTaskManager.getStatus();
            
            return NextResponse.json({
                success: true,
                message: 'Background tasks restarted successfully',
                data: {
                    status,
                    restartedBy: sessionValidation.adminUser.email,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
        return NextResponse.json({
            success: false,
            error: 'Invalid action. Use "restart" to restart background tasks.'
        }, { status: 400 });
        
    } catch (error) {
        console.error('❌ Error managing background jobs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to manage background jobs' },
            { status: 500 }
        );
    }
}