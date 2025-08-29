require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixPurchasedByArray() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing purchased_by array in pos_application table...');
        
        // First, let's see the current state
        const currentState = await client.query(`
            SELECT 
                pa.application_id,
                pa.purchased_by,
                pa.offers_count,
                COUNT(ao.offer_id) as actual_offers
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            GROUP BY pa.application_id, pa.purchased_by, pa.offers_count
        `);
        
        console.log('\n📊 Current state:');
        currentState.rows.forEach(row => {
            console.log(`  - App ${row.application_id}: purchased_by=${row.purchased_by}, offers_count=${row.offers_count}, actual_offers=${row.actual_offers}`);
        });
        
        // Get all offers and their bank users
        const offersResult = await client.query(`
            SELECT 
                ao.submitted_application_id as application_id,
                ao.submitted_by_user_id as bank_user_id,
                u.entity_name as bank_name
            FROM application_offers ao
            JOIN users u ON ao.submitted_by_user_id = u.user_id
            WHERE u.user_type = 'bank_user'
        `);
        
        console.log(`\n📊 Found ${offersResult.rows.length} offers to process`);
        
        // Group offers by application
        const offersByApplication = {};
        offersResult.rows.forEach(offer => {
            if (!offersByApplication[offer.application_id]) {
                offersByApplication[offer.application_id] = [];
            }
            offersByApplication[offer.application_id].push(offer.bank_user_id);
        });
        
        // Update each application's purchased_by array
        for (const [applicationId, bankUserIds] of Object.entries(offersByApplication)) {
            console.log(`\n🔧 Updating application ${applicationId} with bank users: ${bankUserIds.join(', ')}`);
            
            // Initialize purchased_by as empty array if it's null
            await client.query(`
                UPDATE pos_application 
                SET purchased_by = COALESCE(purchased_by, ARRAY[]::INTEGER[])
                WHERE application_id = $1 AND purchased_by IS NULL
            `, [applicationId]);
            
            // Add each bank user to the purchased_by array
            for (const bankUserId of bankUserIds) {
                await client.query(`
                    UPDATE pos_application 
                    SET purchased_by = array_append(purchased_by, $1)
                    WHERE application_id = $2 
                    AND NOT $1 = ANY(purchased_by)
                `, [bankUserId, applicationId]);
            }
            
            // Update offers_count to match actual count
            await client.query(`
                UPDATE pos_application 
                SET offers_count = $1
                WHERE application_id = $2
            `, [bankUserIds.length, applicationId]);
        }
        
        // Verify the changes
        const finalState = await client.query(`
            SELECT 
                pa.application_id,
                pa.purchased_by,
                pa.offers_count,
                COUNT(ao.offer_id) as actual_offers
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            GROUP BY pa.application_id, pa.purchased_by, pa.offers_count
        `);
        
        console.log('\n✅ Final state:');
        finalState.rows.forEach(row => {
            console.log(`  - App ${row.application_id}: purchased_by=${row.purchased_by}, offers_count=${row.offers_count}, actual_offers=${row.actual_offers}`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing purchased_by array:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixPurchasedByArray()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
