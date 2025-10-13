import backgroundConnectionManager from './background-connection-manager.js'
import StatusSynchronizer from './status-synchronizer.js'

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
        
        // Persistent timer tracking to prevent resets
        this.lastRunTimes = {
            statusTransitions: 0,
            auctionMonitor: 0,
            statusConsistency: 0,
            healthCheck: 0
        }
        
        // Use global timers to persist across reinitializations
        this.globalTimers = global.backgroundTaskTimers || {}
        if (!global.backgroundTaskTimers) {
            global.backgroundTaskTimers = this.globalTimers
        }
    }

    // Start all background tasks
    start() {
        if (this.isRunning) {
            console.log('⚠️  Background task manager is already running')
            return
        }

        // Additional safety check - clear any existing intervals
        if (Object.keys(this.tasks).length > 0) {
            console.log('🧹 Cleaning up existing tasks before starting...')
            this.stop()
        }

        console.log('🚀 Starting Background Task Manager...')
        this.isRunning = true

        // Use persistent timers that don't reset on reinitialization
        this.startPersistentTimers()

        console.log('✅ Background Task Manager started successfully')
        console.log('📊 Active tasks:')
        console.log('   - Status Transitions: ACTIVE (every 5 minutes) - Critical for auction transitions')
        console.log('   - Auction Status: ACTIVE (every 10 minutes) - Monitor urgent applications')
        console.log('   - Status Consistency: ACTIVE (every 30 minutes) - Check for inconsistencies')
        console.log('   - Health Checks: ACTIVE (every 60 minutes) - System health monitoring')
        console.log('🔧 Connection management: Enhanced with dedicated connection manager')
    }

    // Start persistent timers that don't reset on reinitialization
    startPersistentTimers() {
        const now = Date.now()
        
        // Start status transition monitoring with persistent timing
        this.startPersistentTimer('statusTransitions', async () => {
            try {
                await this.executeWithConnectionRetry('statusTransitions', (client) => this.checkStatusTransitions(client))
            } catch (error) {
                console.error('❌ Error in status transitions task:', error)
            }
        }, this.taskIntervals.statusTransitions, now)

        // Start auction monitoring
        this.startPersistentTimer('auctionMonitor', async () => {
            try {
                await this.executeWithConnectionRetry('auctionMonitor', (client) => this.checkAuctionStatus(client))
            } catch (error) {
                console.error('❌ Error in auction monitoring task:', error)
            }
        }, this.taskIntervals.auctionMonitor, now)

        // Start status consistency monitoring
        this.startPersistentTimer('statusConsistency', async () => {
            try {
                await this.executeWithConnectionRetry('statusConsistency', (client) => this.checkStatusConsistency(client))
            } catch (error) {
                console.error('❌ Error in status consistency task:', error)
            }
        }, this.taskIntervals.statusConsistency, now)

        // Start health checks
        this.startPersistentTimer('healthCheck', async () => {
            try {
                await this.executeWithConnectionRetry('healthCheck', (client) => this.performHealthChecks(client))
            } catch (error) {
                console.error('❌ Error in health check task:', error)
            }
        }, this.taskIntervals.healthCheck, now)
    }

    // Start a persistent timer that doesn't reset on reinitialization
    startPersistentTimer(taskName, taskFunction, interval, startTime) {
        // Clear any existing timer for this task
        if (this.globalTimers[taskName]) {
            clearInterval(this.globalTimers[taskName])
        }

        // Calculate when the next run should be based on the last run time
        const lastRun = this.lastRunTimes[taskName] || startTime
        const timeSinceLastRun = startTime - lastRun
        const timeUntilNextRun = Math.max(0, interval - (timeSinceLastRun % interval))
        
        console.log(`⏰ ${taskName}: Next run in ${Math.round(timeUntilNextRun / 1000)}s (interval: ${interval / 1000}s)`)

        // Set up the timer
        const timer = setInterval(async () => {
            if (this.isRunning) {
                this.lastRunTimes[taskName] = Date.now()
                await taskFunction()
            }
        }, interval)

        // Store the timer globally so it persists across reinitializations
        this.globalTimers[taskName] = timer
        this.tasks[taskName] = timer

        // Run immediately if it's been too long since last run
        if (timeSinceLastRun >= interval) {
            console.log(`🚀 ${taskName}: Running immediately (overdue by ${Math.round(timeSinceLastRun / 1000)}s)`)
            setTimeout(async () => {
                if (this.isRunning) {
                    this.lastRunTimes[taskName] = Date.now()
                    await taskFunction()
                }
            }, 1000) // Small delay to ensure everything is ready
        }
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

        // Clear global timers
        Object.values(this.globalTimers).forEach(interval => {
            if (interval) {
                clearInterval(interval)
            }
        })

        // Release all active connections but don't close the pool
        backgroundConnectionManager.releaseAllConnections()

        // Reset tasks but keep last run times for persistence
        this.tasks = {}
        // Don't reset lastRunTimes to maintain timing continuity

        console.log('✅ Background Task Manager stopped')
    }

    // Get task status
    getStatus() {
        const now = Date.now()
        return {
            isRunning: this.isRunning,
            tasks: Object.keys(this.taskIntervals).map(taskName => {
                const lastRun = this.lastRunTimes[taskName] || 0
                const timeSinceLastRun = now - lastRun
                const timeUntilNextRun = Math.max(0, this.taskIntervals[taskName] - (timeSinceLastRun % this.taskIntervals[taskName]))
                
                return {
                    name: taskName,
                    isActive: !!this.tasks[taskName],
                    interval: this.taskIntervals[taskName],
                    lastRun: lastRun ? new Date(lastRun).toISOString() : 'Never',
                    timeSinceLastRun: Math.round(timeSinceLastRun / 1000),
                    timeUntilNextRun: Math.round(timeUntilNextRun / 1000)
                }
            }),
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
            
            // First, synchronize all application statuses to ensure consistency
            console.log('🔄 Synchronizing application statuses...')
            const syncResult = await StatusSynchronizer.synchronizeAllApplicationStatuses(client)
            
            if (syncResult.synchronized > 0) {
                console.log(`✅ Status synchronization: ${syncResult.synchronized} applications updated`)
            }
            
            // Then handle any expired auctions that need processing
            const { AuctionExpiryHandler } = await import('./auction-expiry-handler.js')
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

    // Get monitoring statistics
    getMonitoringStats() {
        return {
            isRunning: this.isRunning,
            activeTasks: Object.keys(this.tasks).length,
            lastRunTimes: { ...this.lastRunTimes },
            taskIntervals: { ...this.taskIntervals },
            connectionTimeout: this.connectionTimeout,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
        }
    }

    // Get performance metrics
    getPerformanceMetrics() {
        const now = Date.now()
        const metrics = {}
        
        Object.keys(this.lastRunTimes).forEach(taskName => {
            const lastRun = this.lastRunTimes[taskName]
            const interval = this.taskIntervals[taskName]
            const nextRun = lastRun + interval
            const timeUntilNext = Math.max(0, nextRun - now)
            
            metrics[taskName] = {
                lastRun: lastRun ? new Date(lastRun).toISOString() : 'Never',
                nextRun: new Date(nextRun).toISOString(),
                timeUntilNext: timeUntilNext,
                isOverdue: timeUntilNext === 0 && lastRun > 0,
                interval: interval
            }
        })
        
        return metrics
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
    
    // Prevent multiple instances in development
    if (!global.backgroundTaskManagerInstance) {
        global.backgroundTaskManagerInstance = backgroundTaskManager
    }
}

export default backgroundTaskManager