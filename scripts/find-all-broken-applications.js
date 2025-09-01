const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function findAllBrokenApplications() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Finding all applications with offers but missing purchased_by entries...\n');
        
        // Find applications where offers exist but purchased_by is empty or missing
        const brokenQuery = `
            SELECT 
                pa.application_id,
                pa.trade_name,
                pa.current_application_status,
                pa.status,
                pa.purchased_by,
                pa.offers_count,
                array_length(pa.purchased_by, 1) as purchased_by_length,
                COUNT(ao.offer_id) as actual_offers_count,
                array_agg(DISTINCT ao.bank_user_id) as bank_user_ids
            FROM pos_application pa
            LEFT JOIN application_offers ao ON pa.application_id = ao.submitted_application_id
            GROUP BY pa.application_id, pa.trade_name, pa.current_application_status, pa.status, pa.purchased_by, pa.offers_count
            HAVING 
                COUNT(ao.offer_id) > 0 
                AND (pa.purchased_by IS NULL OR array_length(pa.purchased_by, 1) IS NULL)
            ORDER BY pa.application_id
        `;
        
        const brokenApps = await client.query(brokenQuery);
        
        if (brokenApps.rows.length === 0) {
            console.log('✅ No broken applications found!');
            return;
        }
        
        console.log(`❌ Found ${brokenApps.rows.length} broken applications:\n`);
        
        for (const app of brokenApps.rows) {
            console.log(`📋 Application ID: ${app.application_id}`);
            console.log(`  Trade Name: ${app.trade_name}`);
            console.log(`  Status: ${app.status}`);
            console.log(`  Current Status: ${app.current_application_status}`);
            console.log(`  Offers Count: ${app.offers_count}`);
            console.log(`  Purchased By: ${app.purchased_by}`);
            console.log(`  Purchased By Length: ${app.purchased_by_length}`);
            console.log(`  Actual Offers: ${app.actual_offers_count}`);
            console.log(`  Bank User IDs: ${app.bank_user_ids}`);
            console.log('');
        }
        
        // Now let's fix all of them
        console.log('🔧 Fixing all broken applications...\n');
        
        for (const app of brokenApps.rows) {
            console.log(`\n🔧 Fixing Application ${app.application_id}...`);
            
            await client.query('BEGIN');
            
            try {
                // Update the purchased_by array for each bank user
                for (const bankUserId of app.bank_user_ids) {
                    const updateResult = await client.query(`
                        UPDATE pos_application 
                        SET 
                            purchased_by = CASE 
                                WHEN purchased_by IS NULL OR array_length(purchased_by, 1) IS NULL THEN ARRAY[$1::INTEGER]
                                ELSE purchased_by || ARRAY[$1::INTEGER]
                            END
                        WHERE application_id = $2
                        RETURNING purchased_by
                    `, [bankUserId, app.application_id]);
                    
                    if (updateResult.rows.length > 0) {
                        console.log(`  ✅ Added Bank ${bankUserId} to purchased_by`);
                    } else {
                        console.log(`  ❌ Failed to add Bank ${bankUserId}`);
                    }
                }
                
                // Verify the fix
                const verifyResult = await client.query(`
                    SELECT 
                        purchased_by,
                        array_length(purchased_by, 1) as purchased_by_length
                    FROM pos_application 
                    WHERE application_id = $1
                `, [app.application_id]);
                
                if (verifyResult.rows.length > 0) {
                    const verify = verifyResult.rows[0];
                    console.log(`  🔍 Verification: purchased_by=${verify.purchased_by}, length=${verify.purchased_by_length}`);
                }
                
                await client.query('COMMIT');
                console.log(`  ✅ Application ${app.application_id} fixed successfully`);
                
            } catch (updateError) {
                await client.query('ROLLBACK');
                console.error(`  ❌ Failed to fix Application ${app.application_id}:`, updateError.message);
            }
        }
        
        console.log('\n🎉 All broken applications have been processed!');
        
    } catch (error) {
        console.error('❌ Error finding broken applications:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

findAllBrokenApplications().catch(console.error);
