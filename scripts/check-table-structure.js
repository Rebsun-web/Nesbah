const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTableStructure() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking application_offers table structure...\n');
        
        // Get table structure
        const structure = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'application_offers'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 application_offers table columns:');
        structure.rows.forEach((column, index) => {
            console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
            if (column.column_default) {
                console.log(`     Default: ${column.column_default}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
checkTableStructure()
    .then(() => {
        console.log('\n✅ Table structure check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Table structure check failed:', error);
        process.exit(1);
    });
