import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdminAuth from '@/lib/auth/admin-auth';

export async function GET(req) {
    try {
        // Verify admin authentication
        const adminUser = await AdminAuth.verifyAdmin(req);
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get('timeRange') || '30d';

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_analytics_application-success_route.jsx_route');
        
        try {
            // 1. Offer Fulfillment Rate Query - Use same status logic as applications table
            const offerFulfillmentQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN offers_count > 0 THEN 1 END) as applications_with_offers,
                    COUNT(CASE WHEN offers_count = 0 THEN 1 END) as applications_without_offers,
                    COUNT(CASE WHEN COALESCE(current_application_status, status) = 'completed' THEN 1 END) as completed_applications,
                    ROUND((COUNT(CASE WHEN offers_count > 0 THEN 1 END) * 100.0 / COUNT(*)), 2) as fulfillment_rate,
                    ROUND((COUNT(CASE WHEN COALESCE(current_application_status, status) = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as success_rate
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
            `;
            const offerFulfillment = await client.query(offerFulfillmentQuery, [startDate, endDate]);

            // 2. Multi-Offer Rate Query
            const multiOfferRateQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN offers_count > 1 THEN 1 END) as applications_with_multiple_offers,
                    ROUND((COUNT(CASE WHEN offers_count > 1 THEN 1 END) * 100.0 / COUNT(*)), 2) as multi_offer_rate
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
            `;
            const multiOfferRate = await client.query(multiOfferRateQuery, [startDate, endDate]);
            
            // Debug: Log the multi-offer rate data
            console.log('🔍 Multi-Offer Rate Debug:');
            console.log('  - Query result:', multiOfferRate.rows[0]);
            console.log('  - Total applications:', multiOfferRate.rows[0]?.total_applications);
            console.log('  - Applications with multiple offers:', multiOfferRate.rows[0]?.applications_with_multiple_offers);
            console.log('  - Multi-offer rate:', multiOfferRate.rows[0]?.multi_offer_rate);

            // 2b. Detailed Multi-Offer Breakdown Query
            const multiOfferBreakdownQuery = `
                SELECT 
                    offers_count,
                    COUNT(*) as application_count
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                AND offers_count > 1
                GROUP BY offers_count
                ORDER BY offers_count
            `;
            const multiOfferBreakdown = await client.query(multiOfferBreakdownQuery, [startDate, endDate]);
            
            // Debug: Log the breakdown data
            console.log('🔍 Multi-Offer Breakdown Debug:');
            console.log('  - Breakdown result:', multiOfferBreakdown.rows);
            console.log('  - Applications with 2 offers:', multiOfferBreakdown.rows.find(item => item.offers_count === 2)?.application_count || 0);
            console.log('  - Applications with 3+ offers:', multiOfferBreakdown.rows.filter(item => item.offers_count >= 3).reduce((sum, item) => sum + parseInt(item.application_count), 0));

            return NextResponse.json({
                success: true,
                data: {
                    offer_fulfillment: offerFulfillment.rows[0],
                    multi_offer_rate: multiOfferRate.rows[0],
                    multi_offer_breakdown: multiOfferBreakdown.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application success analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
