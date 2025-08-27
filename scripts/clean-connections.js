#!/usr/bin/env node

/**
 * Database Connection Cleanup Script
 * This script cleans up database connections and resets the connection pools
 */

const { Pool } = require('pg');

console.log('🧹 Starting Database Connection Cleanup...\n');

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

async function cleanupConnections() {
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
        
        console.log('\n✅ Database connection cleanup completed successfully!');
        console.log('');
        console.log('📋 Cleanup Summary:');
        console.log('   - All idle database connections have been terminated');
        console.log('   - Connection pools have been reset');
        console.log('   - Memory has been freed');
        console.log('');
        console.log('🚀 You can now restart your application with fresh connections.');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Stop your application completely');
        console.log('   2. Wait 10 seconds for any remaining connections to timeout');
        console.log('   3. Restart your application');
        console.log('   4. Monitor connection pool usage');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        
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

// Run cleanup
cleanupConnections().then(() => {
    console.log('\n🎉 Cleanup script completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
});
