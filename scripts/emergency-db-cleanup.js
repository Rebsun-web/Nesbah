#!/usr/bin/env node

/**
 * Emergency Database Cleanup Script
 * Use this script when experiencing connection pool exhaustion
 */

const { Pool } = require('pg');

console.log('🚨 Emergency Database Connection Cleanup...\n');

// Database configuration
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
} : {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function emergencyCleanup() {
    let tempPool = null;
    
    try {
        console.log('📊 Checking current database connections...');
        
        // Create a temporary pool to check connection status
        tempPool = new Pool({
            ...poolConfig,
            max: 1,
            min: 0,
            idleTimeoutMillis: 5000,
            connectionTimeoutMillis: 5000,
        });
        
        // Test connection
        const client = await tempPool.connect();
        console.log('✅ Database is accessible');
        
        // Check active connections
        const result = await client.query(`
            SELECT 
                count(*) as active_connections,
                state,
                application_name
            FROM pg_stat_activity 
            WHERE datname = current_database()
            GROUP BY state, application_name
            ORDER BY count(*) DESC
        `);
        
        console.log('\n📋 Current Database Connections:');
        result.rows.forEach(row => {
            console.log(`   ${row.state}: ${row.active_connections} connections (${row.application_name || 'unknown'})`);
        });
        
        client.release();
        
        console.log('\n🔧 Terminating idle connections...');
        
        // Terminate idle connections (be careful with this in production)
        const cleanupClient = await tempPool.connect();
        const cleanupResult = await cleanupClient.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = current_database()
            AND pid <> pg_backend_pid()
            AND state = 'idle'
            AND state_change < current_timestamp - INTERVAL '5 minutes'
        `);
        
        console.log(`✅ Terminated ${cleanupResult.rowCount} idle connections`);
        cleanupClient.release();
        
        console.log('\n🧹 Cleaning up temporary pool...');
        await tempPool.end();
        
        console.log('\n✅ Emergency cleanup completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Restart your application');
        console.log('   2. Monitor connection pool usage');
        console.log('   3. Consider adjusting pool settings if needed');
        
    } catch (error) {
        console.error('❌ Emergency cleanup failed:', error.message);
        
        if (tempPool) {
            try {
                await tempPool.end();
            } catch (endError) {
                console.error('❌ Failed to end temporary pool:', endError.message);
            }
        }
        
        console.log('\n💡 Manual Recovery Steps:');
        console.log('   1. Stop your application completely');
        console.log('   2. Wait 30 seconds for connections to timeout');
        console.log('   3. Restart your application');
        console.log('   4. Monitor for connection issues');
        
        process.exit(1);
    }
}

// Run emergency cleanup
emergencyCleanup().then(() => {
    console.log('\n🎉 Emergency cleanup script completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Emergency cleanup script failed:', error);
    process.exit(1);
});
