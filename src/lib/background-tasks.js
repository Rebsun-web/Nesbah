import pool from './db.cjs'

class BackgroundTaskManager {
    constructor() {
        this.isRunning = false
        this.tasks = {
            statusTransitions: null,
            revenueMonitor: null,
            auctionMonitor: null,
            healthCheck: null
        }
        this.taskIntervals = {
            statusTransitions: 300000, // 5 minutes (reduced from 1 minute)
            revenueMonitor: 600000,   // 10 minutes (reduced from 5 minutes)
            auctionMonitor: 300000,   // 5 minutes (reduced from 2 minutes)
            healthCheck: 600000       // 10 minutes (reduced from 5 minutes)
        }
    }

    // Start all background tasks
    start() {
        if (this.isRunning) {
            console.log('⚠️  Background task manager is already running')
            return
        }

        console.log('🚀 Starting Background Task Manager...')
        this.isRunning = true

        // TEMPORARILY DISABLED: Background tasks causing connection pool exhaustion
        console.log('⚠️  Background tasks temporarily disabled to prevent connection pool exhaustion')
        
        // Start status transition monitoring
        // this.tasks.statusTransitions = setInterval(() => {
        //     this.checkStatusTransitions()
        // }, this.taskIntervals.statusTransitions)

        // Start revenue monitoring
        // this.tasks.revenueMonitor = setInterval(() => {
        //     this.checkRevenueCollections()
        // }, this.taskIntervals.revenueMonitor)

        // Start auction monitoring
        // this.tasks.auctionMonitor = setInterval(() => {
        //     this.checkAuctionStatus()
        // }, this.taskIntervals.auctionMonitor)

        // Start health checks
        // this.tasks.healthCheck = setInterval(() => {
        //     this.performHealthChecks()
        // }, this.taskIntervals.healthCheck)

        console.log('✅ Background Task Manager started successfully (tasks disabled)')
        console.log('📊 Active tasks:')
        console.log('   - Status Transitions: DISABLED')
        console.log('   - Revenue Collections: DISABLED')
        console.log('   - Auction Status: DISABLED')
        console.log('   - Health Checks: DISABLED')
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

        // Reset tasks
        this.tasks = {
            statusTransitions: null,
            revenueMonitor: null,
            auctionMonitor: null,
            healthCheck: null
        }

        console.log('✅ Background Task Manager stopped')
    }

    // Check status transitions for applications
    async checkStatusTransitions() {
        try {
            await pool.withConnection(async (client) => {
                // Find live_auction applications that have expired (48-hour period ended)
                const result = await client.query(`
                    SELECT 
                        sa.application_id,
                        sa.status,
                        sa.offers_count,
                        sa.auction_end_time,
                        pa.trade_name,
                        EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                    FROM submitted_applications sa
                    JOIN pos_application pa ON sa.application_id = pa.application_id
                    WHERE sa.status = 'live_auction'
                    AND sa.auction_end_time <= NOW()
                    ORDER BY sa.auction_end_time ASC
                    LIMIT 50
                `)

                for (const app of result.rows) {
                    if (app.offers_count > 0) {
                        // Auction ended with offers, transition to completed
                        await this.transitionApplication(
                            app.application_id,
                            'live_auction',
                            'completed',
                            'Automated transition: Auction ended with offers',
                            client
                        )
                    } else {
                        // Auction ended without offers, transition to ignored
                        await this.transitionApplication(
                            app.application_id,
                            'live_auction',
                            'ignored',
                            'Automated transition: Auction ended without offers',
                            client
                        )
                    }
                }

                if (result.rows.length > 0) {
                    console.log(`⏰ Processed ${result.rows.length} live_auction applications`)
                }
            })
        } catch (error) {
            console.error('❌ Status transitions error:', error)
            // Don't throw the error to prevent task from stopping
        }
    }

    // Check revenue collections
    async checkRevenueCollections() {
        try {
            await pool.withConnection(async (client) => {
                // Check for pending collections that are older than 1 hour
                const result = await client.query(`
                    SELECT 
                        rc.collection_id,
                        rc.application_id,
                        rc.bank_user_id,
                        rc.amount,
                        rc.status,
                        rc.timestamp,
                        EXTRACT(EPOCH FROM (NOW() - rc.timestamp))/3600 as hours_since_creation
                    FROM revenue_collections rc
                    WHERE rc.status = 'pending'
                    AND rc.timestamp <= NOW() - INTERVAL '1 hour'
                    ORDER BY rc.timestamp ASC
                `)

                for (const collection of result.rows) {
                    // Mark as failed if pending for too long
                    await client.query(
                        'UPDATE revenue_collections SET status = $1, updated_at = NOW() WHERE collection_id = $2',
                        ['failed', collection.collection_id]
                    )
                }

                if (result.rows.length > 0) {
                    console.log(`💰 Processed ${result.rows.length} pending revenue collections`)
                }
            })
        } catch (error) {
            console.error('❌ Revenue collections error:', error)
        }
    }

    // Check auction status
    async checkAuctionStatus() {
        try {
            await pool.withConnection(async (client) => {
                // Check for expired auctions
                const result = await client.query(`
                    SELECT 
                        sa.application_id,
                        sa.auction_end_time,
                        pa.trade_name
                    FROM submitted_applications sa
                    JOIN pos_application pa ON sa.application_id = pa.application_id
                    WHERE sa.status = 'live_auction'
                    AND sa.auction_end_time <= NOW()
                    AND sa.offers_count = 0
                `)

                for (const auction of result.rows) {
                    await this.transitionApplication(
                        auction.application_id,
                        'live_auction',
                        'ignored',
                        'Automated transition: Auction expired without offers',
                        client
                    )
                }

                if (result.rows.length > 0) {
                    console.log(`⏰ Processed ${result.rows.length} expired auctions`)
                }
            })
        } catch (error) {
            console.error('❌ Auction status error:', error)
        }
    }

    // Perform health checks
    async performHealthChecks() {
        try {
            const health = await pool.healthCheck()
            if (health.healthy) {
                console.log('✅ Database health check passed')
            } else {
                console.error('❌ Database health check failed:', health.error)
            }
        } catch (error) {
            console.error('❌ Health check error:', error)
        }
    }

    // Helper method to transition application status
    async transitionApplication(applicationId, fromStatus, toStatus, reason, client) {
        try {
            // Update application status
            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2 AND status = $3',
                [toStatus, applicationId, fromStatus]
            )

            // Log the transition
            await client.query(
                'INSERT INTO application_status_logs (application_id, from_status, to_status, reason, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [applicationId, fromStatus, toStatus, reason]
            )

            console.log(`🔄 Application ${applicationId} transitioned from ${fromStatus} to ${toStatus}: ${reason}`)
        } catch (error) {
            console.error(`❌ Error transitioning application ${applicationId}:`, error)
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
            }))
        }
    }
}

// Export singleton instance
const backgroundTaskManager = new BackgroundTaskManager()

export default backgroundTaskManager