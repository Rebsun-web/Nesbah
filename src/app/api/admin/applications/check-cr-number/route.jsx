import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

// GET - Check if CR number exists for another application
export async function GET(req) {
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

        const { searchParams } = new URL(req.url);
        const crNumber = searchParams.get('cr_number');
        const excludeId = searchParams.get('exclude_id');
        
        if (!crNumber) {
            return NextResponse.json({ success: false, error: 'CR number is required' }, { status: 400 });
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_applications_check_cr_number_route.jsx_route');
        
        try {
            // Check if CR number exists in another application
            const query = `
                SELECT COUNT(*) as count
                FROM pos_application 
                WHERE cr_number = $1 
                AND application_id != $2
            `;
            
            const result = await client.query(query, [crNumber, excludeId || 0]);
            const exists = parseInt(result.rows[0].count) > 0;

            return NextResponse.json({
                success: true,
                data: {
                    exists,
                    count: parseInt(result.rows[0].count)
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('CR number check error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check CR number' },
            { status: 500 }
        );
    }
}
