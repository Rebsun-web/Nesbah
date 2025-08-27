#!/usr/bin/env node

/**
 * Database Connection Monitor Script
 * Use this script to monitor database connections
 */

const { Pool } = require('pg');

console.log('📊 Database Connection Monitor...\n');

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

async function monitorConnections() {
    let tempPool = null;
    
    try {
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
                application_name,
                client_addr,
                backend_start
            FROM pg_stat_activity 
            WHERE datname = current_database()
            GROUP BY state, application_name, client_addr, backend_start
            ORDER BY count(*) DESC
        `);
        
        console.log('\n📋 Current Database Connections:');
        console.log('─'.repeat(80));
        console.log('State\t\t| Count\t| Application\t\t| Client IP\t\t| Started');
        console.log('─'.repeat(80));
        
        result.rows.forEach(row => {
            const state = row.state || 'unknown';
            const count = row.active_connections;
            const app = row.application_name || 'unknown';
            const ip = row.client_addr || 'localhost';
            const started = row.backend_start ? new Date(row.backend_start).toLocaleTimeString() : 'unknown';
            
            console.log(`${state.padEnd(12)}\t| ${count}\t| ${app.padEnd(20)}\t| ${ip.padEnd(15)}\t| ${started}`);
        });
        
        console.log('─'.repeat(80));
        
        // Get total connection count
        const totalResult = await client.query(`
            SELECT count(*) as total_connections
            FROM pg_stat_activity 
            WHERE datname = current_database()
        `);
        
        console.log(`\n📈 Total Connections: ${totalResult.rows[0].total_connections}`);
        
        // Check for long-running queries
        const longRunningResult = await client.query(`
            SELECT 
                pid,
                now() - pg_stat_activity.query_start AS duration,
                query
            FROM pg_stat_activity 
            WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
            AND state = 'active'
        `);
        
        if (longRunningResult.rows.length > 0) {
            console.log('\n⚠️  Long-running queries detected:');
            longRunningResult.rows.forEach(row => {
                console.log(`   PID ${row.pid}: ${row.duration} - ${row.query.substring(0, 100)}...`);
            });
        }
        
        client.release();
        await tempPool.end();
        
        console.log('\n✅ Connection monitoring completed');
        
    } catch (error) {
        console.error('❌ Error during monitoring:', error.message);
        
        if (tempPool) {
            try {
                await tempPool.end();
            } catch (endError) {
                console.error('❌ Failed to end temporary pool:', endError.message);
            }
        }
        
        process.exit(1);
    }
}

// Run monitoring
monitorConnections().then(() => {
    console.log('\n🎉 Monitoring script completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Monitoring script failed:', error);
    process.exit(1);
});
