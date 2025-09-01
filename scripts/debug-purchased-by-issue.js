const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugPurchasedByIssue() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Debugging purchased_by issue...\n');
        
        // Get a sample application with offers
        const sampleAppQuery = `
            SELECT 
                pa.application_id,
                pa.trade_name,
                pa.current_application_status,
                pa.status,
                pa.purchased_by,
                pa.offers_count,
                pa.auction_end_time,
                array_length(pa.purchased_by, 1) as purchased_by_length
            FROM pos_application pa
            WHERE pa.offers_count > 0
            ORDER BY pa.offers_count DESC
            LIMIT 5
        `;
        
        const sampleApps = await client.query(sampleAppQuery);
        
        console.log('📋 Sample applications with offers:');
        console.log('=' .repeat(80));
        
        for (const app of sampleApps.rows) {
            console.log(`\nApplication ID: ${app.application_id}`);
            console.log(`Trade Name: ${app.trade_name}`);
            console.log(`Current Status: ${app.current_application_status}`);
            console.log(`Status: ${app.status}`);
            console.log(`Purchased By: ${app.purchased_by}`);
            console.log(`Purchased By Length: ${app.purchased_by_length}`);
            console.log(`Offers Count: ${app.offers_count}`);
            console.log(`Auction End Time: ${app.auction_end_time}`);
            
            // Check offers for this application
            const offersQuery = `
                SELECT 
                    ao.offer_id,
                    ao.bank_user_id,
                    ao.submitted_by_user_id,
                    ao.status as offer_status,
                    ao.submitted_at,
                    u.entity_name as bank_name
                FROM application_offers ao
                JOIN users u ON ao.bank_user_id = u.user_id
                WHERE ao.submitted_application_id = $1
                ORDER BY ao.submitted_at DESC
            `;
            
            const offers = await client.query(offersQuery, [app.application_id]);
            
            console.log(`  Offers (${offers.rows.length}):`);
            offers.rows.forEach(offer => {
                console.log(`    - Offer ${offer.offer_id}: Bank ${offer.bank_name} (${offer.bank_user_id}) - Status: ${offer.offer_status}`);
            });
            
            // Check if this application should appear in incoming requests for a specific bank
            if (offers.rows.length > 0) {
                const testBankId = offers.rows[0].bank_user_id;
                console.log(`\n  Testing visibility for Bank ${testBankId}:`);
                
                const visibilityQuery = `
                    SELECT 
                        CASE WHEN $1 = ANY(pa.purchased_by) THEN 'HIDDEN (in purchased_by)' ELSE 'VISIBLE' END as visibility,
                        pa.purchased_by,
                        $1 = ANY(pa.purchased_by) as is_purchased
                    FROM pos_application pa
                    WHERE pa.application_id = $2
                `;
                
                const visibility = await client.query(visibilityQuery, [testBankId, app.application_id]);
                
                if (visibility.rows.length > 0) {
                    const vis = visibility.rows[0];
                    console.log(`    Visibility: ${vis.visibility}`);
                    console.log(`    Is Purchased: ${vis.is_purchased}`);
                    console.log(`    Purchased By Array: ${vis.purchased_by}`);
                }
            }
        }
        
        // Check for any inconsistencies
        console.log('\n🔍 Checking for inconsistencies...');
        console.log('=' .repeat(80));
        
        const inconsistencyQuery = `
            SELECT 
                pa.application_id,
                pa.offers_count,
                array_length(pa.purchased_by, 1) as purchased_by_length,
                COUNT(ao.offer_id) as actual_offers_count
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            GROUP BY pa.application_id, pa.offers_count, pa.purchased_by
            HAVING 
                pa.offers_count != COUNT(ao.offer_id) 
                OR (pa.offers_count > 0 AND array_length(pa.purchased_by, 1) IS NULL)
            ORDER BY pa.application_id
        `;
        
        const inconsistencies = await client.query(inconsistencyQuery);
        
        if (inconsistencies.rows.length > 0) {
            console.log(`\n❌ Found ${inconsistencies.rows.length} inconsistencies:`);
            inconsistencies.rows.forEach(inc => {
                console.log(`  - App ${inc.application_id}: offers_count=${inc.offers_count}, purchased_by_length=${inc.purchased_by_length}, actual_offers=${inc.actual_offers_count}`);
            });
        } else {
            console.log('\n✅ No inconsistencies found');
        }
        
    } catch (error) {
        console.error('❌ Error debugging purchased_by issue:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

debugPurchasedByIssue().catch(console.error);
