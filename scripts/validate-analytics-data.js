require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function validateAnalyticsData() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Validating analytics data...\n');
        
        // 1. Check application_offers table
        console.log('📊 Application Offers Data:');
        const offersResult = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.bank_user_id,
                ao.submitted_at,
                u.entity_name as bank_name,
                u.user_type
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            ORDER BY ao.submitted_at
        `);
        
        console.log(`Total offers in application_offers: ${offersResult.rows.length}`);
        offersResult.rows.forEach(offer => {
            console.log(`  - Offer ${offer.offer_id}: ${offer.bank_name} (${offer.user_type}) submitted at ${offer.submitted_at}`);
        });
        
        // 2. Check bank_offer_submissions table
        console.log('\n📊 Bank Offer Submissions Data:');
        const submissionsResult = await client.query(`
            SELECT 
                bos.id,
                bos.application_id,
                bos.bank_user_id,
                bos.bank_name,
                bos.offer_id,
                bos.submitted_at
            FROM bank_offer_submissions bos
            ORDER BY bos.submitted_at
        `);
        
        console.log(`Total records in bank_offer_submissions: ${submissionsResult.rows.length}`);
        submissionsResult.rows.forEach(submission => {
            console.log(`  - Submission ${submission.id}: ${submission.bank_name} for app ${submission.application_id}, offer ${submission.offer_id}`);
        });
        
        // 3. Check bank_application_views table
        console.log('\n📊 Bank Application Views Data:');
        const viewsResult = await client.query(`
            SELECT 
                bav.id,
                bav.application_id,
                bav.bank_user_id,
                bav.bank_name,
                bav.viewed_at
            FROM bank_application_views bav
            ORDER BY bav.viewed_at
        `);
        
        console.log(`Total records in bank_application_views: ${viewsResult.rows.length}`);
        viewsResult.rows.forEach(view => {
            console.log(`  - View ${view.id}: ${view.bank_name} viewed app ${view.application_id} at ${view.viewed_at}`);
        });
        
        // 4. Check pos_application table
        console.log('\n📊 POS Application Data:');
        const appsResult = await client.query(`
            SELECT 
                pa.application_id,
                pa.status,
                pa.submitted_at,
                pa.opened_by,
                pa.purchased_by,
                pa.offers_count
            FROM pos_application pa
            ORDER BY pa.submitted_at
        `);
        
        console.log(`Total applications in pos_application: ${appsResult.rows.length}`);
        appsResult.rows.forEach(app => {
            console.log(`  - App ${app.application_id}: status=${app.status}, offers_count=${app.offers_count}, opened_by=${app.opened_by}, purchased_by=${app.purchased_by}`);
        });
        
        // 5. Calculate expected metrics
        console.log('\n📊 Expected Analytics Metrics:');
        
        // Total offers submitted
        const totalOffers = offersResult.rows.length;
        console.log(`Total Offers Submitted: ${totalOffers}`);
        
        // Bank performance metrics
        const bankMetrics = await client.query(`
            SELECT 
                u.entity_name as bank_name,
                u.email as bank_email,
                COUNT(DISTINCT bav.application_id) as applications_viewed,
                COUNT(DISTINCT bos.application_id) as offers_submitted,
                CASE 
                    WHEN COUNT(DISTINCT bav.application_id) > 0 
                    THEN ROUND((COUNT(DISTINCT bos.application_id)::DECIMAL / COUNT(DISTINCT bav.application_id)) * 100, 2)
                    ELSE 0 
                END as conversion_rate,
                ROUND(AVG(EXTRACT(EPOCH FROM (bav.viewed_at - pa.submitted_at))/3600), 2) as avg_response_time_hours,
                ROUND(AVG(EXTRACT(EPOCH FROM (bos.submitted_at - bav.viewed_at))/3600), 2) as avg_offer_time_hours
            FROM users u
            LEFT JOIN bank_application_views bav ON u.user_id = bav.bank_user_id
            LEFT JOIN bank_offer_submissions bos ON u.user_id = bos.bank_user_id
            LEFT JOIN pos_application pa ON bav.application_id = pa.application_id
            WHERE u.user_type = 'bank_user'
            GROUP BY u.entity_name, u.email
        `);
        
        console.log('Bank Performance Metrics:');
        bankMetrics.rows.forEach(bank => {
            console.log(`  - ${bank.bank_name}: ${bank.applications_viewed} viewed, ${bank.offers_submitted} submitted, ${bank.conversion_rate}% conversion`);
            console.log(`    Avg Response Time: ${bank.avg_response_time_hours} hrs, Avg Offer Time: ${bank.avg_offer_time_hours} hrs`);
        });
        
    } catch (error) {
        console.error('❌ Error validating analytics data:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

validateAnalyticsData()
    .then(() => {
        console.log('\n✅ Analytics data validation completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Analytics data validation failed:', error);
        process.exit(1);
    });
