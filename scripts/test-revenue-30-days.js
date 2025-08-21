const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function testRevenue30Days() {
    console.log('🔍 Testing revenue analytics data for last 30 days...');
    
    const client = await pool.connect();
    
    try {
        console.log('\n📊 Current Revenue Metrics (Last 30 days):');
        
        const currentStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const currentRevenueQuery = `
            SELECT 
                COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application,
                COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                COUNT(CASE WHEN sa.status = 'abandoned' THEN 1 END) as abandoned_applications,
                COUNT(*) as total_applications
            FROM submitted_applications sa
            WHERE sa.submitted_at >= $1
        `;

        const currentRevenue = await client.query(currentRevenueQuery, [currentStartDate]);
        const current = currentRevenue.rows[0];
        
        console.log(`Total Revenue: SAR ${Number(current.total_revenue).toFixed(2)}`);
        console.log(`Revenue Generating Apps: ${current.revenue_generating_applications}`);
        console.log(`Avg Revenue per App: SAR ${Number(current.avg_revenue_per_application).toFixed(2)}`);
        console.log(`Completed Applications: ${current.completed_applications}`);
        console.log(`Abandoned Applications: ${current.abandoned_applications}`);
        console.log(`Total Applications: ${current.total_applications}`);
        
        // Show all application data
        console.log('\n📅 All Applications Data:');
        const allAppsQuery = `
            SELECT 
                id,
                business_user_id,
                status,
                revenue_collected,
                submitted_at,
                DATE(submitted_at) as date
            FROM submitted_applications sa
            WHERE sa.submitted_at >= $1
            ORDER BY submitted_at DESC
        `;
        
        const allApps = await client.query(allAppsQuery, [currentStartDate]);
        
        allApps.rows.forEach(app => {
            console.log(`ID ${app.id}: ${app.status} - SAR ${Number(app.revenue_collected).toFixed(2)} - ${app.date} (User ${app.business_user_id})`);
        });
        
        // Check if there are applications older than 30 days
        console.log('\n📊 Total Applications in Database:');
        const totalAppsQuery = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(revenue_collected), 0) as total_revenue,
                MIN(submitted_at) as earliest_date,
                MAX(submitted_at) as latest_date
            FROM submitted_applications
        `;
        
        const totalApps = await client.query(totalAppsQuery);
        const totals = totalApps.rows[0];
        
        console.log(`Total Apps in DB: ${totals.total_count}`);
        console.log(`Total Revenue in DB: SAR ${Number(totals.total_revenue).toFixed(2)}`);
        console.log(`Date Range: ${totals.earliest_date} to ${totals.latest_date}`);
        
    } catch (error) {
        console.error('❌ Error testing revenue analytics:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the test
if (require.main === module) {
    testRevenue30Days()
        .then(() => {
            console.log('🎉 30-day revenue test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 30-day revenue test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRevenue30Days };
