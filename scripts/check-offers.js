const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkOffers() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking offers in application_offers table...\n');
        
        // Check all offers
        const offers = await client.query(`
            SELECT 
                ao.*,
                u.entity_name as bank_name,
                bu.contact_person as bank_contact_person,
                bu.contact_person_number as bank_contact_number,
                pa.trade_name as business_name,
                pa.user_id as business_user_id
            FROM application_offers ao
            JOIN bank_users bu ON ao.bank_user_id = bu.user_id
            JOIN users u ON bu.user_id = u.user_id
            JOIN pos_application pa ON ao.submitted_application_id = pa.application_id
            ORDER BY ao.submitted_at DESC
        `);
        
        console.log(`📋 Found ${offers.rows.length} offers:`);
        offers.rows.forEach((offer, index) => {
            console.log(`\n  ${index + 1}. Offer ID: ${offer.offer_id}`);
            console.log(`     Application ID: ${offer.submitted_application_id}`);
            console.log(`     Business: ${offer.business_name} (User ID: ${offer.business_user_id})`);
            console.log(`     Bank: ${offer.bank_name} (User ID: ${offer.bank_user_id})`);
            console.log(`     Bank Contact: ${offer.bank_contact_person} (${offer.bank_contact_number})`);
            console.log(`     Device Setup Fee: ${offer.offer_device_setup_fee}`);
            console.log(`     Comment: ${offer.offer_comment || 'No comment'}`);
            console.log(`     Submitted: ${offer.submitted_at}`);
            console.log(`     Uploaded File: ${offer.uploaded_filename || 'No file'}`);
        });
        
        // Check the specific application that should have offers
        const application = await client.query(`
            SELECT 
                pa.application_id,
                pa.user_id as business_user_id,
                pa.trade_name,
                pa.status,
                pa.offers_count,
                pa.opened_by,
                pa.purchased_by,
                bu.trade_name as business_name
            FROM pos_application pa
            JOIN business_users bu ON pa.user_id = bu.user_id
            WHERE pa.application_id = 2
        `);
        
        if (application.rows.length > 0) {
            const app = application.rows[0];
            console.log(`\n📊 Application #${app.application_id} details:`);
            console.log(`  Business User ID: ${app.business_user_id}`);
            console.log(`  Business Name: ${app.business_name}`);
            console.log(`  Trade Name: ${app.trade_name}`);
            console.log(`  Status: ${app.status}`);
            console.log(`  Offers Count: ${app.offers_count}`);
            console.log(`  Opened By: [${app.opened_by}]`);
            console.log(`  Purchased By: [${app.purchased_by}]`);
            
            // Check offers for this specific application
            const appOffers = await client.query(`
                SELECT 
                    ao.*,
                    u.entity_name as bank_name
                FROM application_offers ao
                JOIN bank_users bu ON ao.bank_user_id = bu.user_id
                JOIN users u ON bu.user_id = u.user_id
                WHERE ao.submitted_application_id = $1
                ORDER BY ao.submitted_at DESC
            `, [app.application_id]);
            
            console.log(`\n  📋 Offers for this application: ${appOffers.rows.length}`);
            appOffers.rows.forEach((offer, index) => {
                console.log(`    ${index + 1}. Bank: ${offer.bank_name}`);
                console.log(`       Setup Fee: ${offer.offer_device_setup_fee}`);
                console.log(`       Comment: ${offer.offer_comment || 'No comment'}`);
                console.log(`       Submitted: ${offer.submitted_at}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking offers:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkOffers()
    .then(() => {
        console.log('\n✅ Offers check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Offers check failed:', error);
        process.exit(1);
    });
