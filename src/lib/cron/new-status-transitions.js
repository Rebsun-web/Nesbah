import pool from '../db.js';

class NewStatusTransitionMonitor {
    constructor() {
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ Status transition monitor is already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting new status transition monitor...');

        // Run initial check
        await this.checkAllTransitions();

        // Set up interval for periodic checks (every 5 minutes)
        this.interval = setInterval(async () => {
            await this.checkAllTransitions();
        }, 5 * 60 * 1000);
    }

    async stop() {
        if (!this.isRunning) {
            console.log('⚠️ Status transition monitor is not running');
            return;
        }

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
        console.log('🛑 Stopped new status transition monitor');
    }

    async checkAllTransitions() {
        try {
            await this.checkLiveAuctionTransitions();
            await this.generateUrgencyAlerts();
        } catch (error) {
            console.error('❌ Error in status transition check:', error);
        }
    }

    // Check live_auction applications for transitions
    async checkLiveAuctionTransitions() {
        const client = await pool.connect();
        
        try {
            // Find applications in 'live_auction' that have expired or received offers
            const result = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.auction_end_time,
                    sa.offers_count,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'live_auction'
                AND (
                    sa.auction_end_time <= NOW() OR
                    sa.offers_count > 0
                )
                ORDER BY sa.auction_end_time ASC
            `);

            for (const app of result.rows) {
                if (app.offers_count > 0) {
                    // Application received offers, transition to approved_leads
                    await this.transitionApplication(
                        app.application_id,
                        'live_auction',
                        'approved_leads',
                        'Automated transition: Offers received, moving to approved leads phase',
                        client
                    );
                } else if (app.auction_end_time <= new Date()) {
                    // Auction expired without offers, transition to ignored
                    await this.transitionApplication(
                        app.application_id,
                        'live_auction',
                        'ignored',
                        'Automated transition: Auction expired without offers',
                        client
                    );
                }
            }

            if (result.rows.length > 0) {
                console.log(`⏰ Processed ${result.rows.length} live_auction applications`);
            }
        } finally {
            client.release();
        }
    }

    // Generate urgency alerts for applications approaching deadlines
    async generateUrgencyAlerts() {
        const client = await pool.connect();
        
        try {
            // Check for applications approaching auction end (within 2 hours)
            const urgentResult = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.auction_end_time,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                WHERE sa.status = 'live_auction'
                AND sa.auction_end_time > NOW()
                AND sa.auction_end_time <= NOW() + INTERVAL '2 hours'
                AND sa.offers_count = 0
                ORDER BY sa.auction_end_time ASC
            `);

            for (const app of urgentResult.rows) {
                console.log(`⚠️ URGENT: Application ${app.application_id} auction ends in ${Math.round(app.hours_until_expiry)} hours with no offers`);
                
                // Create system alert
                await this.createSystemAlert(
                    'auction_expiring',
                    'high',
                    'Auction Expiring Soon',
                    `Application ${app.application_id} auction ends in ${Math.round(app.hours_until_expiry)} hours with no offers`,
                    'application',
                    app.application_id,
                    client
                );
            }

            if (urgentResult.rows.length > 0) {
                console.log(`⚠️ Generated ${urgentResult.rows.length} urgency alerts`);
            }
        } finally {
            client.release();
        }
    }

    // Transition application status
    async transitionApplication(applicationId, fromStatus, toStatus, reason, client = null) {
        const shouldReleaseClient = !client;
        if (!client) {
            client = await pool.connect();
        }

        try {
            await client.query('BEGIN');

            // Verify current status
            const currentStatus = await client.query(
                'SELECT status FROM submitted_applications WHERE application_id = $1',
                [applicationId]
            );

            if (currentStatus.rows.length === 0) {
                throw new Error(`Application ${applicationId} not found`);
            }

            if (currentStatus.rows[0].status !== fromStatus) {
                console.log(`⚠️ Application ${applicationId} status mismatch: expected ${fromStatus}, got ${currentStatus.rows[0].status}`);
                return;
            }

            // Update submitted_applications table
            await client.query(
                'UPDATE submitted_applications SET status = $1, updated_at = NOW() WHERE application_id = $2',
                [toStatus, applicationId]
            );

            // Update pos_application table
            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                [toStatus, applicationId]
            );

            // Log the transition
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, fromStatus, toStatus, 1, reason]); // admin_user_id = 1 for system

            await client.query('COMMIT');
            console.log(`✅ Application ${applicationId} transitioned: ${fromStatus} → ${toStatus}`);

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed to transition application ${applicationId}:`, error);
            throw error;
        } finally {
            if (shouldReleaseClient) {
                client.release();
            }
        }
    }

    // Create system alert
    async createSystemAlert(alertType, severity, title, message, entityType = null, entityId = null, client = null) {
        const shouldReleaseClient = !client;
        if (!client) {
            client = await pool.connect();
        }

        try {
            await client.query(`
                INSERT INTO system_alerts (alert_type, severity, title, message, entity_type, entity_id, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [alertType, severity, title, message, entityType, entityId]);
        } catch (error) {
            console.error('Failed to create system alert:', error);
        } finally {
            if (shouldReleaseClient) {
                client.release();
            }
        }
    }
}

// Create singleton instance
const statusTransitionMonitor = new NewStatusTransitionMonitor();

export default statusTransitionMonitor;
