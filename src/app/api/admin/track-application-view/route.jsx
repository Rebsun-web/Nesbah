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

        const { application_id, bank_user_id, bank_name } = await req.json();

        // Validate required fields
        if (!application_id || !bank_user_id || !bank_name) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry();

        try {
            // Check if this bank has already viewed this application
            const existingView = await client.query(
                'SELECT id FROM bank_application_views WHERE application_id = $1 AND bank_user_id = $2',
                [application_id, bank_user_id]
            );

            if (existingView.rows.length > 0) {
                // Update the view timestamp
                await client.query(
                    'UPDATE bank_application_views SET viewed_at = NOW() WHERE application_id = $1 AND bank_user_id = $2',
                    [application_id, bank_user_id]
                );
            } else {
                // Insert new view record
                await client.query(
                    'INSERT INTO bank_application_views (application_id, bank_user_id, bank_name, viewed_at) VALUES ($1, $2, $3, NOW())',
                    [application_id, bank_user_id, bank_name]
                );
            }

            return NextResponse.json({ success: true, message: 'Application view tracked successfully' });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error tracking application view:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
