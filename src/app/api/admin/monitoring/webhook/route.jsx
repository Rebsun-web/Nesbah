import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import eventDrivenMonitor from '@/lib/event-driven-monitoring.cjs'

export async function POST(req) {
    try {
        // Verify webhook secret for security
        const authHeader = req.headers.get('authorization')
        const webhookSecret = process.env.MONITORING_WEBHOOK_SECRET
        
        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { event_type, payload } = body

        // Process the event
        await eventDrivenMonitor.processEvent(payload)

        return NextResponse.json({ success: true, message: 'Event processed successfully' })
    } catch (error) {
        console.error('❌ Webhook processing error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function GET(req) {
    try {
        // Admin authentication for manual trigger
        const authResult = await AdminAuth.authenticateRequest(req)
        if (!authResult.success) {
            return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
        }

        // Get monitoring statistics
        const stats = await eventDrivenMonitor.getMonitoringStats()

        return NextResponse.json({ 
            success: true, 
            data: {
                isRunning: eventDrivenMonitor.isRunning,
                stats: stats
            }
        })
    } catch (error) {
        console.error('❌ Error getting monitoring stats:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
