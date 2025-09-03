import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// POST - Track when a bank views an application (same as business-bank actions)
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

        const body = await req.json();
        const { application_id, bank_user_id } = body;

        // Validate input
        if (!application_id || !bank_user_id) {
            return NextResponse.json(
                { success: false, error: 'Application ID and Bank User ID are required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_track_view_route.jsx');
        
        try {
            await client.query('BEGIN');

            // Verify application exists and is in live auction
            const applicationCheck = await client.query(
                `SELECT application_id, status, auction_end_time, opened_by 
                 FROM pos_application 
                 WHERE application_id = $1`,
                [application_id]
            );
            
            if (applicationCheck.rows.length === 0) {
                throw new Error('Application not found');
            }
            
            const application = applicationCheck.rows[0];
            
            // Check if application is still in live auction
            if (application.status !== 'live_auction') {
                throw new Error('Application is not in live auction status');
            }
            
            // Check if auction has expired
            if (application.auction_end_time < new Date()) {
                throw new Error('Application auction has expired');
            }

            // Verify bank user exists
            const bankCheck = await client.query(
                'SELECT user_id FROM users WHERE user_id = $1 AND user_type = $2',
                [bank_user_id, 'bank_user']
            );
            
            if (bankCheck.rows.length === 0) {
                throw new Error('Bank user not found or invalid user type');
            }

            // Update opened_by array (same logic as business-bank actions)
            const updateQuery = `
                UPDATE pos_application 
                SET 
                    opened_by = CASE 
                        WHEN $2 = ANY(COALESCE(opened_by, ARRAY[]::integer[])) THEN COALESCE(opened_by, ARRAY[]::integer[])
                        ELSE array_append(COALESCE(opened_by, ARRAY[]::integer[]), $2)
                    END,
                    updated_at = NOW()
                WHERE application_id = $1
                AND status = 'live_auction'
            `;
            
            const updateResult = await client.query(updateQuery, [application_id, bank_user_id]);
            
            if (updateResult.rowCount === 0) {
                throw new Error('Failed to update application view tracking');
            }

            // Get updated application for response
            const getUpdatedQuery = `
                SELECT 
                    application_id,
                    opened_by,
                    COALESCE(array_length(opened_by, 1), 0) as opened_count,
                    updated_at
                FROM pos_application 
                WHERE application_id = $1
            `;
            
            const updatedResult = await client.query(getUpdatedQuery, [application_id]);
            
            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Application view tracked successfully',
                data: {
                    application_id,
                    bank_user_id,
                    opened_by: updatedResult.rows[0].opened_by,
                    opened_count: updatedResult.rows[0].opened_count,
                    updated_at: updatedResult.rows[0].updated_at
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application view tracking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to track application view: ' + error.message },
            { status: 500 }
        );
    }
}

// GET - Get applications with view tracking information
export async function GET(req) {
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

        const { searchParams } = new URL(req.url);
        const application_id = searchParams.get('application_id');
        const bank_user_id = searchParams.get('bank_user_id');

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_track_view_route.jsx');
        
        try {
            let query = '';
            let queryParams = [];

            if (application_id && bank_user_id) {
                // Get specific application view tracking
                query = `
                    SELECT 
                        pa.application_id,
                        pa.trade_name,
                        pa.cr_number,
                        pa.status,
                        pa.opened_by,
                        pa.purchased_by,
                        COALESCE(array_length(pa.opened_by, 1), 0) as opened_count,
                        COALESCE(array_length(pa.purchased_by, 1), 0) as purchased_count,
                        CASE WHEN $2 = ANY(COALESCE(pa.opened_by, ARRAY[]::integer[])) THEN true ELSE false END as has_viewed,
                        CASE WHEN $2 = ANY(COALESCE(pa.purchased_by, ARRAY[]::integer[])) THEN true ELSE false END as has_purchased,
                        pa.auction_end_time,
                        pa.offers_count,
                        pa.submitted_at
                    FROM pos_application pa
                    WHERE pa.application_id = $1
                `;
                queryParams = [application_id, bank_user_id];
            } else if (application_id) {
                // Get all banks that viewed a specific application
                query = `
                    SELECT 
                        pa.application_id,
                        pa.trade_name,
                        pa.cr_number,
                        pa.status,
                        pa.opened_by,
                        pa.purchased_by,
                        COALESCE(array_length(pa.opened_by, 1), 0) as opened_count,
                        COALESCE(array_length(pa.purchased_by, 1), 0) as purchased_count,
                        pa.auction_end_time,
                        pa.offers_count,
                        pa.submitted_at,
                        -- Bank details for opened_by array
                        array_agg(DISTINCT u.entity_name) FILTER (WHERE u.user_id = ANY(pa.opened_by)) as opened_by_banks,
                        array_agg(DISTINCT u.entity_name) FILTER (WHERE u.user_id = ANY(pa.purchased_by)) as purchased_by_banks
                    FROM pos_application pa
                    LEFT JOIN users u ON u.user_id = ANY(pa.opened_by) OR u.user_id = ANY(pa.purchased_by)
                    WHERE pa.application_id = $1
                    GROUP BY pa.application_id, pa.trade_name, pa.cr_number, pa.status, pa.opened_by, pa.purchased_by, pa.auction_end_time, pa.offers_count, pa.submitted_at
                `;
                queryParams = [application_id];
            } else {
                // Get all applications with view tracking summary
                query = `
                    SELECT 
                        pa.application_id,
                        pa.trade_name,
                        pa.cr_number,
                        pa.status,
                        COALESCE(array_length(pa.opened_by, 1), 0) as opened_count,
                        COALESCE(array_length(pa.purchased_by, 1), 0) as purchased_count,
                        pa.auction_end_time,
                        pa.offers_count,
                        pa.submitted_at
                    FROM pos_application pa
                    WHERE pa.status = 'live_auction'
                    ORDER BY pa.submitted_at DESC
                `;
            }
            
            const result = await client.query(query, queryParams);
            
            return NextResponse.json({
                success: true,
                data: {
                    applications: result.rows,
                    count: result.rows.length
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application view tracking query error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to query application view tracking' },
            { status: 500 }
        );
    }
}
