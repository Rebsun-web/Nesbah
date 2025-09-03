
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateAPIRequest } from '@/lib/auth/api-auth';

export async function GET(req, { params }) {
    console.log('🔍 API: Portal client request received');
    
    // Get user from cookies (middleware already validated)
    const userToken = req.cookies.get('user_token')?.value;
    if (!userToken) {
        console.log('🔍 API: No user token found');
        return NextResponse.json(
            { success: false, error: 'No authentication token' },
            { status: 401 }
        );
    }
    
    try {
        // Import JWT utility for verification
        const JWTUtils = (await import('@/lib/auth/jwt-utils.js')).default;
        
        // Verify JWT token
        const verificationResult = JWTUtils.verifyToken(userToken);
        
        if (!verificationResult.valid) {
            console.log('🔍 API: Invalid token');
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }
        
        const user = verificationResult.payload;
        console.log('🔍 API: Authenticated user:', user);
        
        const { user_id } = await params;

        // Ensure user can only access their own data
        if (user.user_id !== parseInt(user_id)) {
            console.log('🔍 API: Access denied - user ID mismatch');
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            );
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_portal_client_[user_id]_route.jsx_route');
    
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
    } catch (error) {
        console.error('🔍 API: JWT verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Authentication error' },
            { status: 401 }
        );
    }
}