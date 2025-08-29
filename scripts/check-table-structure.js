require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTableStructure() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking pos_application table structure...');
        
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'pos_application' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 pos_application table columns:');
        result.rows.forEach(row => {
            console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n🔍 Checking users table structure...');
        
        const usersResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 users table columns:');
        usersResult.rows.forEach(row => {
            console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

checkTableStructure()
    .then(() => {
        console.log('\n✅ Table structure check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Table structure check failed:', error);
        process.exit(1);
    });
