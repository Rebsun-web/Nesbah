import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function PUT(req) {
    try {
        // Authenticate the request
        const authResult = await authenticateAPIRequest(req, 'bank_user');
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status || 401 }
            );
        }
        
        const bankUserId = authResult.user.user_id;
        const { logo_url } = await req.json();

        if (!logo_url) {
            return NextResponse.json(
                { success: false, error: 'Logo URL is required' },
                { status: 400 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_users_update-bank-logo_route.jsx_route');
        
        try {
            // Update the logo_url in the bank_users table
            const result = await client.query(
                `UPDATE bank_users 
                 SET logo_url = $1
                 WHERE user_id = $2`,
                [logo_url, bankUserId]
            );

            if (result.rowCount === 0) {
                return NextResponse.json(
                    { success: false, error: 'Bank user not found' },
                    { status: 404 }
                );
            }

            // Also update the logo_url in the users table if it exists there
            await client.query(
                `UPDATE users 
                 SET logo_url = $1
                 WHERE user_id = $2`,
                [logo_url, bankUserId]
            );

            return NextResponse.json({
                success: true,
                message: 'Bank logo updated successfully',
                logo_url: logo_url
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error updating bank logo:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update bank logo' },
            { status: 500 }
        );
    }
}
