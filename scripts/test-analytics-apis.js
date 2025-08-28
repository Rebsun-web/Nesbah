const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testAnalyticsAPIs() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Testing Analytics APIs...\n');
        
        // Test applications analytics query
        console.log('📊 Applications Analytics:');
        const applicationStatusStats = await client.query(`
            SELECT 
                current_application_status as status,
                COUNT(DISTINCT application_id) as count,
                COUNT(DISTINCT CASE WHEN application_submitted_at >= NOW() - INTERVAL '30 days' THEN application_id END) as recent_count
            FROM application_offer_tracking
            WHERE current_application_status IN ('live_auction', 'completed', 'ignored')
            GROUP BY current_application_status
            ORDER BY count DESC
        `);
        
        console.log('  Status Distribution:');
        applicationStatusStats.rows.forEach(row => {
            console.log(`    ${row.status}: ${row.count} (${row.recent_count} recent)`);
        });
        
        const totalApplications = applicationStatusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        const totalCompletedApplications = applicationStatusStats.rows.find(row => row.status === 'completed')?.count || 0;
        const overallCompletionRate = totalApplications > 0 ? Math.round((totalCompletedApplications / totalApplications) * 100) : 0;
        
        console.log(`  Total Applications: ${totalApplications}`);
        console.log(`  Completed Applications: ${totalCompletedApplications}`);
        console.log(`  Overall Completion Rate: ${overallCompletionRate}%`);
        
        // Test offers analytics query
        console.log('\n📊 Offers Analytics:');
        const offerStatusStats = await client.query(`
            SELECT 
                status,
                COUNT(*) as count,
                COUNT(CASE WHEN submitted_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_count
            FROM application_offers
            GROUP BY status
            ORDER BY count DESC
        `);
        
        console.log('  Offer Status Distribution:');
        offerStatusStats.rows.forEach(row => {
            console.log(`    ${row.status}: ${row.count} (${row.recent_count} recent)`);
        });
        
        const totalOffers = offerStatusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        const totalSubmittedOffers = offerStatusStats.rows.find(row => row.status === 'submitted')?.count || 0;
        const overallSubmissionRate = totalOffers > 0 ? Math.round((totalSubmittedOffers / totalOffers) * 100) : 0;
        
        console.log(`  Total Offers: ${totalOffers}`);
        console.log(`  Submitted Offers: ${totalSubmittedOffers}`);
        console.log(`  Overall Submission Rate: ${overallSubmissionRate}%`);
        
        // Test time metrics query
        console.log('\n⏱️ Time Metrics:');
        const avgResponseTime = await client.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - sa.submitted_at))/60) as avg_response_time_minutes
            FROM submitted_applications sa
            JOIN application_offers ao ON sa.id = ao.submitted_application_id
        `);
        
        const avgOfferTime = await client.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - aot.application_submitted_at))/60) as avg_offer_time_minutes
            FROM application_offer_tracking aot
            JOIN application_offers ao ON aot.application_id = ao.submitted_application_id
        `);
        
        console.log(`  Average Response Time: ${parseFloat(avgResponseTime.rows[0]?.avg_response_time_minutes || 0).toFixed(2)} minutes`);
        console.log(`  Average Offer Time: ${parseFloat(avgOfferTime.rows[0]?.avg_offer_time_minutes || 0).toFixed(2)} minutes`);
        
        // Test bank performance
        console.log('\n🏦 Bank Performance:');
        const bankPerformance = await client.query(`
            SELECT 
                u.entity_name as bank_name,
                COUNT(*) as total_offers,
                COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END) as submitted_offers,
                ROUND(
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN (COUNT(CASE WHEN ao.status = 'submitted' THEN 1 END)::DECIMAL / COUNT(*)) * 100 
                        ELSE 0 
                    END, 2
                ) as submission_rate
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            WHERE u.user_type = 'bank_user'
            GROUP BY u.entity_name, u.user_id
            ORDER BY total_offers DESC
        `);
        
        if (bankPerformance.rows.length > 0) {
            console.log('  Bank Performance:');
            bankPerformance.rows.forEach(row => {
                console.log(`    ${row.bank_name}: ${row.total_offers} offers, ${row.submitted_offers} submitted (${row.submission_rate}%)`);
            });
        } else {
            console.log('  No bank performance data available');
        }
        
        // Test conversion rate calculation
        console.log('\n📈 Conversion Rate Calculation:');
        const conversionRate = totalApplications > 0 ? (totalOffers / totalApplications) * 100 : 0;
        console.log(`  Offers submitted / Total applications: ${totalOffers} / ${totalApplications} = ${conversionRate.toFixed(2)}%`);
        
    } catch (error) {
        console.error('❌ Error testing analytics APIs:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testAnalyticsAPIs();
