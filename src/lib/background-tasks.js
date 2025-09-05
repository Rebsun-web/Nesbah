import backgroundConnectionManager from './background-connection-manager.js'

class BackgroundTaskManager {
    constructor() {
        this.isRunning = false
        this.tasks = {}
        this.taskIntervals = {
            statusTransitions: 5 * 60 * 1000,  // 5 minutes - critical for auction transitions
            auctionMonitor: 10 * 60 * 1000,   // 10 minutes - check for urgent applications
            statusConsistency: 30 * 60 * 1000, // 30 minutes - less frequent consistency checks
            healthCheck: 60 * 60 * 1000       // 60 minutes - health checks
        }
        this.connectionTimeout = 30000 // 30 seconds max for any database operation
        this.maxRetries = 3
        this.retryDelay = 5000 // 5 seconds between retries
    }

    // Start all background tasks
    start() {
        if (this.isRunning) {
            console.log('⚠️  Background task manager is already running')
            return
        }

        console.log('🚀 Starting Background Task Manager...')
        this.isRunning = true

        // Start status transition monitoring with better connection management
        this.tasks.statusTransitions = setInterval(async () => {
            try {
                await this.executeWithConnectionRetry('statusTransitions', () => this.checkStatusTransitions())
            } catch (error) {
                console.error('❌ Error in status transitions task:', error)
            }
        }, this.taskIntervals.statusTransitions)

        // Start auction monitoring
        this.tasks.auctionMonitor = setInterval(async () => {
            try {
                await this.executeWithConnectionRetry('auctionMonitor', () => this.checkAuctionStatus())
            } catch (error) {
                console.error('❌ Error in auction monitoring task:', error)
            }
        }, this.taskIntervals.auctionMonitor)

        // Start status consistency monitoring
        this.tasks.statusConsistency = setInterval(async () => {
            try {
                await this.executeWithConnectionRetry('statusConsistency', () => this.checkStatusConsistency())
            } catch (error) {
                console.error('❌ Error in status consistency task:', error)
            }
        }, this.taskIntervals.statusConsistency)

        // Start health checks
        this.tasks.healthCheck = setInterval(async () => {
            try {
                await this.executeWithConnectionRetry('healthCheck', () => this.performHealthChecks())
            } catch (error) {
                console.error('❌ Error in health check task:', error)
            }
        }, this.taskIntervals.healthCheck)

        console.log('✅ Background Task Manager started successfully')
        console.log('📊 Active tasks:')
        console.log('   - Status Transitions: ACTIVE (every 5 minutes) - Critical for auction transitions')
        console.log('   - Auction Status: ACTIVE (every 10 minutes) - Monitor urgent applications')
        console.log('   - Status Consistency: ACTIVE (every 30 minutes) - Check for inconsistencies')
        console.log('   - Health Checks: ACTIVE (every 60 minutes) - System health monitoring')
        console.log('🔧 Connection management: Enhanced with dedicated connection manager')
    }

    // Stop all background tasks
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Background task manager is not running')
            return
        }

        console.log('🛑 Stopping Background Task Manager...')
        this.isRunning = false

        // Clear all intervals
        Object.values(this.tasks).forEach(interval => {
            if (interval) {
                clearInterval(interval)
            }
        })

        // Release all active connections but don't close the pool
        backgroundConnectionManager.releaseAllConnections()

        // Reset tasks
        this.tasks = {}

        console.log('✅ Background Task Manager stopped')
    }

    // Get task status
    getStatus() {
        return {
            isRunning: this.isRunning,
            tasks: Object.keys(this.tasks).map(taskName => ({
                name: taskName,
                isActive: !!this.tasks[taskName],
                interval: this.taskIntervals[taskName]
            })),
            connectionSettings: {
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay,
                connectionTimeout: this.connectionTimeout
            },
            connectionManager: backgroundConnectionManager.getStatus()
        }
    }

    // Execute task with connection retry and proper cleanup using connection manager
    async executeWithConnectionRetry(taskName, taskFunction) {
        let attempts = 0

        while (attempts < this.maxRetries) {
            try {
                // Use the connection manager for better connection handling
                const result = await backgroundConnectionManager.executeWithConnection(taskName, taskFunction)
                
                // Success - break out of retry loop
                return result

            } catch (error) {
                attempts++
                console.error(`❌ Task ${taskName} failed (attempt ${attempts}/${this.maxRetries}):`, error.message)

                if (attempts >= this.maxRetries) {
                    console.error(`❌ Max retries reached for ${taskName}, task failed permanently`)
                    throw error
                }

                // Wait before retry with exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempts - 1)
                console.log(`⏳ Retrying ${taskName} in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    // Check status transitions for applications
    async checkStatusTransitions(client) {
        try {
            console.log('⏰ Checking status transitions...')
            
            // Use the dedicated AuctionExpiryHandler for consistent status transitions
            const { AuctionExpiryHandler } = await import('./auction-expiry-handler.js')
            
            // Handle expired auctions using the dedicated handler
            const result = await AuctionExpiryHandler.handleExpiredAuctions()
            
            if (result.processed > 0) {
                console.log(`✅ Status transitions completed: ${result.processed} applications processed (${result.completed} completed, ${result.ignored} ignored)`)
            } else {
                console.log('ℹ️ No status transitions needed')
            }
            
        } catch (error) {
            console.error('❌ Status transitions error:', error)
            throw error // Re-throw to trigger retry logic
        }
    }

    // Check auction status
    async checkAuctionStatus(client) {
        try {
            console.log('⏰ Checking auction status...')
            
            // Import and use the AuctionExpiryHandler for proper 48-hour auction handling
            const { AuctionExpiryHandler } = await import('./auction-expiry-handler.js')
            
            // Handle expired auctions using the dedicated handler
            const result = await AuctionExpiryHandler.handleExpiredAuctions()
            
            if (result.processed > 0) {
                console.log(`✅ Processed ${result.processed} expired auctions (${result.completed} completed, ${result.ignored} ignored)`)
            } else {
                console.log('ℹ️ No expired auctions found')
            }
            
            // Also check for urgent applications (within 2 hours of expiry)
            const urgentApplications = await AuctionExpiryHandler.getUrgentApplications()
            if (urgentApplications.length > 0) {
                console.log(`⚠️ Found ${urgentApplications.length} applications approaching auction expiry`)
                urgentApplications.forEach(app => {
                    console.log(`   - App #${app.application_id} (${app.trade_name}): ${app.hours_until_expiry.toFixed(1)} hours until expiry`)
                })
            }
            
        } catch (error) {
            console.error('❌ Auction status error:', error)
            throw error // Re-throw to trigger retry logic
        }
    }

    // Check and fix status inconsistencies
    async checkStatusConsistency(client) {
        try {
            console.log('🔧 Checking status consistency...')
            
            // Use the new validation utility for better consistency
            console.log('🔄 Using enhanced status validation utility...');
            
            // Import the validation utility dynamically to avoid circular imports
            const { validateAllApplicationStatuses } = await import('./status-validation.js');
            
            const summary = await validateAllApplicationStatuses();
            
            if (summary.corrected > 0) {
                console.log(`🔄 Status consistency check completed: ${summary.corrected} statuses corrected`);
                console.log(`📊 Summary: ${summary.total} total, ${summary.correct} correct, ${summary.corrected} corrected, ${summary.errors} errors`);
            } else {
                console.log('✅ All application statuses are consistent');
            }
            
        } catch (error) {
            console.error('❌ Status consistency check error:', error);
            // Don't throw error - this is not critical for the main workflow
        }
    }

    // Perform health checks
    async performHealthChecks(client) {
        try {
            console.log('🏥 Performing health checks...')
            
            // Simple health check query
            const result = await client.query('SELECT 1 as health_check')
            
            if (result.rows[0]?.health_check === 1) {
                console.log('✅ Database health check passed')
            } else {
                throw new Error('Health check query returned unexpected result')
            }
        } catch (error) {
            console.error('❌ Health check error:', error)
            throw error // Re-throw to trigger retry logic
        }
    }

    // Helper method to transition application status
    async transitionApplication(applicationId, fromStatus, toStatus, reason, client) {
        try {
            // Update application status in pos_application table
            const updateResult = await client.query(
                'UPDATE pos_application SET status = $1, current_application_status = $1, updated_at = NOW() WHERE application_id = $2 AND status = $3',
                [toStatus, applicationId, fromStatus]
            )

            if (updateResult.rowCount === 0) {
                console.warn(`⚠️ No rows updated for application ${applicationId} (status may have changed)`)
                return
            }

            // Try to log the transition (if table exists)
            try {
                await client.query(
                    'INSERT INTO application_status_logs (application_id, from_status, to_status, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
                    [applicationId, fromStatus, toStatus, reason]
                )
            } catch (logError) {
                // Log table might not exist, that's okay
                console.log(`📝 Note: Could not log status transition to application_status_logs: ${logError.message}`)
            }

            console.log(`🔄 Application ${applicationId} transitioned from ${fromStatus} to ${toStatus}: ${reason}`)
        } catch (error) {
            console.error(`❌ Error transitioning application ${applicationId}:`, error)
            throw error // Re-throw to trigger retry logic
        }
    }

    // Get task status
    getStatus() {
        return {
            isRunning: this.isRunning,
            tasks: Object.keys(this.tasks).map(taskName => ({
                name: taskName,
                isActive: !!this.tasks[taskName],
                interval: this.taskIntervals[taskName]
            })),
            connectionSettings: {
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay,
                connectionTimeout: this.connectionTimeout
            },
            connectionManager: backgroundConnectionManager.getStatus()
        }
    }

    // Force cleanup of any remaining connections (emergency method)
    async forceCleanup() {
        try {
            console.log('🧹 Force cleanup initiated...')
            
            // Stop all tasks
            this.stop()
            
            // Cleanup connections using connection manager
            await backgroundConnectionManager.emergencyCleanup()
            
            // Wait a moment for any ongoing operations to complete
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            console.log('✅ Force cleanup completed')
        } catch (error) {
            console.error('❌ Force cleanup error:', error)
        }
    }
}

// Export singleton instance
const backgroundTaskManager = new BackgroundTaskManager()

// Background task manager is now auto-started via auto-start-background-tasks.js
// This ensures it runs as soon as the application starts without manual intervention
if (typeof window === 'undefined') {
    // Only log on server side
    console.log('🚀 Background Task Manager ready (auto-start enabled)')
    console.log('⏳ Background tasks will start automatically when the server is ready')
}

export default backgroundTaskManager