const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateStatusConstraints() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Updating status constraints to correct statuses...');
        
        // Drop existing constraints
        console.log('\n📋 Dropping existing status constraints...');
        try {
            await client.query('ALTER TABLE submitted_applications DROP CONSTRAINT IF EXISTS submitted_applications_status_check');
            console.log('  ✅ Dropped submitted_applications_status_check');
        } catch (err) {
            console.log('  ⚠️  submitted_applications_status_check may not exist');
        }
        
        try {
            await client.query('ALTER TABLE pos_application DROP CONSTRAINT IF EXISTS pos_application_status_check');
            console.log('  ✅ Dropped pos_application_status_check');
        } catch (err) {
            console.log('  ⚠️  pos_application_status_check may not exist');
        }
        
        // Add new constraints for the three correct statuses
        console.log('\n📋 Adding new status constraints...');
        
        await client.query(`
            ALTER TABLE submitted_applications 
            ADD CONSTRAINT submitted_applications_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        console.log('  ✅ Added submitted_applications_status_check');
        
        await client.query(`
            ALTER TABLE pos_application 
            ADD CONSTRAINT pos_application_status_check 
            CHECK (status IN ('live_auction', 'completed', 'ignored'))
        `);
        console.log('  ✅ Added pos_application_status_check');
        
        console.log('\n✅ Status constraints updated successfully!');
        console.log('🎯 Now only allowing: live_auction, completed, ignored');
        
    } catch (error) {
        console.error('❌ Error updating status constraints:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updateStatusConstraints();
