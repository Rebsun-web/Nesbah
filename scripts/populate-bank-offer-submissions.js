require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function populateBankOfferSubmissions() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Populating bank_offer_submissions table with existing data...');
        
        // First, let's see what offers exist
        const offersResult = await client.query(`
            SELECT 
                ao.offer_id,
                ao.submitted_application_id as application_id,
                ao.bank_user_id,
                ao.submitted_at,
                u.entity_name as bank_name
            FROM application_offers ao
            JOIN users u ON ao.bank_user_id = u.user_id
            WHERE u.user_type = 'bank_user'
        `);
        
        console.log(`📊 Found ${offersResult.rows.length} existing offers`);
        
        if (offersResult.rows.length > 0) {
            // Insert existing offers into bank_offer_submissions
            for (const offer of offersResult.rows) {
                try {
                    await client.query(`
                        INSERT INTO bank_offer_submissions (
                            application_id, 
                            bank_user_id, 
                            bank_name, 
                            offer_id, 
                            submitted_at
                        ) VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (application_id, bank_user_id) 
                        DO UPDATE SET 
                            offer_id = EXCLUDED.offer_id,
                            submitted_at = EXCLUDED.submitted_at
                    `, [
                        offer.application_id,
                        offer.bank_user_id,
                        offer.bank_name,
                        offer.offer_id,
                        offer.submitted_at
                    ]);
                    
                    console.log(`✅ Inserted offer ${offer.offer_id} for bank ${offer.bank_name}`);
                } catch (error) {
                    console.log(`⚠️  Skipped offer ${offer.offer_id}: ${error.message}`);
                }
            }
        }
        
        // Now let's check the final count
        const finalCount = await client.query('SELECT COUNT(*) FROM bank_offer_submissions');
        console.log(`📊 Total records in bank_offer_submissions: ${finalCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error populating bank_offer_submissions table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

populateBankOfferSubmissions()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
