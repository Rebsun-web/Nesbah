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

        // Verify admin token
        const decoded = AdminAuth.verifyToken(adminToken);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid admin token' }, { status: 401 });
        }

        // Get admin user from database
        const adminUser = await AdminAuth.getAdminById(decoded.admin_id);
        if (!adminUser || !adminUser.is_active) {
            return NextResponse.json({ success: false, error: 'Admin user not found or inactive' }, { status: 401 });
        }

        const client = await pool.connect();
        
        try {
            // Get application counts by status
            const applicationStatusStats = await client.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
                FROM submitted_applications
                GROUP BY status
                ORDER BY count DESC
            `);

            // Get applications by city
            const cityStats = await client.query(`
                SELECT 
                    pa.city,
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN sa.status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN sa.status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as pending_applications,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN sa.status = 'approved' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                            ELSE 0 
                        END, 2
                    ) as approval_rate
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                GROUP BY pa.city
                ORDER BY total_applications DESC
                LIMIT 10
            `);

            // Get applications by business type/sector
            const sectorStats = await client.query(`
                SELECT 
                    COALESCE(bu.sector, 'Unknown') as sector,
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN sa.status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN sa.status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as pending_applications
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                GROUP BY bu.sector
                ORDER BY total_applications DESC
                LIMIT 10
            `);

            // Get application submission trends (last 12 months)
            const applicationTrends = await client.query(`
                SELECT 
                    DATE_TRUNC('month', submitted_at) as month,
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending_applications
                FROM submitted_applications
                WHERE submitted_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', submitted_at)
                ORDER BY month
            `);

            // Get average processing time
            const processingTimeStats = await client.query(`
                SELECT 
                    ROUND(AVG(
                        EXTRACT(EPOCH FROM (updated_at - submitted_at)) / 86400
                    ), 2) as avg_processing_days,
                    ROUND(MIN(
                        EXTRACT(EPOCH FROM (updated_at - submitted_at)) / 86400
                    ), 2) as min_processing_days,
                    ROUND(MAX(
                        EXTRACT(EPOCH FROM (updated_at - submitted_at)) / 86400
                    ), 2) as max_processing_days
                FROM submitted_applications
                WHERE status IN ('approved', 'rejected') 
                AND updated_at IS NOT NULL
            `);

            // Get recent application activity (last 7 days)
            const recentActivity = await client.query(`
                SELECT 
                    sa.id as application_id,
                    sa.status,
                    sa.submitted_at,
                    pa.trade_name as business_name,
                    pa.city,
                    bu.sector,
                    sa.offers_count,
                    sa.revenue_collected
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                JOIN business_users bu ON sa.business_user_id = bu.user_id
                WHERE sa.submitted_at >= NOW() - INTERVAL '7 days'
                ORDER BY sa.submitted_at DESC
                LIMIT 20
            `);

            // Get top performing applications (by revenue)
            const topRevenueApplications = await client.query(`
                SELECT 
                    sa.id as application_id,
                    pa.trade_name as business_name,
                    pa.city,
                    sa.revenue_collected,
                    sa.offers_count,
                    sa.status,
                    sa.submitted_at
                FROM submitted_applications sa
                JOIN pos_application pa ON sa.application_id = pa.application_id
                WHERE sa.revenue_collected > 0
                ORDER BY sa.revenue_collected DESC
                LIMIT 10
            `);

            // Get applications by assigned user
            const assignedUserStats = await client.query(`
                SELECT 
                    COALESCE(assigned_bu.trade_name, 'Unassigned') as assigned_user,
                    COUNT(*) as total_applications,
                    COUNT(CASE WHEN sa.status = 'approved' THEN 1 END) as approved_applications,
                    COUNT(CASE WHEN sa.status = 'rejected' THEN 1 END) as rejected_applications,
                    COUNT(CASE WHEN sa.status = 'submitted' THEN 1 END) as pending_applications,
                    ROUND(
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN sa.status = 'approved' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                            ELSE 0 
                        END, 2
                    ) as approval_rate
                FROM submitted_applications sa
                LEFT JOIN business_users assigned_bu ON sa.assigned_user_id = assigned_bu.user_id
                GROUP BY assigned_bu.trade_name
                ORDER BY total_applications DESC
                LIMIT 10
            `);

            // Calculate summary statistics
            const totalApplications = applicationStatusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalApprovedApplications = applicationStatusStats.rows.find(row => row.status === 'approved')?.count || 0;
            const totalRejectedApplications = applicationStatusStats.rows.find(row => row.status === 'rejected')?.count || 0;
            const totalPendingApplications = applicationStatusStats.rows.find(row => row.status === 'submitted')?.count || 0;
            const overallApprovalRate = totalApplications > 0 ? Math.round((totalApprovedApplications / totalApplications) * 100) : 0;

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_applications: totalApplications,
                        total_approved_applications: totalApprovedApplications,
                        total_rejected_applications: totalRejectedApplications,
                        total_pending_applications: totalPendingApplications,
                        overall_approval_rate: overallApprovalRate,
                        recent_applications: applicationStatusStats.rows.reduce((sum, row) => sum + parseInt(row.recent_count), 0)
                    },
                    by_status: applicationStatusStats.rows,
                    by_city: cityStats.rows,
                    by_sector: sectorStats.rows,
                    trends: applicationTrends.rows,
                    processing_time: processingTimeStats.rows[0] || {},
                    recent_activity: recentActivity.rows,
                    top_revenue: topRevenueApplications.rows,
                    by_assigned_user: assignedUserStats.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Application analytics error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch application analytics' },
            { status: 500 }
        );
    }
}
