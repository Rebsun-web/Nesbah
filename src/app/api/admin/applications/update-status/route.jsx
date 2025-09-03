import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// POST - Update application statuses using the correct logic
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
        const { application_ids } = body;

        // Validate input
        if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Application IDs array is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_update_status_route.jsx');
        
        try {
            await client.query('BEGIN');

            // Update application statuses using the correct logic
            const updateQuery = `
                UPDATE pos_application 
                SET 
                    status = CASE 
                        WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                        WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END,
                    updated_at = NOW()
                WHERE application_id = ANY($1)
                AND status = 'live_auction'
            `;
            
            const updateResult = await client.query(updateQuery, [application_ids]);
            
            // Get updated applications for response
            const getUpdatedQuery = `
                SELECT 
                    application_id,
                    status,
                    auction_end_time,
                    offers_count,
                    updated_at,
                    CASE 
                        WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                        WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END as calculated_status
                FROM pos_application 
                WHERE application_id = ANY($1)
            `;
            
            const updatedResult = await client.query(getUpdatedQuery, [application_ids]);
            
            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: `Updated ${updateResult.rowCount} applications`,
                data: {
                    updated_count: updateResult.rowCount,
                    applications: updatedResult.rows
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application status update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update application statuses' },
            { status: 500 }
        );
    }
}

// GET - Get applications that need status updates
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

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_update_status_route.jsx');
        
        try {
            // Get applications that need status updates
            const query = `
                SELECT 
                    application_id,
                    trade_name,
                    cr_number,
                    status as current_status,
                    auction_end_time,
                    offers_count,
                    submitted_at,
                    CASE 
                        WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'completed'
                        WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'ignored'
                        ELSE 'live_auction'
                    END as calculated_status,
                    CASE 
                        WHEN auction_end_time < NOW() AND offers_count > 0 THEN 'needs_update'
                        WHEN auction_end_time < NOW() AND offers_count = 0 THEN 'needs_update'
                        ELSE 'no_update_needed'
                    END as update_status
                FROM pos_application 
                WHERE status = 'live_auction'
                ORDER BY auction_end_time ASC
            `;
            
            const result = await client.query(query);
            
            const needsUpdate = result.rows.filter(row => row.update_status === 'needs_update');
            const noUpdateNeeded = result.rows.filter(row => row.update_status === 'no_update_needed');
            
            return NextResponse.json({
                success: true,
                data: {
                    total_applications: result.rows.length,
                    needs_update: needsUpdate.length,
                    no_update_needed: noUpdateNeeded.length,
                    applications_needing_update: needsUpdate,
                    applications_current: noUpdateNeeded
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check application statuses' },
            { status: 500 }
        );
    }
}
