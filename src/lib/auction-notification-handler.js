import pool from './db.js';
import { sendAuctionCompletionEmail, areEmailNotificationsDisabled } from './email/emailNotifications.js';

class AuctionNotificationHandler {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
    }

    /**
     * Start the auction notification handler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ Auction notification handler is already running');
            return;
        }

        // Check if email notifications are disabled
        if (areEmailNotificationsDisabled()) {
            console.log('📧 Email notifications are disabled - auction notification handler will not send emails');
        }

        this.isRunning = true;
        console.log('🚀 Starting auction notification handler...');

        // Check every 5 minutes for expired auctions
        this.checkInterval = setInterval(() => {
            this.processExpiredAuctions();
        }, 5 * 60 * 1000); // 5 minutes

        // Also check immediately on startup
        this.processExpiredAuctions();
    }

    /**
     * Stop the auction notification handler
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        console.log('🛑 Stopping auction notification handler...');

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Process expired auctions and send completion notifications
     */
    async processExpiredAuctions() {
        if (!this.isRunning) {
            return;
        }

        try {
            console.log('⏰ Checking for expired auctions that need notifications...');
            
            const client = await pool.connectWithRetry();
            
            try {
                // Find applications that have ended but haven't sent completion notifications
                const pendingNotifications = await client.query(
                    `SELECT 
                        pa.application_id,
                        pa.status,
                        pa.trade_name,
                        pa.submitted_at,
                        pa.auction_end_time,
                        pa.city_of_operation,
                        pa.requested_financing_amount,
                        pa.offers_count,
                        u.email as business_email
                     FROM pos_application pa
                     JOIN users u ON pa.user_id = u.user_id
                     WHERE (pa.status = 'completed' OR pa.status = 'ignored')
                     AND (pa.auction_completion_notification_sent IS NULL OR pa.auction_completion_notification_sent = false)
                     AND pa.auction_end_time <= NOW()
                     ORDER BY pa.auction_end_time ASC
                     LIMIT 20`
                );

                if (pendingNotifications.rows.length === 0) {
                    console.log('  ✅ No pending auction completion notifications');
                    return;
                }

                console.log(`  📋 Found ${pendingNotifications.rows.length} applications needing completion notifications`);

                let processedCount = 0;
                let successCount = 0;
                let failureCount = 0;
                let skippedCount = 0;

                for (const application of pendingNotifications.rows) {
                    try {
                        console.log(`  📧 Processing notification for application ${application.application_id} (${application.trade_name})`);

                        // Check if email notifications are disabled
                        if (areEmailNotificationsDisabled()) {
                            console.log(`    📧 Email notifications disabled - marking as processed without sending`);
                            
                            // Mark that notification was sent (to prevent re-processing)
                            await client.query(
                                `UPDATE pos_application 
                                 SET auction_completion_notification_sent = true 
                                 WHERE application_id = $1`,
                                [application.application_id]
                            );
                            
                            skippedCount++;
                            processedCount++;
                            continue;
                        }

                        // Send auction completion email to business
                        if (application.business_email) {
                            const offersCount = application.offers_count || 0;
                            const emailResult = await sendAuctionCompletionEmail(
                                application.business_email,
                                application,
                                offersCount
                            );

                            if (emailResult.success) {
                                // Mark that notification was sent
                                await client.query(
                                    `UPDATE pos_application 
                                     SET auction_completion_notification_sent = true 
                                     WHERE application_id = $1`,
                                    [application.application_id]
                                );

                                console.log(`    ✅ Notification sent to ${application.business_email}`);
                                successCount++;
                            } else {
                                console.error(`    ❌ Failed to send email: ${emailResult.error}`);
                                failureCount++;
                            }
                        } else {
                            console.warn(`    ⚠️ No business email found for application ${application.application_id}`);
                            failureCount++;
                        }

                        processedCount++;

                        // Add small delay between emails to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));

                    } catch (error) {
                        console.error(`    ❌ Error processing application ${application.application_id}:`, error.message);
                        failureCount++;
                    }
                }

                console.log(`  📊 Auction notification processing complete:`);
                console.log(`    - Processed: ${processedCount}`);
                console.log(`    - Successful: ${successCount}`);
                console.log(`    - Failed: ${failureCount}`);
                if (skippedCount > 0) {
                    console.log(`    - Skipped (emails disabled): ${skippedCount}`);
                }

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('❌ Error in auction notification handler:', error);
        }
    }

    /**
     * Manually trigger notification processing for a specific application
     */
    async processApplicationNotification(applicationId) {
        try {
            console.log(`🔧 Manually processing notification for application ${applicationId}`);
            
            const client = await pool.connectWithRetry();
            
            try {
                // Get application details
                const applicationResult = await client.query(
                    `SELECT 
                        pa.application_id,
                        pa.status,
                        pa.trade_name,
                        pa.submitted_at,
                        pa.auction_end_time,
                        pa.city_of_operation,
                        pa.requested_financing_amount,
                        pa.offers_count,
                        u.email as business_email
                     FROM pos_application pa
                     JOIN users u ON pa.user_id = u.user_id
                     WHERE pa.application_id = $1`,
                    [applicationId]
                );

                if (applicationResult.rows.length === 0) {
                    throw new Error('Application not found');
                }

                const application = applicationResult.rows[0];

                // Check if auction has ended
                if (application.status !== 'completed' && application.status !== 'ignored') {
                    throw new Error(`Auction has not ended yet. Current status: ${application.status}`);
                }

                // Check if email notifications are disabled
                if (areEmailNotificationsDisabled()) {
                    console.log(`📧 Email notifications are disabled - marking as processed without sending`);
                    
                    // Mark that notification was sent (to prevent re-processing)
                    await client.query(
                        `UPDATE pos_application 
                         SET auction_completion_notification_sent = true 
                         WHERE application_id = $1`,
                        [applicationId]
                    );
                    
                    return { 
                        success: true, 
                        message: 'Notification marked as processed (emails disabled)',
                        disabled: true
                    };
                }

                // Send notification
                if (application.business_email) {
                    const offersCount = application.offers_count || 0;
                    const emailResult = await sendAuctionCompletionEmail(
                        application.business_email,
                        application,
                        offersCount
                    );

                    if (emailResult.success) {
                        // Mark that notification was sent
                        await client.query(
                            `UPDATE pos_application 
                             SET auction_completion_notification_sent = true 
                             WHERE application_id = $1`,
                            [applicationId]
                        );

                        console.log(`✅ Manual notification sent successfully to ${application.business_email}`);
                        return { success: true, message: 'Notification sent successfully' };
                    } else {
                        throw new Error(`Email sending failed: ${emailResult.error}`);
                    }
                } else {
                    throw new Error('No business email found for this application');
                }

            } finally {
                client.release();
            }

        } catch (error) {
            console.error(`❌ Manual notification processing failed for application ${applicationId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get status of the notification handler
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastCheck: this.lastCheck || null,
            checkInterval: this.checkInterval ? '5 minutes' : null,
            emailNotificationsDisabled: areEmailNotificationsDisabled()
        };
    }
}

// Export singleton instance
const auctionNotificationHandler = new AuctionNotificationHandler();
export default auctionNotificationHandler;
