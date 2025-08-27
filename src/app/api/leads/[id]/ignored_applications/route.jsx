import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req, { params }) {
    const applicationId = (await params).id;
    const bankUserId = req.headers.get('x-user-id');

    if (!bankUserId) {
        return NextResponse.json({ success: false, error: 'Missing bank user ID' }, { status: 400 });
    }

    const body = await req.json();
    const rejectionReason = body.rejectionReason;

    if (!rejectionReason) {
        return NextResponse.json({ success: false, error: 'Missing rejection reason' }, { status: 400 });
    }

    try {
        const check = await pool.query(
            `SELECT * FROM submitted_applications
             WHERE application_id = $1 AND $2 = ANY(ignored_by)`,
            [applicationId, bankUserId]
        );

        const alreadyIgnored = check.rowCount > 0;
        if (alreadyIgnored) {
            return NextResponse.json({ success: false, error: 'Already ignored' });
        }

        await pool.query(
            `INSERT INTO application_rejections (submitted_application_id, bank_user_id, rejection_reason, timestamp)
             SELECT id, $1, $2, NOW() AT TIME ZONE 'UTC'
             FROM submitted_applications
             WHERE application_id = $3`,
            [bankUserId, rejectionReason, applicationId]
        );

        const timestampPath = `{"${bankUserId}"}`;
        await pool.query(
            `UPDATE submitted_applications
             SET
                 ignored_by = array_append(ignored_by, $1),
                 ignored_by_timestamps = jsonb_set(
                     COALESCE(ignored_by_timestamps, '{}'),
                     $2,
                     to_jsonb(to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
                 )
             WHERE application_id = $3`,
            [bankUserId, timestampPath, applicationId]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to mark lead as ignored:', err);
        console.error(err.stack);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const businessUserId = (await params).id;

    try {
        const { rows } = await pool.query(
            `SELECT ar.rejection_reason, ar.timestamp, u.entity_name
             FROM application_rejections ar
             JOIN users u ON ar.bank_user_id = u.user_id
             JOIN submitted_applications sa ON ar.submitted_application_id = sa.id
             JOIN pos_application pa ON sa.application_id = pa.application_id
             WHERE pa.user_id = $1`,
            [businessUserId]
        );

        return NextResponse.json({ success: true, rejections: rows });
    } catch (err) {
        console.error('Failed to fetch rejection reactions:', err);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}