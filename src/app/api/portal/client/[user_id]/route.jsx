
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
    const { user_id  } = params;

    try {
        const result = await pool.query(
            `SELECT * FROM business_users WHERE user_id = $1`,
            [user_id ]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'No business user found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching business user info:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}