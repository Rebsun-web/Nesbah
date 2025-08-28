require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixRemainingInconsistencies() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🔧 Fixing remaining status inconsistencies...\n');

        // Fix Application 548 specifically
        console.log('📋 Fixing Application 548 status inconsistency...');
        
        // Update pos_application to match submitted_applications
        const result548 = await client.query(`
            UPDATE pos_application 
            SET status = 'complete' 
            WHERE application_id = 548 AND status = 'live_auction'
        `);
        
        if (result548.rowCount > 0) {
            console.log(`  ✅ Updated Application 548 status in pos_application from 'live_auction' to 'complete'`);
        }

        // Fix Application 547 specifically
        console.log('📋 Fixing Application 547 status inconsistency...');
        
        // Update pos_application to match submitted_applications
        const result547 = await client.query(`
            UPDATE pos_application 
            SET status = 'ignored' 
            WHERE application_id = 547 AND status = 'live_auction'
        `);
        
        if (result547.rowCount > 0) {
            console.log(`  ✅ Updated Application 547 status in pos_application from 'live_auction' to 'ignored'`);
        }

        // Verify the fixes
        console.log('\n📊 Verifying Application statuses...');
        const verification = await client.query(`
            SELECT 
                sa.application_id,
                sa.status as submitted_status,
                pa.status as pos_status,
                aot.current_application_status as tracking_status
            FROM submitted_applications sa
            JOIN pos_application pa ON sa.application_id = pa.application_id
            LEFT JOIN application_offer_tracking aot ON sa.application_id = aot.application_id
            WHERE sa.application_id IN (547, 548)
        `);
        
        verification.rows.forEach(app => {
            console.log(`  Application ${app.application_id}:`);
            console.log(`    submitted_applications: ${app.submitted_status}`);
            console.log(`    pos_application: ${app.pos_status}`);
            console.log(`    tracking: ${app.tracking_status}`);
        });

        await client.query('COMMIT');
        
        console.log('\n✅ Remaining inconsistencies fixed!');
        
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

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing remaining inconsistencies:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixRemainingInconsistencies();
