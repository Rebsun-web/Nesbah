const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testDashboardData() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Testing dashboard data...\n');
        
        // Test status counts
        console.log('📊 Application Status Counts:');
        const statusCounts = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE COALESCE(aot.current_application_status, sa.status) IN ('live_auction', 'completed', 'ignored')
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        statusCounts.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });
        
        // Test revenue analytics
        console.log('\n💰 Revenue Analytics:');
        const revenueAnalytics = await client.query(`
            SELECT 
                COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                COUNT(DISTINCT CASE WHEN sa.revenue_collected > 0 THEN sa.application_id END) as revenue_generating_applications,
                COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application
            FROM submitted_applications sa
        `);
        
        const revenue = revenueAnalytics.rows[0];
        console.log(`  Total Revenue: SAR ${parseFloat(revenue.total_revenue).toFixed(2)}`);
        console.log(`  Revenue Generating Applications: ${revenue.revenue_generating_applications}`);
        console.log(`  Average Revenue per Application: SAR ${parseFloat(revenue.avg_revenue_per_application).toFixed(2)}`);
        
        // Test user stats
        console.log('\n👥 User Statistics:');
        const userStats = await client.query(`
            SELECT 
                'business' as user_type,
                COUNT(*) as count,
                COUNT(CASE WHEN bu.registration_status = 'active' THEN 1 END) as active_count
            FROM business_users bu
            
            UNION ALL
            
            SELECT 
                'bank' as user_type,
                COUNT(*) as count,
                COUNT(CASE WHEN u.account_status = 'active' THEN 1 END) as active_count
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
        `);
        
        let totalUsers = 0;
        let totalActiveUsers = 0;
        
        userStats.rows.forEach(row => {
            console.log(`  ${row.user_type}: ${row.count} total, ${row.active_count} active`);
            totalUsers += parseInt(row.count);
            totalActiveUsers += parseInt(row.active_count);
        });
        
        console.log(`  Total Users: ${totalUsers}`);
        console.log(`  Total Active Users: ${totalActiveUsers}`);
        console.log(`  Active Rate: ${totalUsers > 0 ? Math.round((totalActiveUsers / totalUsers) * 100) : 0}%`);
        
        // Test recent registrations (last 30 days)
        console.log('\n📅 Recent Registrations (Last 30 Days):');
        const recentRegistrations = await client.query(`
            SELECT 
                'business' as user_type,
                COUNT(*) as count
            FROM business_users bu
            JOIN users u ON bu.user_id = u.user_id
            WHERE u.created_at >= NOW() - INTERVAL '30 days'
            
            UNION ALL
            
            SELECT 
                'bank' as user_type,
                COUNT(*) as count
            FROM bank_users bu
            JOIN users u ON bu.user_id = u.user_id
            WHERE u.created_at >= NOW() - INTERVAL '30 days'
        `);
        
        let totalRecent = 0;
        recentRegistrations.rows.forEach(row => {
            console.log(`  ${row.user_type}: ${row.count}`);
            totalRecent += parseInt(row.count);
        });
        console.log(`  Total Recent: ${totalRecent}`);
        
        // Check user creation dates
        console.log('\n📅 User Creation Date Analysis:');
        const creationDates = await client.query(`
            SELECT 
                DATE_TRUNC('month', u.created_at) as month,
                COUNT(*) as count
            FROM (
                SELECT bu.user_id, u.created_at FROM business_users bu JOIN users u ON bu.user_id = u.user_id
                UNION ALL
                SELECT bu.user_id, u.created_at FROM bank_users bu JOIN users u ON bu.user_id = u.user_id
            ) u
            GROUP BY DATE_TRUNC('month', u.created_at)
            ORDER BY month
        `);
        
        creationDates.rows.forEach(row => {
            console.log(`  ${row.month}: ${row.count} users`);
        });
        
    } catch (error) {
        console.error('❌ Error testing dashboard data:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testDashboardData();
