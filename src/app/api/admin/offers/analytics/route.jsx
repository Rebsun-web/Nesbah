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
            console.log('🔧 Offers analytics: JWT verification failed:', jwtResult);
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

        const client = await pool.connectWithRetry();
        
        try {
            // OPTIMIZED: Single comprehensive query for all offer analytics
            const comprehensiveOfferQuery = `
                WITH offer_status_stats AS (
                    SELECT 
                        status,
                        COUNT(*) as count,
                        COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
                    FROM application_offers
                    WHERE status IN ('submitted', 'accepted', 'rejected', 'expired')
                    GROUP BY status
                ),
                daily_trend AS (
                    SELECT 
                        DATE_TRUNC('day', submitted_at) as date,
                        COUNT(*) as total_offers,
                        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_offers,
                        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_offers,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_offers,
                        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_offers
                    FROM application_offers
                    WHERE submitted_at >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE_TRUNC('day', submitted_at)
                    ORDER BY date
                ),
                bank_performance AS (
                    SELECT 
                        u.entity_name as bank_name,
                        COUNT(*) as total_offers,
                        COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END) as submitted_offers,
                        COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END) as accepted_offers,
                        COUNT(CASE WHEN ao.status = 'rejected' THEN 1 END) as rejected_offers,
                        ROUND(
                            CASE 
                                WHEN COUNT(*) > 0 
                                THEN (COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                                ELSE 0 
                            END::NUMERIC, 2
                        ) as acceptance_rate,
                        AVG(ao.deal_value) as avg_deal_value,
                        SUM(ao.deal_value) as total_deal_value
                    FROM application_offers ao
                    JOIN users u ON ao.bank_user_id = u.user_id
                    WHERE u.user_type = 'bank_user'
                    GROUP BY u.entity_name, u.user_id
                    ORDER BY total_offers DESC
                    LIMIT 10
                ),
                application_performance AS (
                    SELECT 
                        pa.trade_name as business_name,
                        pa.city,
                        COUNT(*) as total_offers,
                        COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END) as submitted_offers,
                        COUNT(CASE WHEN ao.status = 'accepted' THEN 1 END) as accepted_offers,
                        AVG(ao.deal_value) as avg_deal_value,
                        MAX(ao.deal_value) as max_deal_value,
                        MIN(ao.deal_value) as min_deal_value
                    FROM application_offers ao
                    JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                    GROUP BY pa.trade_name, pa.city
                    ORDER BY total_offers DESC
                    LIMIT 10
                ),
                response_time_metrics AS (
                    SELECT 
                        ROUND(AVG(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/3600), 2) as avg_response_time_hours,
                        ROUND(MIN(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/3600), 2) as min_response_time_hours,
                        ROUND(MAX(EXTRACT(EPOCH FROM (ao.submitted_at - pa.submitted_at))/3600), 2) as max_response_time_hours,
                        COUNT(*) as total_offers_with_timing
                    FROM application_offers ao
                    JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
                    WHERE ao.submitted_at IS NOT NULL AND pa.submitted_at IS NOT NULL
                ),
                deal_value_analysis AS (
                    SELECT 
                        ROUND(AVG(deal_value), 2) as avg_deal_value,
                        ROUND(MIN(deal_value), 2) as min_deal_value,
                        ROUND(MAX(deal_value), 2) as max_deal_value,
                        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY deal_value)::NUMERIC, 2) as median_deal_value,
                        COUNT(*) as total_offers
                    FROM application_offers
                    WHERE deal_value IS NOT NULL
                )
                SELECT 
                    'offer_status_stats' as data_type,
                    json_agg(offer_status_stats.*) as data
                FROM offer_status_stats
                
                UNION ALL
                
                SELECT 
                    'daily_trend' as data_type,
                    json_agg(daily_trend.*) as data
                FROM daily_trend
                
                UNION ALL
                
                SELECT 
                    'bank_performance' as data_type,
                    json_agg(bank_performance.*) as data
                FROM bank_performance
                
                UNION ALL
                
                SELECT 
                    'application_performance' as data_type,
                    json_agg(application_performance.*) as data
                FROM application_performance
                
                UNION ALL
                
                SELECT 
                    'response_time_metrics' as data_type,
                    json_agg(response_time_metrics.*) as data
                FROM response_time_metrics
                
                UNION ALL
                
                SELECT 
                    'deal_value_analysis' as data_type,
                    json_agg(deal_value_analysis.*) as data
                FROM deal_value_analysis
            `;

            const result = await client.query(comprehensiveOfferQuery);
            
            // Parse the results
            const data = {};
            result.rows.forEach(row => {
                data[row.data_type] = row.data;
            });

            // Calculate summary statistics
            const offerStatusStats = data.offer_status_stats || [];
            const totalOffers = offerStatusStats.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalSubmittedOffers = offerStatusStats.find(row => row.status === 'submitted')?.count || 0;
            const totalAcceptedOffers = offerStatusStats.find(row => row.status === 'accepted')?.count || 0;
            const totalRejectedOffers = offerStatusStats.find(row => row.status === 'rejected')?.count || 0;
            const totalExpiredOffers = offerStatusStats.find(row => row.status === 'expired')?.count || 0;
            
            const acceptanceRate = totalOffers > 0 ? Math.round((totalAcceptedOffers / totalOffers) * 100) : 0;
            const submissionRate = totalOffers > 0 ? Math.round((totalSubmittedOffers / totalOffers) * 100) : 0;

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_offers: totalOffers,
                        total_submitted_offers: totalSubmittedOffers,
                        total_accepted_offers: totalAcceptedOffers,
                        total_rejected_offers: totalRejectedOffers,
                        total_expired_offers: totalExpiredOffers,
                        acceptance_rate: acceptanceRate,
                        submission_rate: submissionRate,
                        recent_offers: offerStatusStats.reduce((sum, row) => sum + parseInt(row.recent_count), 0)
                    },
                    by_status: data.offer_status_stats || [],
                    daily_trend: data.daily_trend || [],
                    bank_performance: data.bank_performance || [],
                    application_performance: data.application_performance || [],
                    response_time_metrics: data.response_time_metrics?.[0] || {},
                    deal_value_analysis: data.deal_value_analysis?.[0] || {}
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Offer analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch offer analytics data' },
            { status: 500 }
        );
    }
}
