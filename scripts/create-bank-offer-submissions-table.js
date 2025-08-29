require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createBankOfferSubmissionsTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Creating bank_offer_submissions table...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS bank_offer_submissions (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL REFERENCES pos_application(application_id) ON DELETE CASCADE,
                bank_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                bank_name VARCHAR(255) NOT NULL,
                offer_id INTEGER REFERENCES application_offers(offer_id) ON DELETE CASCADE,
                submitted_at TIMESTAMP DEFAULT NOW(),
                first_viewed_at TIMESTAMP,
                time_to_submit_minutes INTEGER,
                UNIQUE(application_id, bank_user_id)
            )
        `);
        
        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_app_id ON bank_offer_submissions(application_id);
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_bank_id ON bank_offer_submissions(bank_user_id);
            CREATE INDEX IF NOT EXISTS idx_bank_offer_submissions_submitted_at ON bank_offer_submissions(submitted_at);
        `);
        
        console.log('✅ bank_offer_submissions table created successfully');
        
    } catch (error) {
        console.error('❌ Error creating bank_offer_submissions table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createBankOfferSubmissionsTable()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
