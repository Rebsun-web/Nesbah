import pool from '../db.cjs'
import AdminAuth from '../auth/admin-auth.js'

class StatusTransitionMonitor {
    constructor() {
        this.isRunning = false
        this.interval = null
        this.checkInterval = 60000 // Check every minute
    }

    // Start the monitoring system
    async start() {
        if (this.isRunning) {
            console.log('Status transition monitor is already running')
            return
        }

        console.log('🚀 Starting Status Transition Monitor...')
        this.isRunning = true

        // Run initial check
        await this.performStatusChecks()

        // Set up interval for regular checks
        this.interval = setInterval(async () => {
            await this.performStatusChecks()
        }, this.checkInterval)

        console.log('✅ Status Transition Monitor started successfully')
    }

    // Stop the monitoring system
    stop() {
        if (!this.isRunning) {
            console.log('Status transition monitor is not running')
            return
        }

        console.log('🛑 Stopping Status Transition Monitor...')
        this.isRunning = false

        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
        }

        console.log('✅ Status Transition Monitor stopped')
    }

    // Perform all status checks
    async performStatusChecks() {
        try {
            console.log('🔄 Performing status transition checks...')
            
            // Check for submitted applications that need to transition to pending_offers
            await this.checkSubmittedToPendingOffers()
            
            // Check for pending_offers applications that need to transition
            await this.checkPendingOffersTransitions()
            
            // Check for offer_received applications that need to transition
            await this.checkOfferReceivedTransitions()
            
            // Check for expired applications
            await this.checkExpiredApplications()
            
            // Generate system alerts for urgent situations
            await this.generateUrgencyAlerts()
            
            console.log('✅ Status transition checks completed')
        } catch (error) {
            console.error('❌ Error in status transition checks:', error)
            await this.createSystemAlert('system_error', 'high', 'Status Transition Error', error.message)
        }
    }

    // Check submitted applications and transition to pending_offers
    async checkSubmittedToPendingOffers() {
        const client = await pool.connect()
        
        try {
            // Find applications in 'submitted' status that should transition to 'pending_offers'
            const result = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    pa.submitted_at,
                    EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/60 as minutes_since_submission
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status = 'submitted'
                AND pa.submitted_at <= NOW() - INTERVAL '5 minutes'
                ORDER BY pa.submitted_at ASC
            `)

            for (const app of result.rows) {
                await this.transitionApplication(
                    app.application_id,
                    'submitted',
                    'pending_offers',
                    'Automated transition: Application moved to auction phase',
                    client
                )
            }

            if (result.rows.length > 0) {
                console.log(`📤 Transitioned ${result.rows.length} applications from submitted to pending_offers`)
            }
        } finally {
            client.release()
        }
    }

    // Check pending_offers applications for transitions
    async checkPendingOffersTransitions() {
        const client = await pool.connect()
        
        try {
            // Find applications in 'pending_offers' that have expired or received offers
            const result = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.auction_end_time,
                    sa.offers_count,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'pending_offers'
                AND (
                    sa.auction_end_time <= NOW() OR
                    sa.offers_count > 0
                )
                ORDER BY sa.auction_end_time ASC
            `)

            for (const app of result.rows) {
                if (app.offers_count > 0) {
                    // Application received offers, transition to offer_received
                    await this.transitionApplication(
                        app.application_id,
                        'pending_offers',
                        'offer_received',
                        'Automated transition: Offers received, moving to selection phase',
                        client
                    )
                } else if (app.auction_end_time <= new Date()) {
                    // Auction expired without offers, transition to abandoned
                    await this.transitionApplication(
                        app.application_id,
                        'pending_offers',
                        'abandoned',
                        'Automated transition: Auction expired without offers',
                        client
                    )
                }
            }

            if (result.rows.length > 0) {
                console.log(`⏰ Processed ${result.rows.length} pending_offers applications`)
            }
        } finally {
            client.release()
        }
    }

    // Check offer_received applications for transitions
    async checkOfferReceivedTransitions() {
        const client = await pool.connect()
        
        try {
            // Find applications in 'offer_received' that have expired
            const result = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.offer_selection_end_time,
                    EXTRACT(EPOCH FROM (sa.offer_selection_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'offer_received'
                AND sa.offer_selection_end_time <= NOW()
                ORDER BY sa.offer_selection_end_time ASC
            `)

            for (const app of result.rows) {
                // Selection period expired, transition to deal_expired
                await this.transitionApplication(
                    app.application_id,
                    'offer_received',
                    'deal_expired',
                    'Automated transition: Offer selection period expired',
                    client
                )
            }

            if (result.rows.length > 0) {
                console.log(`⏰ Transitioned ${result.rows.length} applications from offer_received to deal_expired`)
            }
        } finally {
            client.release()
        }
    }

    // Check for expired applications that need cleanup
    async checkExpiredApplications() {
        const client = await pool.connect()
        
        try {
            // Find applications that have been in expired states for too long
            const result = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    pa.submitted_at,
                    EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/86400 as days_since_submission
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status IN ('abandoned', 'deal_expired')
                AND pa.submitted_at <= NOW() - INTERVAL '30 days'
                ORDER BY pa.submitted_at ASC
            `)

            for (const app of result.rows) {
                // Archive old expired applications
                await this.archiveExpiredApplication(app.application_id, client)
            }

            if (result.rows.length > 0) {
                console.log(`🗄️ Archived ${result.rows.length} old expired applications`)
            }
        } finally {
            client.release()
        }
    }

    // Generate urgency alerts for applications requiring attention
    async generateUrgencyAlerts() {
        const client = await pool.connect()
        
        try {
            // Check for auctions ending soon (within 1 hour)
            const auctionEndingSoon = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.auction_end_time,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'pending_offers'
                AND sa.auction_end_time <= NOW() + INTERVAL '1 hour'
                AND sa.auction_end_time > NOW()
                AND NOT EXISTS (
                    SELECT 1 FROM system_alerts 
                    WHERE related_entity_type = 'application' 
                    AND related_entity_id = sa.application_id
                    AND alert_type = 'deadline_approaching'
                    AND created_at > NOW() - INTERVAL '30 minutes'
                )
            `)

            for (const app of auctionEndingSoon.rows) {
                await this.createSystemAlert(
                    'deadline_approaching',
                    'high',
                    'Auction Ending Soon',
                    `Application #${app.application_id} auction ends in ${Math.round(app.hours_until_expiry)} hours`,
                    'application',
                    app.application_id
                )
            }

            // Check for selection periods ending soon (within 1 hour)
            const selectionEndingSoon = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.offer_selection_end_time,
                    EXTRACT(EPOCH FROM (sa.offer_selection_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'offer_received'
                AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour'
                AND sa.offer_selection_end_time > NOW()
                AND NOT EXISTS (
                    SELECT 1 FROM system_alerts 
                    WHERE related_entity_type = 'application' 
                    AND related_entity_id = sa.application_id
                    AND alert_type = 'deadline_approaching'
                    AND created_at > NOW() - INTERVAL '30 minutes'
                )
            `)

            for (const app of selectionEndingSoon.rows) {
                await this.createSystemAlert(
                    'deadline_approaching',
                    'high',
                    'Selection Period Ending Soon',
                    `Application #${app.application_id} selection period ends in ${Math.round(app.hours_until_expiry)} hours`,
                    'application',
                    app.application_id
                )
            }

            if (auctionEndingSoon.rows.length > 0 || selectionEndingSoon.rows.length > 0) {
                console.log(`🚨 Generated ${auctionEndingSoon.rows.length + selectionEndingSoon.rows.length} urgency alerts`)
            }
        } finally {
            client.release()
        }
    }

    // Transition application status
    async transitionApplication(applicationId, fromStatus, toStatus, reason, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query('BEGIN')

            // Verify current status
            const currentStatus = await client.query(
                'SELECT status FROM submitted_applications WHERE application_id = $1',
                [applicationId]
            )

            if (currentStatus.rows.length === 0) {
                throw new Error(`Application ${applicationId} not found`)
            }

            if (currentStatus.rows[0].status !== fromStatus) {
                console.log(`⚠️ Application ${applicationId} status mismatch: expected ${fromStatus}, got ${currentStatus.rows[0].status}`)
                return
            }

            // Update submitted_applications table
            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2',
                [toStatus, applicationId]
            )

            // Update pos_application table
            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                [toStatus, applicationId]
            )

            // Log the transition
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, fromStatus, toStatus, 1, reason]) // admin_user_id = 1 for system

            // Set deadlines based on new status
            if (toStatus === 'pending_offers') {
                const auctionEndTime = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
                await client.query(
                    'UPDATE submitted_applications SET auction_end_time = $1 WHERE application_id = $2',
                    [auctionEndTime, applicationId]
                )
            } else if (toStatus === 'offer_received') {
                const selectionEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                await client.query(
                    'UPDATE submitted_applications SET offer_selection_end_time = $1 WHERE application_id = $2',
                    [selectionEndTime, applicationId]
                )
            }

            await client.query('COMMIT')

            console.log(`✅ Transitioned application ${applicationId} from ${fromStatus} to ${toStatus}`)

            // Create system alert for important transitions
            if (toStatus === 'abandoned' || toStatus === 'deal_expired') {
                await this.createSystemAlert(
                    'revenue_anomaly',
                    'medium',
                    `Application ${toStatus}`,
                    `Application #${applicationId} was ${toStatus}`,
                    'application',
                    applicationId
                )
            }

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error transitioning application ${applicationId}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Archive expired applications
    async archiveExpiredApplication(applicationId, client = null) {
        const shouldReleaseClient = !client
        if (!client) {
            client = await pool.connect()
        }

        try {
            await client.query('BEGIN')

            // Move to archived status (you might want to create an archived_applications table)
            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2',
                ['archived', applicationId]
            )

            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                ['archived', applicationId]
            )

            await client.query('COMMIT')

            console.log(`🗄️ Archived application ${applicationId}`)

        } catch (error) {
            await client.query('ROLLBACK')
            console.error(`❌ Error archiving application ${applicationId}:`, error)
            throw error
        } finally {
            if (shouldReleaseClient) {
                client.release()
            }
        }
    }

    // Create system alert
    async createSystemAlert(alertType, severity, title, message, entityType = null, entityId = null) {
        const client = await pool.connect()
        
        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, related_entity_type, related_entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [alertType, severity, title, message, entityType, entityId])

            console.log(`🚨 Created system alert: ${title}`)
        } catch (error) {
            console.error('❌ Error creating system alert:', error)
        } finally {
            client.release()
        }
    }

    // Get monitoring statistics
    async getMonitoringStats() {
        const client = await pool.connect()
        
        try {
            const stats = await client.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/3600) as avg_hours_since_submission
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status IN ('submitted', 'pending_offers', 'offer_received', 'completed', 'abandoned', 'deal_expired')
                GROUP BY status
                ORDER BY status
            `)

            return stats.rows
        } finally {
            client.release()
        }
    }

    // Get urgent applications
    async getUrgentApplications() {
        const client = await pool.connect()
        
        try {
            const urgent = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.auction_end_time,
                    sa.offer_selection_end_time,
                    pa.trade_name,
                    pa.submitted_at,
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 'auction_ending_soon'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 'selection_ending_soon'
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 'auction_expired'
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 'selection_expired'
                        ELSE 'normal'
                    END as urgency_level
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE 
                    (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour')
                    OR (sa.status = 'pending_offers' AND sa.auction_end_time <= NOW())
                    OR (sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW())
                ORDER BY 
                    CASE 
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() + INTERVAL '1 hour' THEN 1
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() + INTERVAL '1 hour' THEN 2
                        WHEN sa.status = 'pending_offers' AND sa.auction_end_time <= NOW() THEN 3
                        WHEN sa.status = 'offer_received' AND sa.offer_selection_end_time <= NOW() THEN 4
                        ELSE 5
                    END,
                    sa.auction_end_time ASC,
                    sa.offer_selection_end_time ASC
            `)

            return urgent.rows
        } finally {
            client.release()
        }
    }
}

// Create singleton instance
const statusTransitionMonitor = new StatusTransitionMonitor()

export default statusTransitionMonitor
