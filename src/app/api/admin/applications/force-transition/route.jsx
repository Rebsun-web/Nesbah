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

            // Verify current status from tracking table
            const currentStatusQuery = await client.query(
                'SELECT DISTINCT current_application_status FROM application_offer_tracking WHERE application_id = $1 LIMIT 1',
                [application_id]
            );

            if (currentStatusQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: 'Application not found in tracking table' },
                    { status: 404 }
                );
            }

            const currentStatus = currentStatusQuery.rows[0].current_application_status;
            if (currentStatus !== from_status) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error: `Application is currently in ${currentStatus} status, not ${from_status}` },
                    { status: 400 }
                );
            }

            // Update application status directly in all tables
            if (to_status === 'live_auction') {
                // Reset to live_auction with new auction deadline
                await client.query(`
                    UPDATE application_offer_tracking 
                    SET current_application_status = $1, 
                        application_window_end = NOW() + INTERVAL '48 hours',
                        offer_window_start = NULL,
                        offer_window_end = NULL,
                        purchased_at = NULL,
                        offer_sent_at = NULL,
                        offer_accepted_at = NULL,
                        offer_rejected_at = NULL
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                // Also update submitted_applications table
                await client.query(
                    `UPDATE submitted_applications 
                     SET status = $1,
                         auction_end_time = NOW() + INTERVAL '48 hours',
                         offers_count = 0,
                         revenue_collected = 0,
                         ignored_by = '{}',
                         purchased_by = '{}',
                         opened_by = '{}'
                     WHERE application_id = $1`,
                    [application_id]
                );
                
                // Update pos_application table
                await client.query(
                    `UPDATE pos_application SET status = $1 WHERE application_id = $2`,
                    [to_status, application_id]
                );
                
                // Log the status transition
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [application_id, from_status, to_status, admin_user_id, reason]);
                
                console.log(`🔄 Application ${application_id} reset to live_auction with new 48-hour deadline`);
            } else if (to_status === 'completed') {
                // Transition to completed status
                await client.query(`
                    UPDATE application_offer_tracking 
                    SET current_application_status = $1,
                        offer_window_start = NOW(),
                        offer_window_end = NOW() + INTERVAL '24 hours'
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                // Update submitted_applications table
                await client.query(
                    `UPDATE submitted_applications SET status = $1 WHERE application_id = $2`,
                    [to_status, application_id]
                );
                
                // Update pos_application table
                await client.query(
                    `UPDATE pos_application SET status = $1 WHERE application_id = $2`,
                    [to_status, application_id]
                );
                
                console.log(`✅ Application ${application_id} manually transitioned to completed`);
                
                // Log the status transition
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [application_id, from_status, to_status, admin_user_id, reason]);
            } else if (to_status === 'ignored') {
                // Transition to ignored status
                await client.query(`
                    UPDATE application_offer_tracking 
                    SET current_application_status = $1
                    WHERE application_id = $2
                `, [to_status, application_id]);
                
                // Update submitted_applications table
                await client.query(
                    `UPDATE submitted_applications SET status = $1 WHERE application_id = $2`,
                    [to_status, application_id]
                );
                
                // Update pos_application table
                await client.query(
                    `UPDATE pos_application SET status = $1 WHERE application_id = $2`,
                    [to_status, application_id]
                );
                
                console.log(`❌ Application ${application_id} manually transitioned to ignored`);
                
                // Log the status transition
                await client.query(`
                    INSERT INTO status_audit_log (application_id, from_status, to_status, admin_user_id, reason, timestamp)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                `, [application_id, from_status, to_status, admin_user_id, reason]);
            }
            
            // If no rows were affected, it means there's no tracking record
            // Create one if it doesn't exist
            if (updateResult.rowCount === 0) {
                console.log(`No tracking record found for application ${application_id}, creating one...`);
                
                // Get application details
                const appDetails = await client.query(
                    'SELECT business_user_id, submitted_at FROM submitted_applications WHERE application_id = $1',
                    [application_id]
                );
                
                if (appDetails.rows.length > 0) {
                    const { business_user_id, submitted_at } = appDetails.rows[0];
                    
                    // Get all bank users
                    const bankUsers = await client.query(
                        'SELECT user_id FROM users WHERE user_type = $1',
                        ['bank_user']
                    );
                    
                    // Create tracking records for all bank users
                    for (const bankUser of bankUsers.rows) {
                        await client.query(`
                            INSERT INTO application_offer_tracking (
                                application_id,
                                business_user_id,
                                bank_user_id,
                                application_submitted_at,
                                application_window_start,
                                application_window_end,
                                current_application_status
                            ) VALUES ($1, $2, $3, $4, $4, $4 + INTERVAL '48 hours', $5)
                        `, [application_id, business_user_id, bankUser.user_id, submitted_at, to_status]);
                    }
                    
                    console.log(`Created ${bankUsers.rows.length} tracking records for application ${application_id}`);
                }
            }

            // Also update submitted_applications table for backward compatibility
            await client.query(
                'UPDATE submitted_applications SET status = $1 WHERE application_id = $2',
                [to_status, application_id]
            );
            
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

            // Handle offer status updates if transitioning to complete
            if (to_status === 'complete') {
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
