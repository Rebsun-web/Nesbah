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
        const start_date = searchParams.get('start_date');
        const end_date = searchParams.get('end_date');
        const status = searchParams.get('status');

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_revenue_collection-status_route.jsx_route');
        
        try {
            // Real-time revenue dashboard
            let revenueQuery = `
                SELECT 
                    SUM(sa.revenue_collected) as total_revenue,
                    COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                    AVG(sa.revenue_collected) as avg_revenue_per_application,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                    COUNT(CASE WHEN sa.status = 'ignored' THEN 1 END) as ignored_applications,
                    COUNT(CASE WHEN sa.status = 'live_auction' THEN 1 END) as active_auctions
                FROM submitted_applications sa
                WHERE 1=1
            `;

            const revenueParams = [];
            let paramCount = 0;

            if (start_date) {
                paramCount++;
                revenueQuery += ` AND sa.created_at >= $${paramCount}`;
                revenueParams.push(start_date);
            }

            if (end_date) {
                paramCount++;
                revenueQuery += ` AND sa.created_at <= $${paramCount}`;
                revenueParams.push(end_date);
            }

            const revenueResult = await client.query(revenueQuery, revenueParams);

            // Revenue collection verification
            let collectionQuery = `
                SELECT 
                    ar.id,
                    ar.application_id,
                    ar.bank_user_id,
                    ar.amount,
                    ar.transaction_type,
                    ar.created_at,
                    sa.status as application_status,
                    pa.trade_name,
                    bu.entity_name as bank_name,
                    CASE 
                        WHEN ar.amount = 25 THEN 'correct'
                        ELSE 'incorrect'
                    END as amount_verification
                FROM application_revenue ar
                JOIN submitted_applications sa ON ar.application_id = sa.application_id
                JOIN pos_application pa ON ar.application_id = pa.application_id
                LEFT JOIN bank_users bu ON ar.bank_user_id = bu.user_id
                WHERE 1=1
            `;

            const collectionParams = [];
            paramCount = 0;

            if (start_date) {
                paramCount++;
                collectionQuery += ` AND ar.created_at >= $${paramCount}`;
                collectionParams.push(start_date);
            }

            if (end_date) {
                paramCount++;
                collectionQuery += ` AND ar.created_at <= $${paramCount}`;
                collectionParams.push(end_date);
            }

            if (status) {
                paramCount++;
                collectionQuery += ` AND sa.status = $${paramCount}`;
                collectionParams.push(status);
            }

            collectionQuery += ` ORDER BY ar.created_at DESC LIMIT 100`;

            const collectionResult = await client.query(collectionQuery, collectionParams);

            // Bank purchase analytics
            const bankAnalyticsQuery = `
                SELECT 
                    bu.entity_name as bank_name,
                    COUNT(DISTINCT sa.application_id) as total_purchases,
                    SUM(sa.revenue_collected) as total_revenue,
                    AVG(sa.revenue_collected) as avg_revenue_per_purchase,
                    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as successful_deals,
                    COUNT(CASE WHEN sa.status = 'ignored' THEN 1 END) as ignored_deals
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                LEFT JOIN bank_users bu ON ANY(sa.purchased_by) = bu.user_id
                WHERE sa.revenue_collected > 0
                GROUP BY bu.entity_name
                ORDER BY total_revenue DESC
            `;

            const bankAnalyticsResult = await client.query(bankAnalyticsQuery);

            // Revenue optimization recommendations
            const optimizationQuery = `
                SELECT 
                    'ignored_applications' as metric,
                    COUNT(*) as count,
                    'Applications with no bank engagement - consider marketing improvements' as recommendation
                FROM submitted_applications 
                WHERE status = 'ignored'
                
                UNION ALL
                
                SELECT 
                    'low_engagement_applications' as metric,
                    COUNT(*) as count,
                    'Applications with minimal bank engagement - review application quality' as recommendation
                FROM submitted_applications 
                WHERE status = 'live_auction' 
                AND array_length(opened_by, 1) < 3
                AND auction_end_time > NOW()
            `;

            const optimizationResult = await client.query(optimizationQuery);

            // Payment failure investigation
            const paymentFailureQuery = `
                SELECT 
                    sa.application_id,
                    sa.status,
                    sa.revenue_collected,
                    pa.trade_name,
                    array_length(sa.purchased_by, 1) as purchase_count,
                    array_length(sa.offers_count, 1) as offers_count,
                    CASE 
                        WHEN array_length(sa.purchased_by, 1) > 0 AND sa.revenue_collected = 0 THEN 'payment_failure'
                        WHEN array_length(sa.purchased_by, 1) = 0 AND sa.status = 'ignored' THEN 'no_engagement'
                        ELSE 'normal'
                    END as issue_type
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE 
                                (array_length(sa.purchased_by, 1) > 0 AND sa.revenue_collected = 0)
            OR (array_length(sa.purchased_by, 1) = 0 AND sa.status = 'ignored')
                ORDER BY sa.created_at DESC
                LIMIT 50
            `;

            const paymentFailureResult = await client.query(paymentFailureQuery);

            return NextResponse.json({
                success: true,
                data: {
                    revenueAnalytics: revenueResult.rows[0],
                    revenueCollections: collectionResult.rows,
                    bankAnalytics: bankAnalyticsResult.rows,
                    optimizationRecommendations: optimizationResult.rows,
                    paymentFailures: paymentFailureResult.rows,
                    timestamp: new Date().toISOString()
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Admin revenue collection status error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch revenue collection status' },
            { status: 500 }
        );
    }
}
