// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabaseSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Checking database schema...\n');
        
        // Get all tables
        const tablesQuery = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Available tables:');
        console.log('=' .repeat(50));
        
        if (tablesQuery.rows.length === 0) {
            console.log('❌ No tables found in the database');
        } else {
            tablesQuery.rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.table_name}`);
            });
        }
        
        // Check for specific tables we need
        const requiredTables = ['applications', 'users', 'business_users', 'bank_users', 'application_offers'];
        console.log('\n🔍 Checking for required tables:');
        console.log('=' .repeat(50));
        
        for (const tableName of requiredTables) {
            const existsQuery = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [tableName]);
            
            const exists = existsQuery.rows[0].exists;
            console.log(`${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'MISSING'}`);
        }
        
        // If applications table doesn't exist, check what might be the correct name
        const applicationsExistsQuery = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'applications'
            )
        `);
        
        if (!applicationsExistsQuery.rows[0].exists) {
            console.log('\n🔍 Looking for application-related tables:');
            console.log('=' .repeat(50));
            
            const appTablesQuery = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%application%'
                ORDER BY table_name
            `);
            
            if (appTablesQuery.rows.length > 0) {
                appTablesQuery.rows.forEach(row => {
                    console.log(`📋 Found: ${row.table_name}`);
                });
            } else {
                console.log('❌ No application-related tables found');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking database schema:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    checkDatabaseSchema()
        .then(() => {
            console.log('\n✅ Database schema check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database schema check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkDatabaseSchema };
