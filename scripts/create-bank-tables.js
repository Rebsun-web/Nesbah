require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createBankTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Create bank_offer_submissions table
        console.log('📋 Creating bank_offer_submissions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_offer_submissions (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                offer_id INTEGER,
                submitted_at TIMESTAMP DEFAULT NOW(),
                first_viewed_at TIMESTAMP,
                time_to_submit_minutes DECIMAL(10,2),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ bank_offer_submissions table created/verified');

        // Create bank_application_views table
        console.log('📋 Creating bank_application_views table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_application_views (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                bank_name VARCHAR(255) NOT NULL,
                viewed_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(application_id, bank_user_id)
            )
        `);
        console.log('✅ bank_application_views table created/verified');
        
    } catch (error) {
        console.error('❌ Error creating bank tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createBankTables().catch(console.error);
