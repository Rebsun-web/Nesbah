import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import backgroundJobManager from '@/lib/cron/background-job-manager'

export async function GET(req) {
    try {
        // Admin authentication
        const authResult = await AdminAuth.authenticateRequest(req)
        if (!authResult.success) {
            return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
        }

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
