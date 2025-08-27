import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
    const { user_id } = await params;

    try {
        const result = await pool.query(
            'SELECT * FROM pos_application WHERE user_id = $1 ORDER BY submitted_at DESC',
            [user_id]
        );

        const applications = result.rows.map(app => ({
            ...app,
            uploaded_document: app.uploaded_document
                ? `data:application/octet-stream;base64,${app.uploaded_document.toString('base64')}`
                : null,
        }));

        return NextResponse.json({ success: true, data: applications });
    } catch (error) {
        console.error('Error fetching POS applications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
    }
}
