import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const body = await req.json();
        const {
            application_id,
            from_status,
            to_status,
            reason
        } = body;
        
        const admin_user_id = adminUser.admin_id;

        // Validate required fields
        if (!application_id || !from_status || !to_status || !reason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: application_id, from_status, to_status, reason' },
                { status: 400 }
            );
        }

        // Validate status transition
        const validTransitions = {
            'live_auction': ['completed', 'ignored'],
            'completed': [], // Completed is a final state
            'ignored': ['live_auction'] // Allow reset
        };

        if (!validTransitions[from_status]?.includes(to_status)) {
            return NextResponse.json(
                { success: false, error: `Invalid status transition from ${from_status} to ${to_status}` },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            await client.query('BEGIN');

            // Verify current status from pos_application table
            const currentStatusQuery = await client.query(
                `SELECT 
                    COALESCE(current_application_status, status) as current_status,
                    auction_end_time,
                    offer_selection_end_time
                FROM pos_application 
                WHERE application_id = $1`,
                [application_id]
            );

            if (currentStatusQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Application not found' },
                    { status: 404 }
                );
            }

            const currentStatus = currentStatusQuery.rows[0].current_status;
            if (currentStatus !== from_status) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: `Application is currently in ${currentStatus} status, not ${from_status}` },
                    { status: 400 }
                );
            }

            // Update application status in pos_application table
            if (to_status === 'live_auction') {
                // Reset to live_auction with new auction deadline
                await client.query(`
                    UPDATE pos_application 
                    SET current_application_status = $1,
                        status = $1,
                        auction_end_time = NOW() + INTERVAL '48 hours',
                        offer_selection_end_time = NULL,
                        offers_count = 0,
                        revenue_collected = 0,
                        opened_by = '{}',
                        purchased_by = '{}',
                        offer_selection_end_time = NULL
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                console.log(`🔄 Application ${application_id} reset to live_auction with new 48-hour deadline`);
            } else if (to_status === 'completed') {
                // Transition to completed status
                await client.query(`
                    UPDATE pos_application 
                    SET current_application_status = $1,
                        status = $1,
                        offer_selection_end_time = NOW() + INTERVAL '24 hours'
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                console.log(`✅ Application ${application_id} manually transitioned to completed`);
            } else if (to_status === 'ignored') {
                // Transition to ignored status
                await client.query(`
                    UPDATE pos_application 
                    SET current_application_status = $1,
                        status = $1
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                console.log(`❌ Application ${application_id} manually transitioned to ignored`);
            }

            // Log the status transition
            await client.query(`
                INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, [application_id, from_status, to_status, admin_user_id, reason]);

            // Handle offer status updates if transitioning to completed
            if (to_status === 'completed') {
                // Mark all offers as deal_lost except the selected one
                await client.query(
                    `
                    UPDATE application_offers 
                    SET status = 'deal_lost' 
                    WHERE submitted_application_id = $1 AND status = 'submitted'
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
