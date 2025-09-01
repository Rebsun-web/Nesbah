const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixApplication7() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing Application ID 7...\n');
        
        // First, let's see the current state
        const currentState = await client.query(`
            SELECT 
                application_id,
                trade_name,
                purchased_by,
                offers_count,
                array_length(purchased_by, 1) as purchased_by_length
            FROM pos_application 
            WHERE application_id = 7
        `);
        
        if (currentState.rows.length === 0) {
            console.log('❌ Application 7 not found');
            return;
        }
        
        const current = currentState.rows[0];
        console.log('📋 Current State:');
        console.log(`  Application ID: ${current.application_id}`);
        console.log(`  Trade Name: ${current.trade_name}`);
        console.log(`  Purchased By: ${current.purchased_by}`);
        console.log(`  Purchased By Length: ${current.purchased_by_length}`);
        console.log(`  Offers Count: ${current.offers_count}`);
        
        // Get the bank user ID from the offers
        const bankQuery = await client.query(`
            SELECT DISTINCT bank_user_id 
            FROM application_offers 
            WHERE submitted_application_id = 7
        `);
        
        if (bankQuery.rows.length === 0) {
            console.log('❌ No offers found for Application 7');
            return;
        }
        
        const bankUserId = bankQuery.rows[0].bank_user_id;
        console.log(`\n🏦 Bank User ID from offers: ${bankUserId}`);
        
        // Now let's try to fix the purchased_by array
        console.log('\n🔧 Attempting to fix purchased_by array...');
        
        await client.query('BEGIN');
        
        try {
            // Update the purchased_by array
            const updateResult = await client.query(`
                UPDATE pos_application 
                SET 
                    purchased_by = CASE 
                        WHEN purchased_by IS NULL OR array_length(purchased_by, 1) IS NULL THEN ARRAY[$1::INTEGER]
                        ELSE purchased_by || ARRAY[$1::INTEGER]
                    END
                WHERE application_id = 7
                RETURNING purchased_by, array_length(purchased_by, 1) as purchased_by_length
            `, [bankUserId]);
            
            if (updateResult.rows.length > 0) {
                const updated = updateResult.rows[0];
                console.log(`✅ Update successful!`);
                console.log(`  New Purchased By: ${updated.purchased_by}`);
                console.log(`  New Length: ${updated.purchased_by_length}`);
            } else {
                console.log('❌ Update failed - no rows returned');
            }
            
            // Verify the update
            const verifyResult = await client.query(`
                SELECT 
                    purchased_by,
                    array_length(purchased_by, 1) as purchased_by_length,
                    $1 = ANY(purchased_by) as bank_in_purchased_by
                FROM pos_application 
                WHERE application_id = 7
            `, [bankUserId]);
            
            if (verifyResult.rows.length > 0) {
                const verify = verifyResult.rows[0];
                console.log(`\n🔍 Verification:`);
                console.log(`  Purchased By: ${verify.purchased_by}`);
                console.log(`  Length: ${verify.purchased_by_length}`);
                console.log(`  Bank ${bankUserId} in purchased_by: ${verify.bank_in_purchased_by}`);
                
                if (verify.bank_in_purchased_by) {
                    console.log(`\n✅ SUCCESS! Bank ${bankUserId} is now in purchased_by array`);
                    console.log(`   Application 7 should now be HIDDEN from incoming requests for Bank ${bankUserId}`);
                } else {
                    console.log(`\n❌ FAILED! Bank ${bankUserId} is still not in purchased_by array`);
                }
            }
            
            await client.query('COMMIT');
            console.log('\n✅ Transaction committed successfully');
            
        } catch (updateError) {
            await client.query('ROLLBACK');
            console.error('❌ Update failed, rolling back:', updateError);
            throw updateError;
        }
        
    } catch (error) {
        console.error('❌ Error fixing application:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixApplication7().catch(console.error);
