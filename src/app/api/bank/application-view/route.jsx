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
                // Record application view using existing table structure
                try {
                    result = await client.query(`
                        INSERT INTO bank_application_views (
                            application_id,
                            bank_user_id,
                            bank_name,
                            viewed_at,
                            ip_address,
                            user_agent
                        ) VALUES ($1, $2, $3, NOW(), $4, $5)
                        RETURNING id
                    `, [application_id, bankUserId, authResult.user.entity_name || 'Unknown Bank', ipAddress, userAgent]);
                } catch (error) {
                    // If it's a duplicate key error, just update the existing record
                    if (error.code === '23505') { // Unique violation
                        result = await client.query(`
                            UPDATE bank_application_views 
                            SET viewed_at = NOW(), ip_address = $3, user_agent = $4
                            WHERE application_id = $1 AND bank_user_id = $2
                            RETURNING id
                        `, [application_id, bankUserId, ipAddress, userAgent]);
                    } else {
                        throw error;
                    }
                }
            } else {
                // For other action types, just log them (we can create a simple log table later if needed)
                console.log(`Action recorded: ${action_type} for application ${application_id} by bank user ${bankUserId}`);
                result = { rows: [{ id: Date.now() }] }; // Return a dummy result
            }

            return NextResponse.json({
                success: true,
                message: `Application ${action_type} recorded successfully`,
                log_id: result.rows[0]?.id
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
                    viewed_at,
                    ip_address,
                    user_agent,
                    bank_name
                FROM bank_application_views
                WHERE bank_user_id = $1 AND application_id = $2
                ORDER BY viewed_at DESC
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
