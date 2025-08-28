import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }

    try {
        const result = await pool.query(`
          SELECT 
            sa.*,
            COALESCE(aot.current_application_status, sa.status) as current_status
          FROM submitted_applications sa
          LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
          WHERE 
            ($1 = ANY(sa.opened_by) OR $1 = ANY(sa.purchased_by))
            AND NOT ($1 = ANY(sa.ignored_by))
        `, [userId]);

        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching leads history:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch leads history' }, { status: 500 });
    }
}
