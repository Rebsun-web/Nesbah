require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkApplicationOffers() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking application_offers table...');
        
        // Check all offers
        const offersResult = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id,
                ao.submitted_by_user_id,
                ao.status,
                ao.submitted_at,
                u.entity_name as bank_name,
                u.user_type
            FROM application_offers ao
            JOIN users u ON ao.submitted_by_user_id = u.user_id
            ORDER BY ao.submitted_at
        `);
        
        console.log(`\n📊 Total offers in application_offers: ${offersResult.rows.length}`);
        offersResult.rows.forEach(offer => {
            console.log(`  - Offer ${offer.offer_id}: App ${offer.submitted_application_id}, Bank: ${offer.bank_name} (${offer.user_type}), Status: ${offer.status}, Submitted: ${offer.submitted_at}`);
        });
        
        // Check pos_application table
        const appsResult = await client.query(`
            SELECT 
                pa.application_id,
                pa.user_id,
                pa.status,
                pa.purchased_by,
                pa.offers_count,
                u.entity_name as business_name
            FROM pos_application pa
            JOIN users u ON pa.user_id = u.user_id
        `);
        
        console.log(`\n📊 Applications in pos_application: ${appsResult.rows.length}`);
        appsResult.rows.forEach(app => {
            console.log(`  - App ${app.application_id}: Business: ${app.business_name}, Status: ${app.status}, Purchased_by: ${app.purchased_by}, Offers_count: ${app.offers_count}`);
        });
        
        // Check if there's a mismatch
        console.log('\n🔍 Checking for mismatches...');
        const mismatchResult = await client.query(`
            SELECT 
                pa.application_id,
                pa.offers_count as pos_offers_count,
                COUNT(ao.offer_id) as actual_offers_count,
                pa.purchased_by
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            GROUP BY pa.application_id, pa.offers_count, pa.purchased_by
        `);
        
        mismatchResult.rows.forEach(row => {
            console.log(`  - App ${row.application_id}: pos_offers_count=${row.pos_offers_count}, actual_offers_count=${row.actual_offers_count}, purchased_by=${row.purchased_by}`);
        });
        
        // Check what's in the bank_offer_submissions table
        console.log('\n🔍 Checking bank_offer_submissions table...');
        const submissionsResult = await client.query(`
            SELECT 
                bos.id,
                bos.application_id,
                bos.bank_user_id,
                bos.bank_name,
                bos.offer_id,
                bos.submitted_at
            FROM bank_offer_submissions bos
        `);
        
        console.log(`\n📊 Total records in bank_offer_submissions: ${submissionsResult.rows.length}`);
        submissionsResult.rows.forEach(submission => {
            console.log(`  - Submission ${submission.id}: App ${submission.application_id}, Bank: ${submission.bank_name}, Offer: ${submission.offer_id}, Submitted: ${submission.submitted_at}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking application_offers:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkApplicationOffers()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
