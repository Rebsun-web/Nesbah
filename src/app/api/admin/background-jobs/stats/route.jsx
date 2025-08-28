import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import backgroundJobManager from '@/lib/cron/background-job-manager'

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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const monitoringStats = await backgroundJobManager.getMonitoringStats()
        const performanceMetrics = await backgroundJobManager.getPerformanceMetrics()
        
        return NextResponse.json({
            success: true,
            data: {
                monitoringStats,
                performanceMetrics
            }
        })
    } catch (error) {
        console.error('Error fetching background job statistics:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch background job statistics' },
            { status: 500 }
        )
    }
}
