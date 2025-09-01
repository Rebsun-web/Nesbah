import { NextResponse } from 'next/server'
import AdminAuth from '@/lib/auth/admin-auth'
import pool from '@/lib/db.cjs'

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        const { application_id } = await req.json();

        if (!application_id) {
            return NextResponse.json({ 
                success: false, 
                error: 'Application ID is required' 
            }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get application details
            const appResult = await client.query(`
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.offers_count,
                    sa.auction_end_time,
                    pa.submitted_at,
                    pa.trade_name,
                    EXTRACT(EPOCH FROM (NOW() - pa.submitted_at))/3600 as hours_since_submission,
                    EXTRACT(EPOCH FROM (NOW() - sa.auction_end_time))/3600 as hours_since_auction_end
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.application_id = $1
            `, [application_id]);

            if (appResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ 
                    success: false, 
                    error: 'Application not found' 
                }, { status: 404 });
            }

            const app = appResult.rows[0];

            // Check if application is actually stuck
            if (app.status !== 'live_auction') {
                await client.query('ROLLBACK');
                return NextResponse.json({ 
                    success: false, 
                    error: `Application is not in 'live_auction' status. Current status: ${app.status}` 
                }, { status: 400 });
            }

            if (app.auction_end_time > new Date()) {
                await client.query('ROLLBACK');
                return NextResponse.json({ 
                    success: false, 
                    error: `Auction has not ended yet. Ends at: ${app.auction_end_time}` 
                }, { status: 400 });
            }

            let newStatus;
            let reason;

            if (app.offers_count > 0) {
                // Auction ended with offers, transition to completed
                newStatus = 'completed';
                reason = `Manual force update: Auction expired ${app.hours_since_auction_end.toFixed(1)} hours ago with ${app.offers_count} offers`;

                await client.query(`
                    UPDATE submitted_applications 
                    SET status = $1 
                    WHERE application_id = $2
                `, [newStatus, application_id]);

                await client.query(`
                    UPDATE pos_application 
                    SET status = $1 
                    WHERE application_id = $2
                `, [newStatus, application_id]);

                // Update application_offer_tracking if it exists
                try {
                    await client.query(`
                        UPDATE application_offer_tracking 
                        SET current_application_status = $1,
                            offer_window_start = NOW(),
                            offer_window_end = NOW() + INTERVAL '24 hours'
                        WHERE application_id = $2
                    `, [newStatus, application_id]);
                } catch (error) {
                    console.warn(`Could not update application_offer_tracking: ${error.message}`);
                }
            } else {
                // Auction ended without offers, transition to ignored
                newStatus = 'ignored';
                reason = `Manual force update: Auction expired ${app.hours_since_auction_end.toFixed(1)} hours ago with no offers`;

                await client.query(`
                    UPDATE submitted_applications 
                    SET status = $1 
                    WHERE application_id = $2
                `, [newStatus, application_id]);

                await client.query(`
                    UPDATE pos_application 
                    SET status = $1 
                    WHERE application_id = $2
                `, [newStatus, application_id]);

                // Update application_offer_tracking if it exists
                try {
                    await client.query(`
                        UPDATE application_offer_tracking 
                        SET current_application_status = $1
                        WHERE application_id = $2
                    `, [newStatus, application_id]);
                } catch (error) {
                    console.warn(`Could not update application_offer_tracking: ${error.message}`);
                }
            }

            // Log the status transition
            try {
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [application_id, 'live_auction', newStatus, 1, reason]);
            } catch (error) {
                console.warn(`Could not log status transition: ${error.message}`);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Application ${application_id} successfully transitioned from 'live_auction' to '${newStatus}'`,
                data: {
                    application_id,
                    old_status: 'live_auction',
                    new_status: newStatus,
                    reason,
                    hours_overdue: app.hours_since_auction_end.toFixed(1),
                    offers_count: app.offers_count
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error in force status update:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
