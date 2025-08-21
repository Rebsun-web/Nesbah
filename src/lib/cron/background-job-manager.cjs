const eventDrivenMonitor = require('../event-driven-monitor.cjs');

class BackgroundJobManager {
    constructor() {
        this.isRunning = false
        this.healthCheckInterval = null
        this.healthCheckIntervalMs = 300000 // 5 minutes (reduced frequency)
    }

    // Start all background jobs
    async start() {
        if (this.isRunning) {
            console.log('Background job manager is already running')
            return
        }

        console.log('🚀 Starting Event-Driven Background Job Manager...')
        this.isRunning = true

        try {
            // Start event-driven monitoring
            await eventDrivenMonitor.start()
            console.log('✅ Event-driven monitor started')

            // Start health check monitoring (reduced frequency)
            this.startHealthChecks()

            console.log('✅ All background jobs started successfully')
        } catch (error) {
            console.error('❌ Error starting background jobs:', error)
            this.isRunning = false
            throw error
        }
    }

    // Stop all background jobs
    async stop() {
        if (!this.isRunning) {
            console.log('Background job manager is not running')
            return
        }

        console.log('🛑 Stopping Event-Driven Background Job Manager...')
        this.isRunning = false

        try {
            // Stop event-driven monitoring
            await eventDrivenMonitor.stop()
            console.log('✅ Event-driven monitor stopped')

            // Stop health checks
            this.stopHealthChecks()

            console.log('✅ All background jobs stopped successfully')
        } catch (error) {
            console.error('❌ Error stopping background jobs:', error)
            throw error
        }
    }

    // Start health check monitoring (reduced frequency)
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks()
        }, this.healthCheckIntervalMs)

        console.log('✅ Health check monitoring started (every 5 minutes)')
    }

    // Stop health check monitoring
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval)
            this.healthCheckInterval = null
        }

        console.log('✅ Health check monitoring stopped')
    }

    // Perform health checks on all jobs
    async performHealthChecks() {
        try {
            console.log('🏥 Performing background job health checks...')

            const healthStatus = {
                timestamp: new Date().toISOString(),
                overall: 'healthy',
                jobs: {}
            }

            // Check event-driven monitor health
            healthStatus.jobs.eventDrivenMonitor = {
                name: 'Event-Driven Monitor',
                status: eventDrivenMonitor.isRunning ? 'running' : 'stopped',
                lastCheck: new Date().toISOString(),
                issues: []
            }

            if (!eventDrivenMonitor.isRunning) {
                healthStatus.jobs.eventDrivenMonitor.issues.push('Monitor is not running')
                healthStatus.overall = 'degraded'
            }

            // Store health status
            await this.storeHealthStatus(healthStatus)

            // Create alerts for unhealthy jobs
            if (healthStatus.overall === 'degraded') {
                await this.createHealthAlert(healthStatus)
            }

            console.log(`✅ Health checks completed. Overall status: ${healthStatus.overall}`)

        } catch (error) {
            console.error('❌ Error in health checks:', error)
            await this.createSystemAlert('system_error', 'high', 'Health Check Error', error.message)
        }
    }

    // Store health status in database
    async storeHealthStatus(healthStatus) {
        const pool = require('../db.cjs')
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO business_intelligence_metrics 
                    (metric_name, metric_value, metric_unit, calculation_date, time_period, category, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                'background_job_health',
                healthStatus.overall === 'healthy' ? 1 : 0,
                'status',
                new Date().toISOString().split('T')[0],
                'realtime',
                'performance'
            ])

        } catch (error) {
            console.error('❌ Error storing health status:', error)
        } finally {
            client.release()
        }
    }

    // Create health alert
    async createHealthAlert(healthStatus) {
        const issues = []
        for (const [jobName, jobStatus] of Object.entries(healthStatus.jobs)) {
            if (jobStatus.issues.length > 0) {
                issues.push(`${jobStatus.name}: ${jobStatus.issues.join(', ')}`)
            }
        }

        await this.createSystemAlert(
            'system_error',
            'high',
            'Background Job Health Issue',
            `Background jobs are experiencing issues: ${issues.join('; ')}`,
            'system'
        )
    }

    // Create system alert
    async createSystemAlert(alertType, severity, title, message, entityType = null, entityId = null) {
        const pool = require('../db.cjs')
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [alertType, severity, title, message, entityType, entityId])

            console.log(`🚨 Created health alert: ${title}`)
        } catch (error) {
            console.error('❌ Error creating health alert:', error)
        } finally {
            client.release()
        }
    }

    // Get job status
    getJobStatus() {
        const status = {
            manager: {
                isRunning: this.isRunning,
                timestamp: new Date().toISOString()
            },
            jobs: {
                eventDrivenMonitor: {
                    isRunning: eventDrivenMonitor.isRunning,
                    lastCheck: new Date().toISOString()
                }
            }
        }

        return status
    }

    // Restart a specific job
    async restartJob(jobName) {
        if (jobName !== 'eventDrivenMonitor') {
            throw new Error(`Job ${jobName} not found`)
        }

        console.log(`🔄 Restarting job: ${jobName}`)

        try {
            // Stop the job
            await eventDrivenMonitor.stop()

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Start the job
            await eventDrivenMonitor.start()

            console.log(`✅ Job ${jobName} restarted successfully`)
        } catch (error) {
            console.error(`❌ Error restarting job ${jobName}:`, error)
            throw error
        }
    }

    // Get monitoring statistics
    async getMonitoringStats() {
        try {
            const stats = {
                eventDrivenMonitor: await eventDrivenMonitor.getMonitoringStats(),
                urgentApplications: await eventDrivenMonitor.getUrgentApplications()
            }

            return stats
        } catch (error) {
            console.error('❌ Error getting monitoring stats:', error)
            throw error
        }
    }

    // Update job configuration
    updateJobConfig(jobName, config) {
        if (jobName !== 'eventDrivenMonitor') {
            throw new Error(`Job ${jobName} not found`)
        }

        console.log(`✅ Updated ${jobName} configuration`)
        return this.getJobStatus()
    }

    // Get system performance metrics
    async getPerformanceMetrics() {
        const pool = require('../db.cjs')
        const client = await pool.connect()
        
        try {
            // Get recent performance metrics
            const metrics = await client.query(`
                SELECT 
                    metric_name,
                    metric_value,
                    metric_unit,
                    calculation_date,
                    time_period,
                    category
                FROM business_intelligence_metrics
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                AND category IN ('performance', 'revenue', 'conversion')
                ORDER BY created_at DESC
            `)

            return metrics.rows
        } finally {
            client.release()
        }
    }

    // Manual trigger for specific checks
    async triggerManualCheck(checkType) {
        console.log(`🔧 Triggering manual check: ${checkType}`)

        try {
            switch (checkType) {
                case 'health':
                    await this.performHealthChecks()
                    break
                case 'all':
                    await this.performHealthChecks()
                    break
                default:
                    throw new Error(`Unknown check type: ${checkType}`)
            }

            console.log(`✅ Manual check ${checkType} completed successfully`)
        } catch (error) {
            console.error(`❌ Error in manual check ${checkType}:`, error)
            throw error
        }
    }
}

// Create singleton instance
const backgroundJobManager = new BackgroundJobManager()

module.exports = backgroundJobManager
