require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixOfferAndPurchasedBy() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing offer data and purchased_by array...');
        
        // First, let's fix the offer's submitted_by_user_id
        const offerResult = await client.query(`
            UPDATE application_offers 
            SET submitted_by_user_id = bank_user_id 
            WHERE offer_id = 2 AND submitted_by_user_id IS NULL
            RETURNING offer_id, submitted_by_user_id, bank_user_id
        `);
        
        console.log(`\n📊 Updated offer:`, offerResult.rows[0]);
        
        // Now let's update the pos_application purchased_by array
        const appResult = await client.query(`
            UPDATE pos_application 
            SET 
                purchased_by = ARRAY[737],
                offers_count = 1
            WHERE application_id = 2
            RETURNING application_id, purchased_by, offers_count
        `);
        
        console.log(`\n📊 Updated application:`, appResult.rows[0]);
        
        // Verify the changes
        const verifyResult = await client.query(`
            SELECT 
                pa.application_id,
                pa.purchased_by,
                pa.offers_count,
                ao.offer_id,
                ao.submitted_by_user_id,
                ao.bank_user_id,
                u.entity_name as bank_name
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            LEFT JOIN users u ON ao.bank_user_id = u.user_id
            WHERE pa.application_id = 2
        `);
        
        console.log(`\n✅ Verification:`, verifyResult.rows[0]);
        
        // Test the purchased leads query
        const purchasedLeadsResult = await client.query(`
            SELECT 
                pa.application_id,
                COALESCE(pa.current_application_status, pa.status) as status,
                pa.submitted_at,
                pa.auction_end_time,
                pa.offers_count,
                pa.revenue_collected,
                ao.offer_device_setup_fee,
                ao.offer_transaction_fee_mada,
                ao.offer_transaction_fee_visa_mc,
                u.entity_name as bank_name
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id AND ao.bank_user_id = 737
            LEFT JOIN users u ON ao.bank_user_id = u.user_id
            WHERE 737 = ANY(pa.purchased_by)
        `);
        
        console.log(`\n📊 Purchased leads query result: ${purchasedLeadsResult.rows.length} records`);
        if (purchasedLeadsResult.rows.length > 0) {
            console.log('Purchased lead details:', purchasedLeadsResult.rows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error fixing offer and purchased_by:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixOfferAndPurchasedBy()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
