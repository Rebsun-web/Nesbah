import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendAuctionCompletionEmail } from '@/lib/email/emailNotifications';

export async function POST(req) {
    try {
        const body = await req.json();
        const { application_id } = body;

        if (!application_id) {
            return NextResponse.json({ 
                success: false, 
                error: 'Application ID is required' 
            }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_applications_auction-completion_route.jsx_route');
        
        try {
            // Get application details and business email
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
                [application_id]
            );

            if (applicationResult.rows.length === 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Application not found' 
                }, { status: 404 });
            }

            const application = applicationResult.rows[0];

            // Check if auction has actually ended
            if (application.status !== 'completed' && application.status !== 'ignored') {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Auction has not ended yet' 
                }, { status: 400 });
            }

            // Send auction completion email to business
            if (application.business_email) {
                try {
                    const offersCount = application.offers_count || 0;
                    await sendAuctionCompletionEmail(
                        application.business_email, 
                        application, 
                        offersCount
                    );
                    
                    console.log(`✅ Auction completion email sent to business: ${application.business_email}`);
                    
                    // Mark that notification was sent
                    await client.query(
                        `UPDATE pos_application 
                         SET auction_completion_notification_sent = true 
                         WHERE application_id = $1`,
                        [application_id]
                    );
                    
                } catch (emailError) {
                    console.error(`❌ Failed to send auction completion email:`, emailError);
                    // Don't fail the API call if email fails
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Auction completion notification processed',
                application_id: application_id,
                status: application.status,
                offers_count: application.offers_count || 0
            });

        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error processing auction completion:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

/**
 * GET endpoint to check which applications need auction completion notifications
 */
export async function GET(req) {
    try {
        const client = await pool.connectWithRetry(2, 1000, 'app_api_applications_auction-completion_route.jsx_route');
        
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
                 LIMIT 50`
            );

            return NextResponse.json({
                success: true,
                pending_notifications: pendingNotifications.rows.length,
                applications: pendingNotifications.rows.map(app => ({
                    application_id: app.application_id,
                    status: app.status,
                    trade_name: app.trade_name,
                    offers_count: app.offers_count || 0,
                    auction_end_time: app.auction_end_time
                }))
            });

        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Unexpected error checking pending notifications:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}
