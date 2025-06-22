import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json(
            { success: false, error: 'Missing user ID' },
            { status: 400 }
        );
    }

    try {
        const { rows } = await pool.query(
            `
                SELECT
                    (SELECT COUNT(*) FROM submitted_applications
                     WHERE NOT $1 = ANY(ignored_by)
                       AND NOT $1 = ANY(purchased_by)
                    ) AS incoming_leads,

                    (SELECT COUNT(*) FROM submitted_applications
                     WHERE $1 = ANY(purchased_by)
                    ) AS purchased_leads,

                    (SELECT COUNT(*) FROM submitted_applications
                     WHERE $1 = ANY(ignored_by)
                    ) AS ignored_leads,

                    (
                        SELECT ROUND(AVG(diff)::numeric, 2)
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
                    ) AS avg_response_time
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