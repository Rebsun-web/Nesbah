const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nesbah',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
});

async function checkOffersSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking application_offers table schema...');
        
        // Check table structure
        const tableInfo = await client.query(`
            SELECT 
                column_name,
                data_type,
                numeric_precision,
                numeric_scale,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'application_offers'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Table structure:');
        tableInfo.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Check constraints
        const constraints = await client.query(`
            SELECT 
                conname,
                pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'application_offers'::regclass
        `);
        
        console.log('\n🔒 Constraints:');
        constraints.rows.forEach(row => {
            console.log(`  ${row.conname}: ${row.definition}`);
        });
        
    } catch (error) {
        console.error('❌ Error checking schema:', error);
    } finally {
        client.release();
    }
}

checkOffersSchema().then(() => {
    console.log('✅ Schema check complete');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
