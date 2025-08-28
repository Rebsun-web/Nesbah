import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req) {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(req, 'bank_user');
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
        );
    }
    
    const bankUserId = authResult.user.user_id;

    let client;
    try {
        // Use the improved connection management
        client = await pool.connectWithRetry();
        
        // UPDATED: Show all live auction applications that the bank hasn't purchased yet
        const result = await client.query(
            `SELECT 
                pa.application_id,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                pa.submitted_at,
                pa.trade_name,
                pa.city_of_operation as city,
                pa.contact_person,
                pa.contact_person_number,
                pa.cr_number,
                bu.sector,
                'POS' as application_type,
                -- Check if bank has already viewed this application
                CASE WHEN $1 = ANY(pa.opened_by) THEN true ELSE false END as has_viewed,
                -- Check if bank has already purchased this application
                CASE WHEN $1 = ANY(pa.purchased_by) THEN true ELSE false END as has_purchased
             FROM pos_application pa
             INNER JOIN business_users bu ON pa.user_id = bu.user_id
             WHERE COALESCE(pa.current_application_status, pa.status) = 'live_auction'
               AND NOT $1 = ANY(pa.purchased_by)  -- Only show applications bank hasn't purchased
               AND (pa.auction_end_time IS NULL OR pa.auction_end_time > NOW())
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        return NextResponse.json({ 
            success: true, 
            data: result.rows,
            count: result.rows.length
        });
    } catch (err) {
        console.error('Failed to fetch leads:', err);
        
        // Provide more specific error messages
        if (err.code === '53300' || err.message.includes('connection slots are reserved')) {
            return NextResponse.json({ 
                success: false, 
                error: 'Database temporarily unavailable. Please try again in a moment.' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch leads' 
        }, { status: 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}