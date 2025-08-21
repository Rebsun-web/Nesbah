const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function testRevenueAnalytics() {
    console.log('🔍 Testing revenue analytics data consistency...');
    
    const client = await pool.connect();
    
    try {
        // Test the exact queries used by the API endpoint
        console.log('\n📊 Current Revenue Metrics (Last 7 days):');
        
        const currentStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const currentRevenueQuery = `
            SELECT 
                COALESCE(SUM(sa.revenue_collected), 0) as total_revenue,
                COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_generating_applications,
                COALESCE(AVG(CASE WHEN sa.revenue_collected > 0 THEN sa.revenue_collected END), 0) as avg_revenue_per_application,
                COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                COUNT(CASE WHEN sa.status = 'abandoned' THEN 1 END) as abandoned_applications,
                COUNT(CASE WHEN sa.status = 'deal_expired' THEN 1 END) as expired_applications,
                COUNT(CASE WHEN sa.status = 'pending_offers' THEN 1 END) as active_auctions,
                COUNT(CASE WHEN sa.status = 'offer_received' THEN 1 END) as active_selections,
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
        
        // Test daily trend data
        console.log('\n📈 Daily Revenue Trend (Last 7 days):');
        const dailyTrendQuery = `
            SELECT 
                DATE(sa.submitted_at) as date,
                COALESCE(SUM(sa.revenue_collected), 0) as revenue,
                COUNT(*) as applications,
                COUNT(CASE WHEN sa.revenue_collected > 0 THEN 1 END) as revenue_apps
            FROM submitted_applications sa
            WHERE sa.submitted_at >= $1
            GROUP BY DATE(sa.submitted_at)
            ORDER BY date ASC
        `;

        const dailyTrend = await client.query(dailyTrendQuery, [currentStartDate]);
        
        dailyTrend.rows.forEach(day => {
            console.log(`${day.date}: SAR ${Number(day.revenue).toFixed(2)} from ${day.applications} apps (${day.revenue_apps} revenue-generating)`);
        });
        
        // Test bank performance data
        console.log('\n🏦 Bank Performance (Last 7 days):');
        const bankPerformanceQuery = `
            SELECT 
                'Bank ' || ar.bank_user_id as bank_name,
                COALESCE(SUM(ar.amount), 0) as revenue,
                COUNT(DISTINCT sa.id) as applications,
                COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_applications,
                CASE 
                    WHEN COUNT(DISTINCT sa.id) > 0 THEN 
                        ROUND((COUNT(CASE WHEN sa.status = 'completed' THEN 1 END)::DECIMAL / COUNT(DISTINCT sa.id)) * 100, 1)
                    ELSE 0 
                END as success_rate
            FROM application_revenue ar
            JOIN submitted_applications sa ON ar.application_id = sa.id
            WHERE sa.submitted_at >= $1
            GROUP BY ar.bank_user_id
            ORDER BY revenue DESC
            LIMIT 10
        `;

        const bankPerformance = await client.query(bankPerformanceQuery, [currentStartDate]);
        
        if (bankPerformance.rows.length > 0) {
            bankPerformance.rows.forEach(bank => {
                console.log(`${bank.bank_name}: SAR ${Number(bank.revenue).toFixed(2)} from ${bank.applications} apps (${bank.success_rate}% success rate)`);
            });
        } else {
            console.log('No bank performance data found');
        }
        
        // Test raw data verification
        console.log('\n🔍 Raw Data Verification:');
        
        const rawDataQuery = `
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(revenue_collected), 0) as total_revenue
            FROM submitted_applications sa
            WHERE sa.submitted_at >= $1
            GROUP BY status
            ORDER BY count DESC
        `;
        
        const rawData = await client.query(rawDataQuery, [currentStartDate]);
        
        rawData.rows.forEach(row => {
            console.log(`Status "${row.status}": ${row.count} applications, SAR ${Number(row.total_revenue).toFixed(2)} revenue`);
        });
        
        // Check application_revenue table
        console.log('\n💰 Application Revenue Records:');
        const revenueRecordsQuery = `
            SELECT 
                ar.bank_user_id,
                COUNT(*) as revenue_records,
                COALESCE(SUM(ar.amount), 0) as total_amount,
                ar.transaction_type
            FROM application_revenue ar
            JOIN submitted_applications sa ON ar.application_id = sa.id
            WHERE sa.submitted_at >= $1
            GROUP BY ar.bank_user_id, ar.transaction_type
            ORDER BY total_amount DESC
        `;
        
        const revenueRecords = await client.query(revenueRecordsQuery, [currentStartDate]);
        
        if (revenueRecords.rows.length > 0) {
            revenueRecords.rows.forEach(record => {
                console.log(`Bank ${record.bank_user_id}: ${record.revenue_records} ${record.transaction_type} records, SAR ${Number(record.total_amount).toFixed(2)}`);
            });
        } else {
            console.log('No revenue records found');
        }
        
        // Calculate rates
        const conversionRate = current.total_applications > 0 ? 
            (current.completed_applications / current.total_applications) * 100 : 0;
        
        const abandonmentRate = current.total_applications > 0 ? 
            (current.abandoned_applications / current.total_applications) * 100 : 0;
        
        console.log('\n📈 Key Performance Indicators:');
        console.log(`Conversion Rate: ${conversionRate.toFixed(1)}%`);
        console.log(`Abandonment Rate: ${abandonmentRate.toFixed(1)}%`);
        
        console.log('\n✅ Revenue analytics data verification completed!');
        
    } catch (error) {
        console.error('❌ Error testing revenue analytics:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the test
if (require.main === module) {
    testRevenueAnalytics()
        .then(() => {
            console.log('🎉 Revenue analytics test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Revenue analytics test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRevenueAnalytics };
