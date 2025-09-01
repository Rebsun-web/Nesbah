const pool = require('./db.cjs');

class AuctionExpiryHandler {
    /**
     * Check and handle expired auctions
     * This function should be called periodically or when needed
     */
    static async handleExpiredAuctions() {
        const client = await pool.connect();
        
        try {
            console.log('⏰ Checking for expired auctions...');

            // Find applications that have expired and need status transition
            const expiredApplications = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.offers_count,
                    sa.auction_end_time,
                    pa.trade_name,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_expired
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status = 'live_auction'
                AND sa.auction_end_time <= NOW()
                ORDER BY sa.auction_end_time ASC
            `);

            if (expiredApplications.rows.length === 0) {
                console.log('  ✅ No expired auctions found');
                return { processed: 0, completed: 0, ignored: 0 };
            }

            console.log(`  📋 Found ${expiredApplications.rows.length} expired auctions`);

            let completedCount = 0;
            let ignoredCount = 0;

            for (const app of expiredApplications.rows) {
                await client.query('BEGIN');

                try {
                    if (app.offers_count > 0) {
                        // Application received offers, transition to completed
                        await this.transitionToCompleted(app.application_id, client);
                        completedCount++;
                        console.log(`  ✅ Application #${app.application_id} (${app.trade_name}) transitioned to completed (${app.offers_count} offers)`);
                    } else {
                        // No offers received, transition to ignored
                        await this.transitionToIgnored(app.application_id, client);
                        ignoredCount++;
                        console.log(`  ❌ Application #${app.application_id} (${app.trade_name}) transitioned to ignored (no offers)`);
                    }

                    await client.query('COMMIT');
                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Error transitioning application #${app.application_id}:`, error);
                }
            }

            console.log(`  ✅ Processed ${expiredApplications.rows.length} expired auctions (${completedCount} completed, ${ignoredCount} ignored)`);
            
            return {
                processed: expiredApplications.rows.length,
                completed: completedCount,
                ignored: ignoredCount
            };

        } catch (error) {
            console.error('❌ Error checking expired auctions:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Transition application to completed status
     */
    static async transitionToCompleted(applicationId, client) {
        // Update submitted_applications table
        await client.query(
            'UPDATE submitted_applications SET status = $1 WHERE application_id = $2',
            ['completed', applicationId]
        );

        // Update pos_application table
        await client.query(
            'UPDATE pos_application SET status = $1 WHERE application_id = $2',
            ['completed', applicationId]
        );

        // Update application_offer_tracking if it exists
        await client.query(`
            UPDATE application_offer_tracking 
            SET current_application_status = 'completed',
                offer_window_start = NOW(),
                offer_window_end = NOW() + INTERVAL '24 hours'
            WHERE application_id = $1
        `, [applicationId]);

        // Log the transition (optional - don't fail if audit log insertion fails)
        try {
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, 'live_auction', 'completed', 1, 'Auction expired with offers']);
        } catch (error) {
            console.warn(`⚠️  Could not log status transition for application ${applicationId}:`, error.message);
        }
    }

    /**
     * Transition application to ignored status
     */
    static async transitionToIgnored(applicationId, client) {
        // Update submitted_applications table
        await client.query(
            'UPDATE submitted_applications SET status = $1 WHERE application_id = $2',
            ['ignored', applicationId]
        );

        // Update pos_application table
        await client.query(
            'UPDATE pos_application SET status = $1 WHERE application_id = $2',
            ['ignored', applicationId]
        );

        // Update application_offer_tracking if it exists
        await client.query(`
            UPDATE application_offer_tracking 
            SET current_application_status = 'ignored'
            WHERE application_id = $1
        `, [applicationId]);

        // Log the transition (optional - don't fail if audit log insertion fails)
        try {
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [applicationId, 'live_auction', 'ignored', 1, 'Auction expired without offers']);
        } catch (error) {
            console.warn(`⚠️  Could not log status transition for application ${applicationId}:`, error.message);
        }
    }

    /**
     * Get applications that are approaching auction end (within 2 hours)
     */
    static async getUrgentApplications() {
        const client = await pool.connectWithRetry();
        
        try {
            const urgentResult = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.auction_end_time,
                    sa.offers_count,
                    pa.trade_name,
                    EXTRACT(EPOCH FROM (sa.auction_end_time - NOW()))/3600 as hours_until_expiry
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.status = 'live_auction'
                AND sa.auction_end_time > NOW()
                AND sa.auction_end_time <= NOW() + INTERVAL '2 hours'
                ORDER BY sa.auction_end_time ASC
            `);

            return urgentResult.rows;
        } finally {
            client.release();
        }
    }
}

module.exports = { AuctionExpiryHandler };
