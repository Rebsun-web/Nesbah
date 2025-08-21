// statusTransitions.cjs (CommonJS version)
const pool = require('../db.cjs');

async function handleStatusTransitions() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('🔄 Starting status transitions...');

        // 1. Handle 48-hour auction expiration
        const expiredAuctions = await client.query(
            `SELECT sa.application_id, sa.status, pa.user_id
             FROM submitted_applications sa
             JOIN pos_application pa ON sa.application_id = pa.application_id
             WHERE sa.status = 'pending_offers' 
             AND sa.auction_end_time <= NOW()`
        );

        for (const auction of expiredAuctions.rows) {
            // Check if any offers were submitted
            const offersCount = await client.query(
                `SELECT COUNT(*) as count
                 FROM application_offers ao
                 JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
                 WHERE sa.application_id = $1`,
                [auction.application_id]
            );

            const hasOffers = parseInt(offersCount.rows[0].count) > 0;

            if (hasOffers) {
                // Transition to offer_received and start 24-hour selection window
                await client.query(
                    `UPDATE submitted_applications 
                     SET status = 'offer_received', 
                         offer_selection_end_time = NOW() + INTERVAL '24 hours'
                     WHERE application_id = $1`,
                    [auction.application_id]
                );

                await client.query(
                    `UPDATE pos_application 
                     SET status = 'offer_received',
                         offer_selection_end_time = NOW() + INTERVAL '24 hours'
                     WHERE application_id = $1`,
                    [auction.application_id]
                );

                // Set offer selection deadlines for all offers
                await client.query(
                    `UPDATE application_offers ao
                     SET offer_selection_deadline = NOW() + INTERVAL '24 hours'
                     FROM submitted_applications sa
                     WHERE ao.submitted_application_id = sa.id
                     AND sa.application_id = $1`,
                    [auction.application_id]
                );

                console.log(`✅ Application ${auction.application_id} moved to offer_received with ${offersCount.rows[0].count} offers`);
                
                // TODO: Send email notification to business user
                // await sendOfferReceivedEmail(auction.user_id, auction.application_id);
            } else {
                // No offers submitted - mark as abandoned
                await client.query(
                    `UPDATE submitted_applications SET status = 'abandoned' WHERE application_id = $1`,
                    [auction.application_id]
                );

                await client.query(
                    `UPDATE pos_application SET status = 'abandoned' WHERE application_id = $1`,
                    [auction.application_id]
                );

                console.log(`❌ Application ${auction.application_id} marked as abandoned (no offers)`);
                
                // TODO: Send email notification to business user
                // await sendAbandonedEmail(auction.user_id, auction.application_id);
            }
        }

        // 2. Handle 24-hour offer selection expiration
        const expiredOfferSelections = await client.query(
            `SELECT sa.application_id, sa.status, pa.user_id
             FROM submitted_applications sa
             JOIN pos_application pa ON sa.application_id = pa.application_id
             WHERE sa.status = 'offer_received' 
             AND sa.offer_selection_end_time <= NOW()`
        );

        for (const selection of expiredOfferSelections.rows) {
            // Mark all offers as deal_lost
            await client.query(
                `UPDATE application_offers ao
                 SET status = 'deal_lost'
                 FROM submitted_applications sa
                 WHERE ao.submitted_application_id = sa.id
                 AND sa.application_id = $1
                 AND ao.status = 'submitted'`,
                [selection.application_id]
            );

            // Mark application as deal_expired
            await client.query(
                `UPDATE submitted_applications SET status = 'deal_expired' WHERE application_id = $1`,
                [selection.application_id]
            );

            await client.query(
                `UPDATE pos_application SET status = 'deal_expired' WHERE application_id = $1`,
                [selection.application_id]
            );

            console.log(`⏰ Application ${selection.application_id} marked as deal_expired (no selection made)`);
            
            // TODO: Send email notification to business user and banks
            // await sendDealExpiredEmail(selection.user_id, selection.application_id);
        }

        await client.query('COMMIT');
        console.log('✅ Status transitions completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Status transitions failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { handleStatusTransitions };

// Run status transitions if this file is executed directly
if (require.main === module) {
    handleStatusTransitions()
        .then(() => {
            console.log('Status transitions completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Status transitions failed:', error);
            process.exit(1);
        });
}
