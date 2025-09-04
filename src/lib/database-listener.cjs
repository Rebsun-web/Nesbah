import pool from './db.js'

class DatabaseListener {
    constructor() {
        this.isRunning = false
        this.client = null
        this.webhookUrl = process.env.MONITORING_WEBHOOK_URL || 'http://localhost:3000/api/admin/monitoring/webhook'
        this.webhookSecret = process.env.MONITORING_WEBHOOK_SECRET || 'your-webhook-secret'
    }

    // Start listening for database notifications
    async start() {
        if (this.isRunning) {
            console.log('Database listener is already running')
            return
        }

        console.log('🔊 Starting Database Listener...')
        this.isRunning = true

        try {
            // Create a dedicated client for notifications
            this.client = await pool.connectWithRetry(2, 1000, 'database-listener')
            
            // Listen for monitoring events
            await this.client.query('LISTEN monitoring_events')
            
            // Start listening for notifications
            this.client.on('notification', async (msg) => {
                await this.handleNotification(msg)
            })

            // Handle client errors
            this.client.on('error', (err) => {
                console.error('❌ Database listener error:', err)
                this.reconnect()
            })

            console.log('✅ Database listener started successfully')
        } catch (error) {
            console.error('❌ Error starting database listener:', error)
            this.isRunning = false
            throw error
        }
    }

    // Stop listening for database notifications
    async stop() {
        if (!this.isRunning) {
            console.log('Database listener is not running')
            return
        }

        console.log('🛑 Stopping Database Listener...')
        this.isRunning = false

        try {
            if (this.client) {
                await this.client.query('UNLISTEN monitoring_events')
                this.client.release()
                this.client = null
            }
            console.log('✅ Database listener stopped')
        } catch (error) {
            console.error('❌ Error stopping database listener:', error)
            throw error
        }
    }

    // Handle database notifications
    async handleNotification(msg) {
        try {
            console.log(`📡 Received notification: ${msg.channel}`)
            
            if (msg.channel === 'monitoring_events') {
                const payload = JSON.parse(msg.payload)
                await this.forwardToWebhook(payload)
            }
        } catch (error) {
            console.error('❌ Error handling notification:', error)
        }
    }

    // Forward notification to webhook
    async forwardToWebhook(payload) {
        try {
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.webhookSecret}`
                },
                body: JSON.stringify({
                    event_type: 'database_notification',
                    payload: payload
                })
            })

            if (!response.ok) {
                throw new Error(`Webhook request failed: ${response.status}`)
            }

            console.log('✅ Notification forwarded to webhook successfully')
        } catch (error) {
            console.error('❌ Error forwarding to webhook:', error)
        }
    }

    // Reconnect on error
    async reconnect() {
        if (!this.isRunning) return

        console.log('🔄 Attempting to reconnect database listener...')
        
        try {
            await this.stop()
            await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
            await this.start()
        } catch (error) {
            console.error('❌ Reconnection failed:', error)
            // Try again in 30 seconds
            setTimeout(() => this.reconnect(), 30000)
        }
    }

    // Get listener status
    getStatus() {
        return {
            isRunning: this.isRunning,
            webhookUrl: this.webhookUrl,
            hasClient: !!this.client
        }
    }
}

// Create singleton instance
const databaseListener = new DatabaseListener()

module.exports = databaseListener
