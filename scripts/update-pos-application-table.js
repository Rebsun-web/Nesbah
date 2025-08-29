require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updatePosApplicationTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Add missing columns to pos_application table if they don't exist
        console.log('📋 Updating pos_application table...');
        
        await client.query(`
            ALTER TABLE pos_application 
            ADD COLUMN IF NOT EXISTS purchased_by INTEGER[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS revenue_collected DECIMAL(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0
        `);

        console.log('✅ pos_application table updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating pos_application table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

updatePosApplicationTable().catch(console.error);
