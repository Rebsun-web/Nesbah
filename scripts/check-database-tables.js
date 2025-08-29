require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkDatabaseTables() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking database tables...');
        
        // Get all tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('\n📋 Existing tables:');
        result.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        console.log(`\n📊 Total tables: ${result.rows.length}`);
        
    } catch (error) {
        console.error('❌ Error checking database tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkDatabaseTables()
    .then(() => {
        console.log('\n✅ Database check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Database check failed:', error);
        process.exit(1);
    });
