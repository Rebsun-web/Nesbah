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
    
    const userId = authResult.user.user_id;

    try {
        // Optimized single query instead of multiple subqueries
        const { rows } = await pool.query(
            `
            WITH stats AS (
                SELECT 
                    COUNT(*) FILTER (WHERE status IN ('live_auction')
                        AND NOT $1 = ANY(ignored_by) 
                        AND NOT $1 = ANY(purchased_by) 
                        AND (auction_end_time IS NULL OR auction_end_time > NOW())) as incoming_leads,
                    COUNT(*) FILTER (WHERE $1 = ANY(purchased_by)) as purchased_leads,
                    COUNT(*) FILTER (WHERE $1 = ANY(ignored_by)) as ignored_leads,
                    COALESCE(SUM(amount), 0) as total_revenue
                FROM submitted_applications sa
                LEFT JOIN application_revenue ar ON sa.id = ar.application_id AND ar.bank_user_id = $1
            ),
            avg_response AS (
                SELECT ROUND(AVG(diff)::numeric, 2) as avg_response_time
                FROM (
                    SELECT (
                        EXTRACT(EPOCH FROM (
                            (sa.purchased_by_timestamps ->> $1)::timestamptz - pa.submitted_at
                        )) / 3600
                    ) AS diff
                    FROM submitted_applications sa
                    JOIN pos_application pa ON sa.application_id = pa.application_id
                    WHERE $1 = ANY(sa.purchased_by)
                    AND sa.purchased_by_timestamps ->> $1 IS NOT NULL

                    UNION ALL

                    SELECT (
                        EXTRACT(EPOCH FROM (
                            (sa.ignored_by_timestamps ->> $1)::timestamptz - pa.submitted_at
                        )) / 3600
                    ) AS diff
                    FROM submitted_applications sa
                    JOIN pos_application pa ON sa.application_id = pa.application_id
                    WHERE $1 = ANY(sa.ignored_by)
                    AND sa.ignored_by_timestamps ->> $1 IS NOT NULL
                ) AS sub
            )
            SELECT 
                s.incoming_leads,
                s.purchased_leads,
                s.ignored_leads,
                s.total_revenue,
                ar.avg_response_time
            FROM stats s, avg_response ar
            `,
            [userId]
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