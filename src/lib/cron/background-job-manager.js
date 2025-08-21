import statusTransitionMonitor from './status-transitions.js'
import revenueMonitor from './revenue-monitor.js'

class BackgroundJobManager {
    constructor() {
        this.jobs = {
            statusTransitions: statusTransitionMonitor,
            revenueMonitor: revenueMonitor
        }
        this.isRunning = false
        this.healthCheckInterval = null
        this.healthCheckIntervalMs = 300000 // 5 minutes
    }

    // Start all background jobs
    async start() {
        if (this.isRunning) {
            console.log('Background job manager is already running')
            return
        }

        console.log('🚀 Starting Background Job Manager...')
        this.isRunning = true

        try {
            // Start status transition monitoring
            await this.jobs.statusTransitions.start()
            console.log('✅ Status transition monitor started')

            // Start revenue monitoring
            await this.jobs.revenueMonitor.start()
            console.log('✅ Revenue monitor started')

            // Start health check monitoring
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

        console.log('🛑 Stopping Background Job Manager...')
        this.isRunning = false

        try {
            // Stop status transition monitoring
            this.jobs.statusTransitions.stop()
            console.log('✅ Status transition monitor stopped')

            // Stop revenue monitoring
            this.jobs.revenueMonitor.stop()
            console.log('✅ Revenue monitor stopped')

            // Stop health checks
            this.stopHealthChecks()

            console.log('✅ All background jobs stopped successfully')
        } catch (error) {
            console.error('❌ Error stopping background jobs:', error)
            throw error
        }
    }

    // Start health check monitoring
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks()
        }, this.healthCheckIntervalMs)

        console.log('✅ Health check monitoring started')
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

            // Check status transition monitor health
            healthStatus.jobs.statusTransitions = {
                name: 'Status Transition Monitor',
                status: this.jobs.statusTransitions.isRunning ? 'running' : 'stopped',
                lastCheck: new Date().toISOString(),
                issues: []
            }

            if (!this.jobs.statusTransitions.isRunning) {
                healthStatus.jobs.statusTransitions.issues.push('Monitor is not running')
                healthStatus.overall = 'degraded'
            }

            // Check revenue monitor health
            healthStatus.jobs.revenueMonitor = {
                name: 'Revenue Monitor',
                status: this.jobs.revenueMonitor.isRunning ? 'running' : 'stopped',
                lastCheck: new Date().toISOString(),
                issues: []
            }

            if (!this.jobs.revenueMonitor.isRunning) {
                healthStatus.jobs.revenueMonitor.issues.push('Monitor is not running')
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
        const pool = await import('../db.cjs')
        const client = await pool.default.connect()
        
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
        const pool = await import('../db.cjs')
        const client = await pool.default.connect()
        
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
            jobs: {}
        }

        for (const [jobName, job] of Object.entries(this.jobs)) {
            status.jobs[jobName] = {
                isRunning: job.isRunning,
                checkInterval: job.checkInterval,
                lastCheck: new Date().toISOString()
            }
        }

        return status
    }

    // Restart a specific job
    async restartJob(jobName) {
        if (!this.jobs[jobName]) {
            throw new Error(`Job ${jobName} not found`)
        }

        console.log(`🔄 Restarting job: ${jobName}`)

        try {
            // Stop the job
            this.jobs[jobName].stop()

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Start the job
            await this.jobs[jobName].start()

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
                statusTransitions: await this.jobs.statusTransitions.getMonitoringStats(),
                revenue: await this.jobs.revenueMonitor.getRevenueStats(),
                urgentApplications: await this.jobs.statusTransitions.getUrgentApplications(),
                revenueTrends: await this.jobs.revenueMonitor.getRevenueTrends()
            }

            return stats
        } catch (error) {
            console.error('❌ Error getting monitoring stats:', error)
            throw error
        }
    }

    // Update job configuration
    updateJobConfig(jobName, config) {
        if (!this.jobs[jobName]) {
            throw new Error(`Job ${jobName} not found`)
        }

        if (config.checkInterval) {
            this.jobs[jobName].checkInterval = config.checkInterval
            console.log(`✅ Updated ${jobName} check interval to ${config.checkInterval}ms`)
        }

        return this.getJobStatus()
    }

    // Get system performance metrics
    async getPerformanceMetrics() {
        const pool = await import('../db.cjs')
        const client = await pool.default.connect()
        
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
                case 'status_transitions':
                    await this.jobs.statusTransitions.performStatusChecks()
                    break
                case 'revenue':
                    await this.jobs.revenueMonitor.performRevenueChecks()
                    break
                case 'health':
                    await this.performHealthChecks()
                    break
                case 'all':
                    await this.jobs.statusTransitions.performStatusChecks()
                    await this.jobs.revenueMonitor.performRevenueChecks()
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

export default backgroundJobManager
