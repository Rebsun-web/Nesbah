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
        
        // OPTIMIZED: Single query with proper indexing hints and efficient joins
        const result = await client.query(
            `SELECT 
                sa.id,
                sa.application_id,
                sa.status,
                sa.auction_end_time,
                sa.offers_count,
                sa.revenue_collected,
                sa.submitted_at,
                pa.trade_name,
                pa.city,
                pa.contact_person,
                pa.contact_person_number,
                pa.cr_number,
                bu.sector,
                'POS' as application_type
             FROM submitted_applications sa
             INNER JOIN pos_application pa ON sa.application_id = pa.application_id
             INNER JOIN business_users bu ON pa.user_id = bu.user_id
             WHERE sa.status = 'live_auction'
               AND NOT $1 = ANY(sa.ignored_by)
               AND NOT $1 = ANY(sa.purchased_by)
               AND (sa.auction_end_time IS NULL OR sa.auction_end_time > NOW())
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