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

        const jobStatus = backgroundJobManager.getJobStatus()
        
        return NextResponse.json({
            success: true,
            data: jobStatus
        })
    } catch (error) {
        console.error('Error fetching background job status:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch background job status' },
            { status: 500 }
        )
    }
}

export async function POST(req) {
    try {
        // Admin authentication
        const authResult = await AdminAuth.authenticateRequest(req)
        if (!authResult.success) {
            return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
        }

        const body = await req.json()
        const { action, jobName, config } = body

        let result

        switch (action) {
            case 'start':
                await backgroundJobManager.start()
                result = { message: 'Background jobs started successfully' }
                break
            case 'stop':
                await backgroundJobManager.stop()
                result = { message: 'Background jobs stopped successfully' }
                break
            case 'restart':
                if (!jobName) {
                    return NextResponse.json(
                        { success: false, error: 'Job name is required for restart action' },
                        { status: 400 }
                    )
                }
                await backgroundJobManager.restartJob(jobName)
                result = { message: `Job ${jobName} restarted successfully` }
                break
            case 'update_config':
                if (!jobName || !config) {
                    return NextResponse.json(
                        { success: false, error: 'Job name and config are required for update action' },
                        { status: 400 }
                    )
                }
                backgroundJobManager.updateJobConfig(jobName, config)
                result = { message: `Job ${jobName} configuration updated successfully` }
                break
            case 'manual_check':
                const checkType = body.checkType || 'all'
                await backgroundJobManager.triggerManualCheck(checkType)
                result = { message: `Manual check ${checkType} triggered successfully` }
                break
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (error) {
        console.error('Error controlling background jobs:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to control background jobs' },
            { status: 500 }
        )
    }
}
