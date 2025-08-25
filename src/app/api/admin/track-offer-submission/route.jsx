import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
    try {
        const { application_id, bank_user_id, bank_name, offer_id } = await req.json();

        // Validate required fields
        if (!application_id || !bank_user_id || !bank_name || !offer_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await pool.connect();

        try {
            // Check if this bank has already submitted an offer for this application
            const existingSubmission = await client.query(
                'SELECT id FROM bank_offer_submissions WHERE application_id = $1 AND bank_user_id = $2',
                [application_id, bank_user_id]
            );

            if (existingSubmission.rows.length > 0) {
                // Update the submission record with new offer_id and timestamp
                await client.query(
                    'UPDATE bank_offer_submissions SET offer_id = $1, submitted_at = NOW() WHERE application_id = $2 AND bank_user_id = $3',
                    [offer_id, application_id, bank_user_id]
                );
            } else {
                // Insert new submission record
                await client.query(
                    'INSERT INTO bank_offer_submissions (application_id, bank_user_id, bank_name, offer_id, submitted_at) VALUES ($1, $2, $3, $4, NOW())',
                    [application_id, bank_user_id, bank_name, offer_id]
                );
            }

            return NextResponse.json({ success: true, message: 'Offer submission tracked successfully' });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error tracking offer submission:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
