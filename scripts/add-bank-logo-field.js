require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

async function addBankLogoField() {
    console.log('🔄 Adding logo_url field to bank_users table...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Add logo_url column
        try {
            await client.query('ALTER TABLE bank_users ADD COLUMN logo_url VARCHAR(500)');
            console.log('✅ Added logo_url column');
        } catch (error) {
            if (error.code === '42701') { // column already exists
                console.log('⚠️ logo_url column already exists, skipping...');
            } else {
                throw error;
            }
        }

        // Add index for logo_url
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_bank_users_logo_url ON bank_users(logo_url)');
            console.log('✅ Added logo_url index');
        } catch (error) {
            console.log('⚠️ Index creation error:', error.message);
        }

        await client.query('COMMIT');
        console.log('✅ Bank logo field addition completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Bank logo field addition failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    addBankLogoField()
        .then(() => {
            console.log('Bank logo field addition completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Bank logo field addition failed:', error);
            process.exit(1);
        });
}

module.exports = { addBankLogoField };
