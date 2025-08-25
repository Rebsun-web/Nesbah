import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    const bankUserId = req.headers.get('x-user-id');

    if (!bankUserId) {
        return NextResponse.json({ success: false, error: 'Missing bank user ID' }, { status: 400 });
    }

    try {
        const result = await pool.query(
            `SELECT sa.*, pa.submitted_at, sa.application_id, 'POS' as application_type,
                    sa.auction_end_time, sa.offers_count, sa.revenue_collected
             FROM submitted_applications sa
                      JOIN pos_application pa ON sa.application_id = pa.application_id
             WHERE sa.status = 'live_auction'
               AND NOT $1 = ANY(sa.ignored_by)
               AND NOT $1 = ANY(sa.purchased_by)
               AND sa.auction_end_time > NOW()
             ORDER BY pa.submitted_at DESC`,
            [bankUserId]
        );

        return NextResponse.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Failed to fetch leads:', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
    }
}