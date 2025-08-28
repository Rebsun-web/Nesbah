#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const pool = require('../src/lib/db.cjs');

async function resetDatabasePool() {
    console.log('🔧 Resetting Database Connection Pool...\n');
    
    try {
        // Get current pool status
        const status = pool.getStatus();
        console.log('📊 Current pool status:', status);
        
        // Force cleanup of all connections
        console.log('🔄 Cleaning up pool...');
        await pool.cleanup();
        
        console.log('✅ Database pool reset completed');
        console.log('💡 You may need to restart your application for the changes to take effect');
        
    } catch (error) {
        console.error('❌ Error resetting database pool:', error);
    }
}

async function checkDatabaseConnections() {
    console.log('🔍 Checking database connection status...');
    
    const client = await pool.connect();
    
    try {
        // Check active connections
        const result = await client.query(`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections,
                count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
                count(*) FILTER (WHERE state = 'disabled') as disabled_connections
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);
        
        const stats = result.rows[0];
        console.log('\n📊 Database Connection Statistics:');
        console.log(`  Total connections: ${stats.total_connections}`);
        console.log(`  Active connections: ${stats.active_connections}`);
        console.log(`  Idle connections: ${stats.idle_connections}`);
        console.log(`  Idle in transaction: ${stats.idle_in_transaction}`);
        console.log(`  Disabled connections: ${stats.disabled_connections}`);
        
        // Check max connections setting
        const maxConnResult = await client.query('SHOW max_connections');
        const maxConnections = maxConnResult.rows[0].max_connections;
        console.log(`\n⚙️  Max connections setting: ${maxConnections}`);
        
        // Check reserved connections
        const reservedResult = await client.query('SHOW superuser_reserved_connections');
        const reservedConnections = reservedResult.rows[0].superuser_reserved_connections;
        console.log(`  Reserved connections: ${reservedConnections}`);
        
        const availableConnections = maxConnections - reservedConnections;
        console.log(`  Available connections: ${availableConnections}`);
        
        if (stats.total_connections >= availableConnections) {
            console.log('\n⚠️  WARNING: Database is at or near connection limit!');
            console.log('💡 Consider:');
            console.log('  1. Restarting your application');
            console.log('  2. Checking for connection leaks');
            console.log('  3. Reducing connection pool size');
        }
        
    } catch (error) {
        console.error('❌ Error checking database connections:', error);
    } finally {
        client.release();
    }
}

async function killIdleConnections() {
    console.log('🗑️  Killing idle database connections...');
    
    const client = await pool.connect();
    
    try {
        // Kill idle connections (be careful with this in production!)
        const result = await client.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = current_database()
            AND state = 'idle'
            AND pid <> pg_backend_pid()
        `);
        
        console.log(`✅ Terminated ${result.rowCount} idle connections`);
        
    } catch (error) {
        console.error('❌ Error killing idle connections:', error);
    } finally {
        client.release();
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'check';
    
    switch (command) {
        case 'reset':
            await resetDatabasePool();
            break;
        case 'kill':
            await killIdleConnections();
            break;
        case 'check':
        default:
            await checkDatabaseConnections();
            break;
    }
    
    await pool.end();
}

if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Database pool management completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database pool management failed:', error);
            process.exit(1);
        });
}

module.exports = { resetDatabasePool, checkDatabaseConnections, killIdleConnections };
