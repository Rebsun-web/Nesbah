const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkAnalyticsTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking analytics tables and data...\n');
        
        // Check if analytics tables exist
        console.log('📋 Checking if analytics tables exist:');
        const tables = [
            'application_offer_tracking',
            'application_offers', 
            'bank_application_views',
            'bank_offer_submissions',
            'application_conversion_metrics',
            'time_metrics'
        ];
        
        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`  ${table}: ${result.rows[0].count} records`);
            } catch (err) {
                console.log(`  ${table}: ❌ Table does not exist`);
            }
        }
        
        // Check application_offer_tracking data
        console.log('\n📊 Application Offer Tracking Data:');
        try {
            const trackingData = await client.query(`
                SELECT 
                    current_application_status,
                    COUNT(*) as count
                FROM application_offer_tracking
                GROUP BY current_application_status
                ORDER BY count DESC
            `);
            
            trackingData.rows.forEach(row => {
                console.log(`  ${row.current_application_status}: ${row.count}`);
            });
        } catch (err) {
            console.log('  ❌ application_offer_tracking table does not exist');
        }
        
        // Check application_offers data
        console.log('\n📊 Application Offers Data:');
        try {
            const offersData = await client.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM application_offers
                GROUP BY status
                ORDER BY count DESC
            `);
            
            offersData.rows.forEach(row => {
                console.log(`  ${row.status}: ${row.count}`);
            });
        } catch (err) {
            console.log('  ❌ application_offers table does not exist');
        }
        
        // Check submitted_applications with offers
        console.log('\n📊 Submitted Applications with Offers:');
        const appsWithOffers = await client.query(`
            SELECT 
                sa.status,
                sa.offers_count,
                COUNT(*) as count
            FROM submitted_applications sa
            GROUP BY sa.status, sa.offers_count
            ORDER BY sa.status, sa.offers_count
        `);
        
        appsWithOffers.rows.forEach(row => {
            console.log(`  ${row.status} (${row.offers_count} offers): ${row.count} applications`);
        });
        
        // Check bank activity
        console.log('\n📊 Bank Activity:');
        const bankActivity = await client.query(`
            SELECT 
                COUNT(DISTINCT sa.application_id) as applications_with_bank_activity,
                COUNT(DISTINCT CASE WHEN sa.offers_count > 0 THEN sa.application_id END) as applications_with_offers,
                SUM(sa.offers_count) as total_offers_submitted
            FROM submitted_applications sa
        `);
        
        const activity = bankActivity.rows[0];
        console.log(`  Applications with bank activity: ${activity.applications_with_bank_activity}`);
        console.log(`  Applications with offers: ${activity.applications_with_offers}`);
        console.log(`  Total offers submitted: ${activity.total_offers_submitted}`);
        
        // Check revenue data
        console.log('\n💰 Revenue Data:');
        const revenueData = await client.query(`
            SELECT 
                COUNT(DISTINCT sa.application_id) as revenue_generating_apps,
                SUM(sa.revenue_collected) as total_revenue,
                AVG(sa.revenue_collected) as avg_revenue_per_app
            FROM submitted_applications sa
            WHERE sa.revenue_collected > 0
        `);
        
        const revenue = revenueData.rows[0];
        console.log(`  Revenue generating applications: ${revenue.revenue_generating_apps}`);
        console.log(`  Total revenue: SAR ${parseFloat(revenue.total_revenue || 0).toFixed(2)}`);
        console.log(`  Average revenue per app: SAR ${parseFloat(revenue.avg_revenue_per_app || 0).toFixed(2)}`);
        
    } catch (error) {
        console.error('❌ Error checking analytics tables:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAnalyticsTables();
