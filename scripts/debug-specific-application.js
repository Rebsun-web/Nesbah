const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugSpecificApplication() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Debugging Application ID 7 specifically...\n');
        
        // Get detailed info about application 7
        const appQuery = `
            SELECT 
                pa.*,
                array_length(pa.purchased_by, 1) as purchased_by_length
            FROM pos_application pa
            WHERE pa.application_id = 7
        `;
        
        const app = await client.query(appQuery);
        
        if (app.rows.length === 0) {
            console.log('❌ Application 7 not found');
            return;
        }
        
        const application = app.rows[0];
        console.log('📋 Application Details:');
        console.log('=' .repeat(50));
        console.log(`Application ID: ${application.application_id}`);
        console.log(`Trade Name: ${application.trade_name}`);
        console.log(`Status: ${application.status}`);
        console.log(`Current Status: ${application.current_application_status}`);
        console.log(`Offers Count: ${application.offers_count}`);
        console.log(`Purchased By: ${application.purchased_by}`);
        console.log(`Purchased By Length: ${application.purchased_by_length}`);
        console.log(`Auction End Time: ${application.auction_end_time}`);
        console.log(`Submitted At: ${application.submitted_at}`);
        
        // Get all offers for this application
        const offersQuery = `
            SELECT 
                ao.*,
                u.entity_name as bank_name
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            WHERE ao.submitted_application_id = 7
            ORDER BY ao.submitted_at DESC
        `;
        
        const offers = await client.query(offersQuery);
        
        console.log(`\n📝 Offers (${offers.rows.length}):`);
        console.log('=' .repeat(50));
        
        offers.rows.forEach((offer, index) => {
            console.log(`\nOffer ${index + 1}:`);
            console.log(`  Offer ID: ${offer.offer_id}`);
            console.log(`  Bank: ${offer.bank_name} (${offer.bank_user_id})`);
            console.log(`  Status: ${offer.status}`);
            console.log(`  Submitted At: ${offer.submitted_at}`);
            console.log(`  Submitted By: ${offer.submitted_by_user_id}`);
        });
        
        // Check if this application should be visible in incoming requests for Bank 737
        const bankId = 737;
        console.log(`\n🔍 Testing visibility for Bank ${bankId}:`);
        console.log('=' .repeat(50));
        
        const visibilityQuery = `
            SELECT 
                CASE WHEN $1 = ANY(pa.purchased_by) THEN 'HIDDEN (in purchased_by)' ELSE 'VISIBLE' END as visibility,
                pa.purchased_by,
                $1 = ANY(pa.purchased_by) as is_purchased,
                pa.current_application_status,
                pa.status
            FROM pos_application pa
            WHERE pa.application_id = 7
        `;
        
        const visibility = await client.query(visibilityQuery, [bankId]);
        
        if (visibility.rows.length > 0) {
            const vis = visibility.rows[0];
            console.log(`Visibility: ${vis.visibility}`);
            console.log(`Is Purchased: ${vis.is_purchased}`);
            console.log(`Purchased By Array: ${vis.purchased_by}`);
            console.log(`Current Status: ${vis.current_application_status}`);
            console.log(`Status: ${vis.status}`);
        }
        
        // Check the incoming requests query logic
        console.log(`\n🔍 Testing incoming requests query logic:`);
        console.log('=' .repeat(50));
        
        const incomingQuery = `
            SELECT 
                pa.application_id,
                pa.trade_name,
                COALESCE(pa.current_application_status, pa.status) as effective_status,
                pa.auction_end_time,
                pa.purchased_by,
                $1 = ANY(pa.purchased_by) as bank_in_purchased_by,
                (pa.auction_end_time IS NULL OR pa.auction_end_time > NOW()) as auction_active
            FROM pos_application pa
            WHERE pa.application_id = 7
        `;
        
        const incoming = await client.query(incomingQuery, [bankId]);
        
        if (incoming.rows.length > 0) {
            const inc = incoming.rows[0];
            console.log(`Application ID: ${inc.application_id}`);
            console.log(`Trade Name: ${inc.trade_name}`);
            console.log(`Effective Status: ${inc.effective_status}`);
            console.log(`Auction End Time: ${inc.auction_end_time}`);
            console.log(`Purchased By: ${inc.purchased_by}`);
            console.log(`Bank in Purchased By: ${inc.bank_in_purchased_by}`);
            console.log(`Auction Active: ${inc.auction_active}`);
            
            // Test the full incoming requests filter
            const shouldShow = inc.effective_status === 'live_auction' && 
                              !inc.bank_in_purchased_by && 
                              inc.auction_active;
            
            console.log(`\nShould Show in Incoming Requests: ${shouldShow}`);
            console.log(`  - Status is 'live_auction': ${inc.effective_status === 'live_auction'}`);
            console.log(`  - Bank NOT in purchased_by: ${!inc.bank_in_purchased_by}`);
            console.log(`  - Auction is active: ${inc.auction_active}`);
        }
        
    } catch (error) {
        console.error('❌ Error debugging specific application:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

debugSpecificApplication().catch(console.error);
