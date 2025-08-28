const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixOffersCount() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Fixing offers count in pos_application table...\n');
        
        await client.query('BEGIN');

        // Update offers_count for all applications based on actual offers in application_offers table
        const result = await client.query(`
            UPDATE pos_application 
            SET offers_count = (
                SELECT COUNT(*) 
                FROM application_offers 
                WHERE application_offers.submitted_application_id = pos_application.application_id
            )
        `);
        
        console.log(`✅ Updated offers count for ${result.rowCount} applications`);
        
        // Show the corrected data
        const applications = await client.query(`
            SELECT 
                application_id,
                user_id,
                status,
                offers_count,
                purchased_by,
                submitted_at
            FROM pos_application 
            ORDER BY application_id
        `);
        
        console.log('\n📊 Updated applications:');
        applications.rows.forEach(app => {
            console.log(`  Application #${app.application_id}:`);
            console.log(`    User ID: ${app.user_id}`);
            console.log(`    Status: ${app.status}`);
            console.log(`    Offers Count: ${app.offers_count}`);
            console.log(`    Purchased By: [${app.purchased_by}]`);
            console.log('');
        });
        
        await client.query('COMMIT');
        console.log('✅ Offers count fix completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing offers count:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixOffersCount()
    .then(() => {
        console.log('\n✅ Offers count fix completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Offers count fix failed:', error);
        process.exit(1);
    });
