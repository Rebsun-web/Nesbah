require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAllInconsistencies() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing all remaining status inconsistencies...\n');

        // Find all inconsistencies
        console.log('📋 Finding all status inconsistencies...');
        const inconsistencies = await client.query(`
            SELECT DISTINCT
                sa.application_id,
                sa.status as submitted_status,
                pa.status as pos_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            WHERE sa.status != pa.status
            ORDER BY sa.application_id
        `);
        
        if (inconsistencies.rows.length === 0) {
            console.log('  ✅ No inconsistencies found!');
        } else {
            console.log(`  Found ${inconsistencies.rows.length} inconsistencies:`);
            inconsistencies.rows.forEach(row => {
                console.log(`    App ${row.application_id}: submitted=${row.submitted_status}, pos=${row.pos_status}`);
            });

            // Fix each inconsistency by updating pos_application to match submitted_applications
            console.log('\n📋 Fixing inconsistencies...');
            for (const row of inconsistencies.rows) {
                const result = await client.query(`
                    UPDATE pos_application 
                    SET status = $1 
                    WHERE application_id = $2
                `, [row.submitted_status, row.application_id]);
                
                if (result.rowCount > 0) {
                    console.log(`  ✅ Updated Application ${row.application_id}: pos_application status from '${row.pos_status}' to '${row.submitted_status}'`);
                }
            }
        }

        await client.query('COMMIT');
        
        console.log('\n✅ All inconsistencies fixed!');
        
        // Show final status distribution
        console.log('\n📊 Final status distribution:');
        const finalStatus = await client.query(`
            SELECT 
                COALESCE(aot.current_application_status, sa.status) as status,
                COUNT(DISTINCT sa.application_id) as count
            FROM submitted_applications sa
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            GROUP BY COALESCE(aot.current_application_status, sa.status)
            ORDER BY COALESCE(aot.current_application_status, sa.status)
        `);
        
        finalStatus.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Final verification
        console.log('\n🔍 Final verification - checking for any remaining inconsistencies...');
        const finalCheck = await client.query(`
            SELECT 
                sa.application_id,
                sa.status as submitted_status,
                pa.status as pos_status,
                aot.current_application_status as tracking_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE sa.status != pa.status 
               OR (aot.current_application_status IS NOT NULL AND aot.current_application_status != sa.status)
            LIMIT 10
        `);
        
        if (finalCheck.rows.length === 0) {
            console.log('  ✅ No remaining inconsistencies found!');
        } else {
            console.log('  ⚠️  Still found some inconsistencies:');
            finalCheck.rows.forEach(row => {
                console.log(`    App ${row.application_id}: submitted=${row.submitted_status}, pos=${row.pos_status}, tracking=${row.tracking_status}`);
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing all inconsistencies:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixAllInconsistencies();
