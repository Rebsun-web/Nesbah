import pool from '../src/lib/db.js';

async function testConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query test successful!');
        console.log(`   Current database time: ${result.rows[0].current_time}`);
        
        // Check if we can access the main tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('submitted_applications', 'pos_application', 'users', 'application_offers')
            ORDER BY table_name;
        `);
        
        console.log('✅ Table access test successful!');
        console.log('   Available tables:');
        for (const row of tablesResult.rows) {
            console.log(`   - ${row.table_name}`);
        }
        
        client.release();
        console.log('✅ Database connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Error details:', error);
    } finally {
        await pool.end();
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testConnection()
        .then(() => {
            console.log('Test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}
