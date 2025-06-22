import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query(
            `SELECT email FROM users WHERE user_type = 'bank_user'`
        );

        const emails = result.rows.map(row => row.email).filter(email => email);

        return NextResponse.json({ success: true, data: emails });
    } catch (error) {
        console.error('Failed to fetch bank user emails:', error);
        return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
    }
}