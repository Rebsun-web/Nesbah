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

    try {
        // Get statistics for the bank
        const { rows } = await pool.query(
            `
            WITH incoming_leads AS (
                -- Count all live auction applications the bank hasn't purchased yet
                SELECT COUNT(*) as count
                FROM pos_application pa
                WHERE COALESCE(pa.current_application_status, pa.status) = 'live_auction'
                  AND NOT $1 = ANY(pa.purchased_by)
                  AND (pa.auction_end_time IS NULL OR pa.auction_end_time > NOW())
            ),
            submitted_offers AS (
                -- Count offers submitted by this bank
                SELECT COUNT(*) as count
                FROM application_offers ao
                WHERE ao.bank_user_id = $1
            ),
            ignored_applications AS (
                -- Count applications that ended without this bank purchasing
                SELECT COUNT(*) as count
                FROM pos_application pa
                WHERE COALESCE(pa.current_application_status, pa.status) IN ('completed', 'ignored')
                  AND NOT $1 = ANY(pa.purchased_by)
                  AND pa.auction_end_time < NOW()
            )
            SELECT 
                il.count as incoming_leads,
                so.count as purchased_leads,
                ia.count as ignored_leads
            FROM incoming_leads il, submitted_offers so, ignored_applications ia
            `,
            [bankUserId]
        );
        
        console.log('📊 Stats query result:', rows[0]);
        return NextResponse.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Failed to get stats:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve lead stats' },
            { status: 500 }
        );
    }
}