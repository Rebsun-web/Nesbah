require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkOfferId2() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking for offer ID 2...');
        
        // Check application_offers table for offer ID 2
        const offerResult = await client.query(`
            SELECT * FROM application_offers WHERE offer_id = 2
        `);
        
        console.log(`\n📊 Offer ID 2 in application_offers: ${offerResult.rows.length} records`);
        if (offerResult.rows.length > 0) {
            console.log('Offer details:', offerResult.rows[0]);
        }
        
        // Check all application_offers
        const allOffersResult = await client.query(`
            SELECT offer_id, submitted_application_id, submitted_by_user_id, status, submitted_at 
            FROM application_offers 
            ORDER BY offer_id
        `);
        
        console.log(`\n📊 All offers in application_offers: ${allOffersResult.rows.length}`);
        allOffersResult.rows.forEach(offer => {
            console.log(`  - Offer ${offer.offer_id}: App ${offer.submitted_application_id}, User ${offer.submitted_by_user_id}, Status: ${offer.status}`);
        });
        
        // Check bank_offer_submissions for offer ID 2
        const submissionResult = await client.query(`
            SELECT * FROM bank_offer_submissions WHERE offer_id = 2
        `);
        
        console.log(`\n📊 Offer ID 2 in bank_offer_submissions: ${submissionResult.rows.length} records`);
        if (submissionResult.rows.length > 0) {
            console.log('Submission details:', submissionResult.rows[0]);
        }
        
        // Check if there's a mismatch in the offer creation process
        console.log('\n🔍 Checking offer creation process...');
        
        // Check if the offer was created through the purchase process
        const purchaseResult = await client.query(`
            SELECT * FROM approved_leads WHERE application_id = 2
        `);
        
        console.log(`\n📊 Approved leads for app 2: ${purchaseResult.rows.length} records`);
        if (purchaseResult.rows.length > 0) {
            console.log('Purchase details:', purchaseResult.rows[0]);
        }
        
        // Check application_offer_tracking
        const trackingResult = await client.query(`
            SELECT * FROM application_offer_tracking WHERE application_id = 2
        `);
        
        console.log(`\n📊 Tracking records for app 2: ${trackingResult.rows.length} records`);
        if (trackingResult.rows.length > 0) {
            console.log('Tracking details:', trackingResult.rows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error checking offer ID 2:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkOfferId2()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
