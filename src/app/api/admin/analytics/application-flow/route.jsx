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
        const showAll = searchParams.get('showAll') === 'true'; // Temporary debug option

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
        
        // Set time to start/end of day to avoid time zone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        console.log('🔍 Date range debug:');
        console.log('  - startDate:', startDate.toISOString());
        console.log('  - endDate:', endDate.toISOString());
        console.log('  - timeRange:', timeRange);

        const client = await pool.connectWithRetry(2, 1000, 'app_api_admin_analytics_application-flow_route.jsx_route');
        
        try {
            // Debug: Check total applications without date filter first
            const totalWithoutDateFilter = await client.query(`
                SELECT COUNT(*) as total
                FROM pos_application
            `);
            console.log('  - Total applications in database (no date filter):', totalWithoutDateFilter.rows[0].total);
            
            // Debug: Check applications in the date range
            const totalInDateRange = await client.query(`
                SELECT COUNT(*) as total
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
            `, [startDate, endDate]);
            console.log('  - Total applications in date range:', totalInDateRange.rows[0].total);
            
            // Debug: Check a few sample applications to see their dates
            const sampleApps = await client.query(`
                SELECT application_id, submitted_at, status
                FROM pos_application 
                ORDER BY submitted_at DESC
                LIMIT 5
            `);
            console.log('  - Sample applications:', sampleApps.rows);
            
            // 1. Status Progression Analytics Query - Use same status logic as applications table
            const statusProgressionQuery = showAll ? `
                SELECT 
                    COALESCE(current_application_status, status) as status,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
                FROM pos_application 
                GROUP BY COALESCE(current_application_status, status)
                ORDER BY count DESC
            ` : `
                SELECT 
                    COALESCE(current_application_status, status) as status,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                GROUP BY COALESCE(current_application_status, status)
                ORDER BY count DESC
            `;
            const statusProgression = await client.query(statusProgressionQuery, showAll ? [] : [startDate, endDate]);
            
            // Debug: Log what statuses were found
            console.log('🔍 Status progression raw data:', statusProgression.rows);

            // Process status progression data for frontend
            const statusData = {
                live_auction: 0,
                live_auction_percentage: 0,
                completed: 0,
                completed_percentage: 0,
                ignored: 0,
                ignored_percentage: 0,
                expired: 0,
                expired_percentage: 0,
                total: 0
            };

            // Calculate total applications in the date range
            const totalQuery = await client.query(showAll ? `
                SELECT COUNT(*) as total
                FROM pos_application
            ` : `
                SELECT COUNT(*) as total
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
            `, showAll ? [] : [startDate, endDate]);
            
            const totalApplications = parseInt(totalQuery.rows[0].total);
            statusData.total = totalApplications;

            // Process each status and calculate percentages
            statusProgression.rows.forEach(row => {
                const status = row.status;
                const count = parseInt(row.count);
                const percentage = parseFloat(row.percentage) || 0;
                
                switch (status) {
                    case 'live_auction':
                        statusData.live_auction = count;
                        statusData.live_auction_percentage = percentage;
                        break;
                    case 'completed':
                        statusData.completed = count;
                        statusData.completed_percentage = percentage;
                        break;
                    case 'ignored':
                        statusData.ignored = count;
                        statusData.ignored_percentage = percentage;
                        break;
                    case 'expired':
                        statusData.expired = count;
                        statusData.expired_percentage = percentage;
                        break;
                }
            });

            // 2. 48-Hour Auction Performance Query - Use same status logic
            const auctionPerformanceQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN offers_count > 0 THEN 1 END) as applications_with_offers,
                    ROUND((COUNT(CASE WHEN offers_count > 0 THEN 1 END) * 100.0 / COUNT(*)), 2) as offer_rate
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                AND COALESCE(current_application_status, status) IN ('live_auction', 'completed')
            `;
            const auctionPerformance = await client.query(auctionPerformanceQuery, [startDate, endDate]);

            // 3. Auction Abandonment Rate Query - Use same status logic
            const abandonmentRateQuery = `
                SELECT 
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN COALESCE(current_application_status, status) = 'expired' AND offers_count = 0 THEN 1 END) as abandoned_applications,
                    ROUND((COUNT(CASE WHEN COALESCE(current_application_status, status) = 'expired' AND offers_count = 0 THEN 1 END) * 100.0 / COUNT(*)), 2) as abandonment_rate
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                AND COALESCE(current_application_status, status) IN ('expired', 'completed', 'ignored')
            `;
            const abandonmentRate = await client.query(abandonmentRateQuery, [startDate, endDate]);

            // 4. Status Duration Analysis Query - Use same status logic
            const statusDurationQuery = `
                SELECT 
                    COALESCE(current_application_status, status) as status,
                    COUNT(*) as count,
                    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - submitted_at)) / 3600), 2) as avg_hours_in_status
                FROM pos_application 
                WHERE submitted_at >= $1 AND submitted_at <= $2
                GROUP BY COALESCE(current_application_status, status)
                ORDER BY count DESC
            `;
            const statusDuration = await client.query(statusDurationQuery, [startDate, endDate]);

            return NextResponse.json({
                success: true,
                data: {
                    status_progression: statusData,
                    auction_performance: auctionPerformance.rows[0],
                    abandonment_rate: abandonmentRate.rows[0],
                    status_duration: statusDuration.rows,
                    total_applications: totalApplications
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application flow analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
