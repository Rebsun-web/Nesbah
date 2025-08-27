
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req, { params }) {
    // Authenticate the request
    const authResult = await authenticateAPIRequest(req, 'business_user');
    if (!authResult.success) {
        return NextResponse.json(
            { success: false, error: authResult.error },
            { status: authResult.status || 401 }
        );
    }
    
    const { user_id } = await params;

    const client = await pool.connectWithRetry();
    
    try {
        // OPTIMIZED: Single query with specific column selection for better performance
        const result = await client.query(
            `SELECT 
                user_id,
                trade_name,
                cr_national_number,
                cr_number,
                registration_status,
                address,
                sector,
                city,
                cr_capital,
                cash_capital,
                in_kind_capital,
                contact_person,
                contact_person_number,
                contact_info,
                store_url,
                legal_form,
                issue_date_gregorian,
                confirmation_date_gregorian,
                has_ecommerce,
                management_structure,
                management_managers
             FROM business_users 
             WHERE user_id = $1`,
            [user_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'No business user found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching business user info:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    } finally {
        client.release();
    }
}