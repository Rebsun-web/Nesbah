require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createApplicationRevenueTable() {
    const client = await pool.connect();
    
    try {
        console.log('🔗 Connecting to database...');
        
        // Check if table already exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'application_revenue'
            );
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ application_revenue table already exists');
            return;
        }

        console.log('📋 Creating application_revenue table...');
        
        // Create application_revenue table
        await client.query(`
            CREATE TABLE application_revenue (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                bank_user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ application_revenue table created successfully');
        
    } catch (error) {
        console.error('❌ Error creating application_revenue table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createApplicationRevenueTable().catch(console.error);
