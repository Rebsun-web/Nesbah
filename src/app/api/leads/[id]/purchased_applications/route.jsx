import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AnalyticsService } from '@/lib/analytics/analytics-service';

export async function POST(req, { params }) {
    const applicationId = (await params).id;
    const bankUserId = req.headers.get('x-user-id');

    if (!bankUserId) {
        return NextResponse.json({ success: false, message: 'Missing bank user ID' }, { status: 400 });
    }

    try {
        const formData = await req.formData();
        const action = formData.get('action');

        if (action !== 'approve') {
            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        }

        // Check if already purchased using pos_application table
        const check = await pool.query(
            `SELECT * FROM pos_application
             WHERE application_id = $1 AND $2 = ANY(purchased_by)`,
            [applicationId, bankUserId]
        );

        const alreadyPurchased = check.rowCount > 0;

        if (!alreadyPurchased) {
            // Update pos_application with purchase tracking (remove revenue collection)
            await pool.query(
                `UPDATE pos_application
                 SET
                     purchased_by = array_append(purchased_by, $1),
                     offers_count = offers_count + 1
                 WHERE application_id = $2`,
                [bankUserId, applicationId]
            );

            // Keep pos_application status as 'live_auction' - don't change to 'completed'
            // This allows multiple banks to purchase the same application
        }

        // Remove ad-hoc offer submission flow from this endpoint

        return NextResponse.json({ success: true, message: 'Offer submitted or lead purchased.' });
    } catch (err) {
        console.error('Failed to mark lead as purchased:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    const businessUserId = (await params).id;

    try {
        // Query using pos_application table with current structure
        const result = await pool.query(
          `SELECT
            u.entity_name,
            ao.offer_comment,
            ao.submitted_at AS submitted_at
          FROM application_offers ao
          JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
          JOIN users u ON u.user_id = ao.submitted_by_user_id
          WHERE pa.user_id = $1`,
          [businessUserId]
        );

        return NextResponse.json({ success: true, approved: result.rows });
    } catch (err) {
        console.error('Failed to fetch approved reactions:', err);
        return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }
}