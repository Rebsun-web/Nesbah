import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

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

        // Get admin user from session (no database query needed)
        const adminUser = sessionValidation.adminUser;

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const client = await pool.connectWithRetry();
        
        try {
            // Calculate average response time (time from application submission to first offer)
            const avgResponseTimeQuery = `
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (ao.submitted_at - sa.submitted_at))/60) as avg_response_time_minutes
                FROM submitted_applications sa
                JOIN application_offers ao ON sa.id = ao.submitted_application_id
            `;

            const avgResponseTime = await client.query(avgResponseTimeQuery);

            // Calculate average offer time (time from application view to offer submission)
            const avgOfferTimeQuery = `
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (ao.submitted_at - aot.application_submitted_at))/60) as avg_offer_time_minutes
                FROM application_offer_tracking aot
                JOIN application_offers ao ON aot.application_id = ao.submitted_application_id
            `;

            const avgOfferTime = await client.query(avgOfferTimeQuery);

            // Get total applications
            const totalApplicationsQuery = `
                SELECT COUNT(DISTINCT sa.application_id) as total_applications
                FROM submitted_applications sa
            `;

            const totalApplications = await client.query(totalApplicationsQuery);

            // Get total offers
            const totalOffersQuery = `
                SELECT COUNT(*) as total_offers
                FROM application_offers ao
            `;

            const totalOffers = await client.query(totalOffersQuery);

            // Calculate conversion rate
            const conversionRate = totalApplications.rows[0].total_applications > 0 
                ? (totalOffers.rows[0].total_offers / totalApplications.rows[0].total_applications) * 100 
                : 0;

            return NextResponse.json({
                success: true,
                data: {
                    avg_response_time_minutes: parseFloat(avgResponseTime.rows[0]?.avg_response_time_minutes || 0),
                    avg_offer_time_minutes: parseFloat(avgOfferTime.rows[0]?.avg_offer_time_minutes || 0),
                    total_applications: parseInt(totalApplications.rows[0]?.total_applications || 0),
                    total_offers: parseInt(totalOffers.rows[0]?.total_offers || 0),
                    conversion_rate: parseFloat(conversionRate.toFixed(2)),
                    date: date
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
