import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function POST(req) {
    try {
        // Authenticate the request
        const authResult = await authenticateAPIRequest(req, 'bank_user');
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            );
        }
        
        const bankUserId = authResult.user.user_id;
        const body = await req.json();
        const { application_id, action_type = 'view', session_id = null } = body;
        
        if (!application_id) {
            return NextResponse.json(
                { success: false, error: 'Application ID is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            // Verify the application exists and is accessible to this bank
            const appCheck = await client.query(`
                SELECT application_id FROM pos_application 
                WHERE application_id = $1 AND $2 = ANY(opened_by)
            `, [application_id, bankUserId]);
            
            if (appCheck.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Application not found or not accessible' },
                    { status: 404 }
                );
            }

            // Get client IP and user agent
            const ipAddress = req.headers.get('x-forwarded-for') || 
                            req.headers.get('x-real-ip') || 
                            req.connection?.remoteAddress || 
                            'unknown';
            const userAgent = req.headers.get('user-agent') || 'unknown';

            let result;
            
            if (action_type === 'view') {
                // Record application view
                result = await client.query(`
                    SELECT record_application_view($1, $2, $3, $4)
                `, [bankUserId, application_id, ipAddress, userAgent]);
            } else if (action_type === 'offer_preparation_start') {
                // Record offer preparation start
                result = await client.query(`
                    SELECT record_offer_preparation_start($1, $2, $3)
                `, [bankUserId, application_id, session_id]);
            } else if (action_type === 'offer_preparation_end') {
                // Record offer preparation end
                result = await client.query(`
                    SELECT record_offer_preparation_end($1, $2, $3)
                `, [bankUserId, application_id, session_id]);
            } else {
                // Record custom action
                result = await client.query(`
                    INSERT INTO bank_application_access_log (
                        bank_user_id, 
                        application_id, 
                        action_type, 
                        session_id,
                        ip_address,
                        user_agent
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING log_id
                `, [bankUserId, application_id, action_type, session_id, ipAddress, userAgent]);
            }

            return NextResponse.json({
                success: true,
                message: `Application ${action_type} recorded successfully`,
                log_id: result.rows[0]?.log_id || result.rows[0]?.record_application_view
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application view tracking error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to record application view' },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        // Authenticate the request
        const authResult = await authenticateAPIRequest(req, 'bank_user');
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            );
        }
        
        const bankUserId = authResult.user.user_id;
        const { searchParams } = new URL(req.url);
        const application_id = searchParams.get('application_id');

        if (!application_id) {
            return NextResponse.json(
                { success: false, error: 'Application ID is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();
        
        try {
            // Get view history for this application
            const viewHistory = await client.query(`
                SELECT 
                    bav.viewed_at,
                    bav.view_duration_seconds,
                    bal.action_type,
                    bal.action_timestamp,
                    bal.session_id
                FROM bank_application_views bav
                LEFT JOIN bank_application_access_log bal ON 
                    bav.bank_user_id = bal.bank_user_id 
                    AND bav.application_id = bal.application_id
                WHERE bav.bank_user_id = $1 AND bav.application_id = $2
                ORDER BY bav.viewed_at DESC
            `, [bankUserId, application_id]);

            return NextResponse.json({
                success: true,
                data: viewHistory.rows
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application view history error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch view history' },
            { status: 500 }
        );
    }
}
