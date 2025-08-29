import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import JWTUtils from '@/lib/auth/jwt-utils';

export async function GET(req) {
    try {
        // Get admin token from cookies
        const adminToken = req.cookies.get('admin_token')?.value;
        
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'No admin token found' }, { status: 401 });
        }

        // Verify JWT token directly
        const jwtResult = JWTUtils.verifyToken(adminToken);
        
        if (!jwtResult.valid || !jwtResult.payload || jwtResult.payload.user_type !== 'admin_user') {
            console.log('🔧 Time metrics: JWT verification failed:', jwtResult);
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid admin token' 
            }, { status: 401 });
        }

        const decoded = jwtResult.payload;

        // Get admin user from JWT payload
        const adminUser = {
            admin_id: decoded.admin_id,
            email: decoded.email,
            full_name: decoded.full_name,
            role: decoded.role,
            permissions: decoded.permissions,
            is_active: true
        };

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const client = await pool.connectWithRetry();
        
        try {
            // Calculate average response time (time from application submission to first bank view)
            const avgResponseTimeQuery = `
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (bav.viewed_at - pa.submitted_at))/3600) as avg_response_time_hours
                FROM pos_application pa
                JOIN bank_application_views bav ON pa.application_id = bav.application_id
                WHERE pa.submitted_at IS NOT NULL AND bav.viewed_at IS NOT NULL
                AND bav.viewed_at > pa.submitted_at
            `;

            const avgResponseTime = await client.query(avgResponseTimeQuery);

            // Calculate average offer time (time from first view to offer submission)
            const avgOfferTimeQuery = `
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (bos.submitted_at - bav.viewed_at))/3600) as avg_offer_time_hours
                FROM pos_application pa
                JOIN bank_application_views bav ON pa.application_id = bav.application_id
                JOIN bank_offer_submissions bos ON pa.application_id = bos.application_id 
                    AND bos.bank_user_id = bav.bank_user_id
                WHERE bav.viewed_at IS NOT NULL AND bos.submitted_at IS NOT NULL
                AND bos.submitted_at > bav.viewed_at
            `;

            const avgOfferTime = await client.query(avgOfferTimeQuery);

            // Get total applications
            const totalApplicationsQuery = `
                SELECT COUNT(DISTINCT application_id) as total_applications
                FROM pos_application
            `;

            const totalApplications = await client.query(totalApplicationsQuery);

            // Get total offers
            const totalOffersQuery = `
                SELECT COUNT(*) as total_offers
                FROM bank_offer_submissions
            `;

            const totalOffers = await client.query(totalOffersQuery);

            // Calculate conversion rate
            const conversionRate = totalApplications.rows[0].total_applications > 0 
                ? (totalOffers.rows[0].total_offers / totalApplications.rows[0].total_applications) * 100 
                : 0;

            return NextResponse.json({
                success: true,
                data: {
                    avg_response_time_hours: parseFloat(avgResponseTime.rows[0]?.avg_response_time_hours || 0),
                    avg_offer_time_hours: parseFloat(avgOfferTime.rows[0]?.avg_offer_time_hours || 0),
                    total_applications: parseInt(totalApplications.rows[0]?.total_applications || 0),
                    total_offers: parseInt(totalOffers.rows[0]?.total_offers || 0),
                    conversion_rate: parseFloat(conversionRate.toFixed(2)),
                    date: date,
                    // Data accuracy note: Now using actual view tracking data for accurate metrics
                    data_accuracy_note: "Response time calculated from application submission to first bank view. Offer time calculated from first view to offer submission."
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Time metrics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch time metrics' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const client = await pool.connectWithRetry();

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
