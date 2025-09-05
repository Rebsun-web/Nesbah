import pool from './db.js';
import { STATUS_CALCULATION_SQL } from './application-status.js';

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
            // Use standardized logic to identify expired live_auction applications
            const expiredApplications = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.offers_count,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.trade_name,
                    pa.status,
                    ${STATUS_CALCULATION_SQL},
                    EXTRACT(EPOCH FROM (
                        COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') - NOW()
                    ))/3600 as hours_expired
                FROM pos_application pa
                WHERE pa.status = 'live_auction'
                AND COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') <= NOW()
                ORDER BY COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') ASC
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
                    // Use the calculated status to determine the correct transition
                    const targetStatus = app.calculated_status;
                    
                    if (targetStatus === 'completed') {
                        // Application received offers, transition to completed
                        await this.transitionToCompleted(app.application_id, client);
                        completedCount++;
                        console.log(`  ✅ Application #${app.application_id} (${app.trade_name}) transitioned to completed (${app.offers_count} offers)`);
                    } else if (targetStatus === 'ignored') {
                        // No offers received, transition to ignored
                        await this.transitionToIgnored(app.application_id, client);
                        ignoredCount++;
                        console.log(`  ❌ Application #${app.application_id} (${app.trade_name}) transitioned to ignored (no offers)`);
                    } else {
                        console.warn(`  ⚠️ Application #${app.application_id} has unexpected calculated status: ${targetStatus}`);
                        await client.query('ROLLBACK');
                        continue;
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
        // Update pos_application table - only update status field for consistency
        await client.query(`
            UPDATE pos_application 
            SET 
                status = 'completed',
                updated_at = NOW()
            WHERE application_id = $1
        `, [applicationId]);

        // Update application_offer_tracking if it exists
        try {
            await client.query(`
                UPDATE application_offer_tracking 
                SET current_application_status = 'completed',
                    offer_window_start = NOW(),
                    offer_window_end = NOW() + INTERVAL '24 hours'
                WHERE application_id = $1
            `, [applicationId]);
        } catch (error) {
            console.warn(`⚠️  Could not update application_offer_tracking for application ${applicationId}:`, error.message);
        }

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
        // Update pos_application table - only update status field for consistency
        await client.query(`
            UPDATE pos_application 
            SET 
                status = 'ignored',
                updated_at = NOW()
            WHERE application_id = $1
        `, [applicationId]);

        // Update application_offer_tracking if it exists
        try {
            await client.query(`
                UPDATE application_offer_tracking 
                SET current_application_status = 'ignored'
                WHERE application_id = $1
            `, [applicationId]);
        } catch (error) {
            console.warn(`⚠️  Could not update application_offer_tracking for application ${applicationId}:`, error.message);
        }

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
        const client = await pool.connectWithRetry(2, 1000, 'auction-expiry-handler');
        
        try {
            const urgentResult = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.submitted_at,
                    pa.auction_end_time,
                    pa.offers_count,
                    pa.trade_name,
                    pa.status,
                    EXTRACT(EPOCH FROM (
                        COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') - NOW()
                    ))/3600 as hours_until_expiry
                FROM pos_application pa
                WHERE pa.status = 'live_auction'
                AND COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') > NOW()
                AND COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') <= NOW() + INTERVAL '2 hours'
                ORDER BY COALESCE(pa.auction_end_time, pa.submitted_at + INTERVAL '48 hours') ASC
            `);

            return urgentResult.rows;
        } finally {
            client.release();
        }
    }
}

module.exports = { AuctionExpiryHandler };