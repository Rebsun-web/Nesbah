import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        
        try {
            // Get user counts by type
            const userTypeStats = await client.query(`
                SELECT 
                    'business' as user_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN bu.registration_status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN bu.registration_status = 'suspended' THEN 1 END) as suspended_count,
                    COUNT(CASE WHEN bu.registration_status = 'inactive' THEN 1 END) as inactive_count
                FROM business_users bu
                
                UNION ALL
                
                SELECT 
                    'individual' as user_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN u.account_status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN u.account_status = 'suspended' THEN 1 END) as suspended_count,
                    COUNT(CASE WHEN u.account_status = 'inactive' THEN 1 END) as inactive_count
                FROM individual_users iu
                JOIN users u ON iu.national_id = u.entity_name
                
                UNION ALL
                
                SELECT 
                    'bank' as user_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN u.account_status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN u.account_status = 'suspended' THEN 1 END) as suspended_count,
                    COUNT(CASE WHEN u.account_status = 'inactive' THEN 1 END) as inactive_count
                FROM bank_users bu
                JOIN users u ON bu.user_id = u.user_id
            `);

            // Get recent user registrations (last 30 days)
            const recentRegistrations = await client.query(`
                SELECT 
                    'business' as user_type,
                    COUNT(*) as count
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                WHERE u.created_at >= NOW() - INTERVAL '30 days'
                
                UNION ALL
                
                SELECT 
                    'individual' as user_type,
                    COUNT(*) as count
                FROM individual_users iu
                JOIN users u ON iu.national_id = u.entity_name
                WHERE u.created_at >= NOW() - INTERVAL '30 days'
                
                UNION ALL
                
                SELECT 
                    'bank' as user_type,
                    COUNT(*) as count
                FROM bank_users bu
                JOIN users u ON bu.user_id = u.user_id
                WHERE u.created_at >= NOW() - INTERVAL '30 days'
            `);

            // Get users with sent applications
            const topUsers = await client.query(`
                SELECT 
                    bu.trade_name as entity_name,
                    u.email,
                    'business' as user_type,
                    CASE WHEN COUNT(pa.application_id) > 0 THEN true ELSE false END as has_sent_application
                FROM business_users bu
                JOIN users u ON bu.user_id = u.user_id
                LEFT JOIN pos_application pa ON bu.user_id = pa.user_id
                GROUP BY bu.user_id, bu.trade_name, u.email
                HAVING COUNT(pa.application_id) > 0
                ORDER BY bu.trade_name
                LIMIT 10
            `);

            // Get registration trends (last 12 months)
            const registrationTrends = await client.query(`
                SELECT 
                    DATE_TRUNC('month', all_users.created_at) as month,
                    COUNT(*) as count
                FROM (
                    SELECT bu.user_id::text as user_id, u.created_at FROM business_users bu JOIN users u ON bu.user_id = u.user_id
                    UNION ALL
                    SELECT iu.national_id::text as user_id, u.created_at FROM individual_users iu JOIN users u ON iu.national_id = u.entity_name
                    UNION ALL
                    SELECT bu.user_id::text as user_id, u.created_at FROM bank_users bu JOIN users u ON bu.user_id = u.user_id
                ) all_users
                WHERE all_users.created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', all_users.created_at)
                ORDER BY month
            `);

            // Calculate totals
            const totalUsers = userTypeStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
            const totalActiveUsers = userTypeStats.rows.reduce((sum, row) => sum + parseInt(row.active_count), 0);
            const totalRecentRegistrations = recentRegistrations.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total_users: totalUsers,
                        total_active_users: totalActiveUsers,
                        total_recent_registrations: totalRecentRegistrations,
                        active_percentage: totalUsers > 0 ? Math.round((totalActiveUsers / totalUsers) * 100) : 0
                    },
                    by_type: userTypeStats.rows,
                    recent_registrations: recentRegistrations.rows,
                    top_users: topUsers.rows,
                    registration_trends: registrationTrends.rows
                }
            });

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('User stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user statistics' },
            { status: 500 }
        );
    }
}
