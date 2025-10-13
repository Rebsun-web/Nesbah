import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Get background task status if available
        let backgroundTaskStatus = 'unknown'
        let isRunning = false
        
        try {
            const { default: backgroundTaskManager } = await import('@/lib/background-tasks')
            const status = backgroundTaskManager.getStatus()
            isRunning = status.isRunning
            backgroundTaskStatus = isRunning ? 'running' : 'stopped'
            
            // Additional check: if status shows running but no active tasks, mark as stopped
            if (isRunning && status.tasks && status.tasks.length === 0) {
                isRunning = false
                backgroundTaskStatus = 'stopped'
            }
        } catch (error) {
            backgroundTaskStatus = 'error'
            console.warn('Could not get background task status:', error.message)
        }

        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            backgroundTasks: {
                status: backgroundTaskStatus,
                isRunning,
                message: isRunning 
                    ? 'Background tasks are running and monitoring application statuses' 
                    : 'Background tasks are not running'
            },
            environment: process.env.NODE_ENV || 'development'
        }

        return NextResponse.json(healthData, { status: 200 })
        
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json(
            { 
                status: 'unhealthy', 
                error: error.message,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}
