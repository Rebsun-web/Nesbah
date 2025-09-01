import { NextResponse } from 'next/server'
import backgroundTaskManager from '@/lib/background-tasks'
import backgroundConnectionManager from '@/lib/background-connection-manager'

export async function GET() {
    try {
        // Get background task status
        const taskStatus = backgroundTaskManager.getStatus()
        
        // Get connection manager status
        const connectionStatus = await backgroundConnectionManager.healthCheck()
        
        // Get database pool status
        const poolStatus = connectionStatus.poolStatus || {}
        
        const status = {
            timestamp: new Date().toISOString(),
            backgroundTasks: {
                isRunning: taskStatus.isRunning,
                tasks: taskStatus.tasks,
                connectionSettings: taskStatus.connectionSettings
            },
            connections: {
                background: connectionStatus.backgroundConnections,
                pool: poolStatus,
                overall: connectionStatus.healthy
            },
            recommendations: []
        }
        
        // Add recommendations based on status
        if (poolStatus.waitingCount > 0) {
            status.recommendations.push({
                type: 'warning',
                message: `${poolStatus.waitingCount} requests are waiting for database connections`,
                action: 'Consider increasing connection pool size or reducing concurrent load'
            })
        }
        
        if (poolStatus.totalCount >= poolStatus.max * 0.8) {
            status.recommendations.push({
                type: 'warning',
                message: `Connection pool is at ${Math.round((poolStatus.totalCount / poolStatus.max) * 100)}% capacity`,
                action: 'Monitor connection usage and consider optimization'
            })
        }
        
        if (connectionStatus.backgroundConnections?.staleConnections > 0) {
            status.recommendations.push({
                type: 'warning',
                message: `${connectionStatus.backgroundConnections.staleConnections} stale connections detected`,
                action: 'Stale connections will be automatically cleaned up'
            })
        }
        
        if (!taskStatus.isRunning) {
            status.recommendations.push({
                type: 'info',
                message: 'Background tasks are not running',
                action: 'Use POST /api/admin/background-jobs/start to start tasks'
            })
        }
        
        return NextResponse.json(status, { status: 200 })
        
    } catch (error) {
        console.error('❌ Error getting background jobs status:', error)
        return NextResponse.json(
            { 
                error: 'Failed to get background jobs status',
                details: error.message 
            }, 
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const { action } = await request.json()
        
        switch (action) {
            case 'start':
                backgroundTaskManager.start()
                return NextResponse.json({ 
                    message: 'Background tasks started successfully',
                    status: backgroundTaskManager.getStatus()
                })
                
            case 'stop':
                backgroundTaskManager.stop()
                return NextResponse.json({ 
                    message: 'Background tasks stopped successfully',
                    status: backgroundTaskManager.getStatus()
                })
                
            case 'cleanup':
                await backgroundTaskManager.forceCleanup()
                return NextResponse.json({ 
                    message: 'Force cleanup completed successfully',
                    status: backgroundTaskManager.getStatus()
                })
                
            case 'emergency_cleanup':
                await backgroundConnectionManager.emergencyCleanup()
                return NextResponse.json({ 
                    message: 'Emergency connection cleanup completed',
                    status: await backgroundConnectionManager.healthCheck()
                })
                
            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: start, stop, cleanup, or emergency_cleanup' },
                    { status: 400 }
                )
        }
        
    } catch (error) {
        console.error('❌ Error performing background job action:', error)
        return NextResponse.json(
            { 
                error: 'Failed to perform background job action',
                details: error.message 
            }, 
            { status: 500 }
        )
    }
}
