import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const bank_id = searchParams.get('bank_id');
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const client = await pool.connect();

        try {
            let query = `
                SELECT 
                    tm.*,
                    u.email as bank_email
                FROM time_metrics tm
                JOIN users u ON tm.bank_user_id = u.user_id
                WHERE tm.calculation_date = $1
            `;
            let params = [date];

            if (bank_id) {
                query += ' AND tm.bank_user_id = $2';
                params.push(bank_id);
            }

            query += ' ORDER BY tm.conversion_rate DESC, tm.avg_response_time_minutes ASC';

            const result = await client.query(query, params);

            return NextResponse.json({
                success: true,
                data: result.rows,
                date: date
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error fetching time metrics:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const client = await pool.connect();

        try {
            // Call the database function to calculate metrics
            await client.query('SELECT calculate_bank_time_metrics()');

            return NextResponse.json({
                success: true,
                message: 'Time metrics calculated successfully'
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error calculating time metrics:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
