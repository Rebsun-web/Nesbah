require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkBusinessUsersStructure() {
    console.log('🔍 Checking business_users table structure...');
    
    const client = await pool.connect();
    
    try {
        // Get column information for business_users table
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'business_users' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 business_users table columns:');
        console.log('==================================================');
        
        if (result.rows.length === 0) {
            console.log('❌ No columns found in business_users table');
        } else {
            result.rows.forEach((column, index) => {
                console.log(`${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
                if (column.column_default) {
                    console.log(`   Default: ${column.column_default}`);
                }
            });
        }
        
        // Also check a sample record to see what data is actually stored
        console.log('\n📋 Sample business_users record:');
        console.log('==================================================');
        
        const sampleResult = await client.query(`
            SELECT * FROM business_users LIMIT 1
        `);
        
        if (sampleResult.rows.length > 0) {
            const sample = sampleResult.rows[0];
            Object.keys(sample).forEach(key => {
                console.log(`${key}: ${sample[key]}`);
            });
        } else {
            console.log('❌ No records found in business_users table');
        }
        
    } catch (error) {
        console.error('❌ Error checking business_users structure:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkBusinessUsersStructure();
