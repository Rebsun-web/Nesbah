import pool from './db.js';

class AuctionExpiryHandler {
    /**
     * Check and handle expired auctions
     * This function should be called periodically or when needed
     */
    static async handleExpiredAuctions() {
        const client = await pool.connectWithRetry();
        
        try {
            console.log('⏰ Checking for expired auctions...');

            // Find applications that have expired and need status transition
            const expiredApplications = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.auction_end_time,
                    pa.trade_name
                FROM pos_application pa
                WHERE pa.status = 'live_auction'
                AND pa.auction_end_time <= NOW()
                ORDER BY pa.auction_end_time ASC
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
                    // Check if there are any offers for this application
                    const offersResult = await client.query(
                        'SELECT COUNT(*) as offer_count FROM application_offers WHERE application_id = $1',
                        [app.application_id]
                    );
                    
                    const offerCount = parseInt(offersResult.rows[0].offer_count);

                    if (offerCount > 0) {
                        // Application received offers, transition to completed
                        await this.transitionToCompleted(app.application_id, client);
                        completedCount++;
                        console.log(`  ✅ Application #${app.application_id} (${app.trade_name}) transitioned to completed (${offerCount} offers)`);
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
            if (client && typeof client.release === 'function') {
                client.release();
            }
        }
    }

    /**
     * Transition application to completed status
     */
    static async transitionToCompleted(applicationId, client) {
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
    }

    /**
     * Transition application to ignored status
     */
    static async transitionToIgnored(applicationId, client) {
        // Update pos_application table
        await client.query(
            'UPDATE pos_application SET status = $1 WHERE application_id = $2',
            ['ignored', applicationId]
        );

        // Update application_offer_tracking if it exists
        await client.query(`
            UPDATE application_offer_tracking 
            SET current_application_status = 'ignored',
                offer_window_start = NOW(),
                offer_window_end = NOW() + INTERVAL '24 hours'
            WHERE application_id = $1
        `, [applicationId]);
    }

    /**
     * Get urgent applications (approaching auction end)
     */
    static async getUrgentApplications() {
        const client = await pool.connectWithRetry();
        
        try {
            const urgentApplications = await client.query(`
                SELECT 
                    pa.application_id,
                    pa.trade_name,
                    pa.auction_end_time,
                    EXTRACT(EPOCH FROM (pa.auction_end_time - NOW()))/3600 as hours_remaining
                FROM pos_application pa
                WHERE pa.status = 'live_auction'
                AND pa.auction_end_time > NOW()
                AND pa.auction_end_time <= NOW() + INTERVAL '24 hours'
                ORDER BY pa.auction_end_time ASC
            `);

            return urgentApplications.rows;
        } catch (error) {
            console.error('❌ Error getting urgent applications:', error);
            throw error;
        } finally {
            if (client && typeof client.release === 'function') {
                client.release();
            }
        }
    }
}

export { AuctionExpiryHandler };
