const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testApplicationsAnalytics() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Testing Applications Analytics API...\n');
        
        // Test the bank performance query
        console.log('🏦 Bank Performance Query:');
        const bankPerformanceStats = await client.query(`
            SELECT 
                u.entity_name as bank_name,
                u.email as bank_email,
                COUNT(DISTINCT ao.submitted_application_id) as total_applications,
                COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN ao.submitted_application_id END) as applications_with_offers,
                ROUND(
                    CASE 
                        WHEN COUNT(DISTINCT ao.submitted_application_id) > 0 
                        THEN (COUNT(DISTINCT CASE WHEN ao.status = 'submitted' THEN ao.submitted_application_id END)::DECIMAL / COUNT(DISTINCT ao.submitted_application_id)) * 100 
                        ELSE 0 
                    END, 2
                ) as conversion_rate,
                AVG(EXTRACT(EPOCH FROM (ao.submitted_at - sa.submitted_at))/60) as avg_response_time_minutes,
                0 as avg_offer_submission_time_minutes
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
                                JOIN submitted_applications sa ON ao.submitted_application_id = sa.id
            WHERE u.user_type = 'bank_user'
            GROUP BY u.entity_name, u.email, u.user_id
            ORDER BY conversion_rate DESC
            LIMIT 10
        `);
        
        if (bankPerformanceStats.rows.length > 0) {
            console.log('  Bank Performance Data:');
            bankPerformanceStats.rows.forEach(row => {
                console.log(`    ${row.bank_name}:`);
                console.log(`      Total Applications: ${row.total_applications}`);
                console.log(`      Applications with Offers: ${row.applications_with_offers}`);
                console.log(`      Conversion Rate: ${row.conversion_rate}%`);
                console.log(`      Avg Response Time: ${parseFloat(row.avg_response_time_minutes || 0).toFixed(2)} minutes`);
                console.log(`      Avg Offer Time: ${parseFloat(row.avg_offer_submission_time_minutes || 0).toFixed(2)} minutes`);
                console.log('');
            });
        } else {
            console.log('  No bank performance data available');
        }
        
        // Test the status distribution query
        console.log('📊 Status Distribution Query:');
        const applicationStatusStats = await client.query(`
            SELECT 
                current_application_status as status,
                COUNT(DISTINCT application_id) as count,
                COUNT(DISTINCT application_id) as recent_count
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
        
    } catch (error) {
        console.error('❌ Error testing applications analytics:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

testApplicationsAnalytics();
