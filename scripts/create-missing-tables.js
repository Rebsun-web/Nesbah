require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createMissingTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Create approved_leads table if it doesn't exist
        console.log('📋 Creating approved_leads table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS approved_leads (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                purchased_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ approved_leads table created/verified');

        // Create application_offer_tracking table if it doesn't exist
        console.log('📋 Creating application_offer_tracking table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_offer_tracking (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                purchased_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ application_offer_tracking table created/verified');
        
    } catch (error) {
        console.error('❌ Error creating missing tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createMissingTables().catch(console.error);
