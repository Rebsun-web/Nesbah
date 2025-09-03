import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function POST(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Validate admin session using session manager
        const sessionValidation = await AdminAuth.validateAdminSession(adminToken);
        
        if (!sessionValidation.valid) {
            return NextResponse.json({ 
                success: false, 
                error: sessionValidation.error || 'Invalid admin session' 
            }, { status: 401 });
        }

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const { application_id, bank_user_id, bank_name, offer_id } = await req.json();

        // Validate required fields
        if (!application_id || !bank_user_id || !bank_name || !offer_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_track-offer-submission_route.jsx_route');

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
