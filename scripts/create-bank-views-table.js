require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createBankViewsTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating bank_application_views table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_application_views (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
                bank_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                bank_name VARCHAR(255) NOT NULL,
                viewed_at TIMESTAMP DEFAULT NOW(),
                auction_start_time TIMESTAMP,
                time_to_open_minutes INTEGER,
                ip_address VARCHAR(45),
                user_agent TEXT,
                UNIQUE(application_id, bank_user_id)
            )
        `);
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_app_id ON bank_application_views(application_id);
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_bank_id ON bank_application_views(bank_user_id);
            CREATE INDEX IF NOT EXISTS idx_bank_application_views_viewed_at ON bank_application_views(viewed_at);
        `);
        
        console.log('✅ bank_application_views table created successfully');
        
    } catch (error) {
        console.error('❌ Error creating bank_application_views table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createBankViewsTable()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
