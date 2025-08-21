import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        // Admin authentication
        const authResult = await AdminAuth.authenticateRequest(req);
        if (!authResult.success) {
            return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
        }

        const body = await req.json();
        const {
            application_id,
            from_status,
            to_status,
            reason,
            admin_user_id = 1 // TODO: Get from authenticated admin session
        } = body;

        // Validate required fields
        if (!application_id || !from_status || !to_status || !reason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: application_id, from_status, to_status, reason' },
                { status: 400 }
            );
        }

        // Validate status transition
        const validTransitions = {
            'submitted': ['pending_offers'],
            'pending_offers': ['offer_received', 'abandoned'],
            'offer_received': ['completed', 'deal_expired'],
            'completed': [],
            'abandoned': ['pending_offers'], // Allow reset
            'deal_expired': ['pending_offers'] // Allow reset
        };

        if (!validTransitions[from_status]?.includes(to_status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status transition from ${from_status} to ${to_status}` },
                { status: 400 }
            );
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verify current status
            const currentStatusQuery = await client.query(
                'SELECT status FROM submitted_applications WHERE application_id = $1',
                [application_id]
            );

            if (currentStatusQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Application not found' },
                    { status: 404 }
                );
            }

            const currentStatus = currentStatusQuery.rows[0].status;
            if (currentStatus !== from_status) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: `Application is currently in ${currentStatus} status, not ${from_status}` },
                    { status: 400 }
                );
            }

            // Update application status
            let updateQuery;
            let updateParams;

            if (to_status === 'pending_offers') {
                // Reset to pending_offers with new auction deadline
                updateQuery = `
                    UPDATE submitted_applications 
                    SET status = $1, 
                        auction_end_time = NOW() + INTERVAL '48 hours',
                        offer_selection_end_time = NULL,
                        offers_count = 0,
                        revenue_collected = 0,
                        ignored_by = '{}',
                        purchased_by = '{}',
                        opened_by = '{}'
                    WHERE application_id = $2
                `;
                updateParams = [to_status, application_id];
            } else if (to_status === 'purchased') {
                // Transition to purchased status
                updateQuery = `
                    UPDATE submitted_applications 
                    SET status = $1
                    WHERE application_id = $2
                `;
                updateParams = [to_status, application_id];
                
                // Add 25 SAR revenue for purchased status
                await client.query(
                    `UPDATE submitted_applications 
                     SET revenue_collected = COALESCE(revenue_collected, 0) + 25.00 
                     WHERE application_id = $1`,
                    [application_id]
                );
                
                // Also update pos_application table
                await client.query(
                    `UPDATE pos_application 
                     SET revenue_collected = COALESCE(revenue_collected, 0) + 25.00 
                     WHERE application_id = $1`,
                    [application_id]
                );
                
                console.log(`💰 Added 25 SAR revenue for manually purchased application ${application_id}`);
            } else if (to_status === 'offer_received') {
                // Transition to offer_received with selection deadline
                updateQuery = `
                    UPDATE submitted_applications 
                    SET status = $1, 
                        offer_selection_end_time = NOW() + INTERVAL '24 hours'
                    WHERE application_id = $2
                `;
                updateParams = [to_status, application_id];
            } else {
                // Standard status update
                updateQuery = `
                    UPDATE submitted_applications 
                    SET status = $1
                    WHERE application_id = $2
                `;
                updateParams = [to_status, application_id];
            }

            await client.query(updateQuery, updateParams);

            // Also update pos_application table
            await client.query(
                'UPDATE pos_application SET status = $1 WHERE application_id = $2',
                [to_status, application_id]
            );

            // Log the status transition
            await client.query(
                `
                INSERT INTO status_audit_log 
                    (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
                `,
                [application_id, from_status, to_status, admin_user_id, reason]
            );

            // Handle offer status updates if transitioning to completed
            if (to_status === 'completed') {
                // Mark all offers as deal_lost except the selected one
                await client.query(
                    `
                    UPDATE application_offers 
                    SET status = 'deal_lost' 
                    WHERE application_id = $1 AND status = 'submitted'
                    `,
                    [application_id]
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Application ${application_id} successfully transitioned from ${from_status} to ${to_status}`,
                data: {
                    application_id,
                    from_status,
                    to_status,
                    reason,
                    admin_user_id,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin force transition error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to perform status transition' },
            { status: 500 }
        );
    }
}
