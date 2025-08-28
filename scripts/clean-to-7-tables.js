const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanTo7Tables() {
    const client = await pool.connect();
    
    try {
        console.log('🧹 Cleaning database to 7 core tables...');
        
        await client.query('BEGIN');

        // Define the 7 core tables to keep (based on comprehensive database update)
        const coreTables = [
            'users',                    // Main user table
            'business_users',           // Business user details
            'bank_users',               // Bank user details  
            'admin_users',              // Admin users
            'pos_application',          // Main applications table (consolidated)
            'admin_sessions',           // Admin sessions
            'status_audit_log',         // Status change tracking
            'application_offers'        // Bank offers for applications
        ];

        // Get all current tables
        const allTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log(`📋 Found ${allTables.rows.length} tables in database`);
        
        // Find tables to drop
        const tablesToDrop = allTables.rows
            .map(row => row.table_name)
            .filter(tableName => !coreTables.includes(tableName));

        console.log(`🗑️  Tables to drop: ${tablesToDrop.length}`);
        console.log('Core tables to keep:');
        coreTables.forEach(table => console.log(`  ✅ ${table}`));

        if (tablesToDrop.length === 0) {
            console.log('✅ Database already has only core tables!');
            return;
        }

        // Drop tables in reverse dependency order
        console.log('\n🗑️  Dropping unnecessary tables...');
        
        for (const tableName of tablesToDrop) {
            try {
                console.log(`  Dropping ${tableName}...`);
                await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
                console.log(`  ✅ Dropped ${tableName}`);
            } catch (error) {
                console.log(`  ⚠️  Could not drop ${tableName}: ${error.message}`);
            }
        }

        // Verify final state
        const finalTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        console.log('\n📊 Final database state:');
        console.log(`Total tables: ${finalTables.rows.length}`);
        finalTables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        await client.query('COMMIT');
        
        console.log('\n🎉 Database cleaned to 7 core tables successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error cleaning database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the cleanup
if (require.main === module) {
    cleanTo7Tables()
        .then(() => {
            console.log('\n✅ Database cleanup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database cleanup failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanTo7Tables };
