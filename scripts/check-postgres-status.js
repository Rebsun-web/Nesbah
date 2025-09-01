#!/usr/bin/env node

// PostgreSQL server status check script
import pool from '../src/lib/db.js';

async function checkPostgresStatus() {
    console.log('🔍 Checking PostgreSQL server status...\n');
    
    try {
        // Try to get a simple connection to check server status
        console.log('1️⃣ Attempting to connect to PostgreSQL...');
        
        const client = await pool.connect();
        console.log('✅ Successfully connected to PostgreSQL');
        
        // Check current connections
        console.log('\n2️⃣ Checking current connections...');
        const result = await client.query(`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections,
                count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
                count(*) FILTER (WHERE state = 'waiting') as waiting_connections,
                setting as max_connections
            FROM pg_stat_activity 
            CROSS JOIN pg_settings 
            WHERE name = 'max_connections'
            GROUP BY setting
        `);
        
        if (result.rows.length > 0) {
            const stats = result.rows[0];
            console.log('📊 Connection Statistics:');
            console.log(`   Total connections: ${stats.total_connections}`);
            console.log(`   Active connections: ${stats.active_connections}`);
            console.log(`   Idle connections: ${stats.idle_connections}`);
            console.log(`   Idle in transaction: ${stats.idle_in_transaction}`);
            console.log(`   Waiting connections: ${stats.waiting_connections}`);
            console.log(`   Max connections: ${stats.max_connections}`);
            
            const utilization = (parseInt(stats.total_connections) / parseInt(stats.max_connections)) * 100;
            console.log(`   Utilization: ${utilization.toFixed(1)}%`);
            
            if (utilization > 90) {
                console.log('\n⚠️  WARNING: High connection utilization detected!');
                console.log('   This may cause the "connection slots reserved" error.');
            }
        }
        
        // Check for long-running queries
        console.log('\n3️⃣ Checking for long-running queries...');
        const longQueries = await client.query(`
            SELECT 
                pid,
                usename,
                application_name,
                client_addr,
                state,
                query_start,
                now() - query_start as duration,
                query
            FROM pg_stat_activity 
            WHERE state = 'active' 
              AND now() - query_start > interval '5 seconds'
            ORDER BY duration DESC
        `);
        
        if (longQueries.rows.length > 0) {
            console.log(`⚠️  Found ${longQueries.rows.length} long-running queries:`);
            longQueries.rows.forEach((query, index) => {
                console.log(`   ${index + 1}. PID ${query.pid} - ${query.duration} - ${query.query.substring(0, 100)}...`);
            });
        } else {
            console.log('✅ No long-running queries found');
        }
        
        // Check for idle transactions
        console.log('\n4️⃣ Checking for idle transactions...');
        const idleTransactions = await client.query(`
            SELECT 
                pid,
                usename,
                application_name,
                client_addr,
                xact_start,
                now() - xact_start as duration,
                query
            FROM pg_stat_activity 
            WHERE state = 'idle in transaction' 
              AND xact_start IS NOT NULL
            ORDER BY duration DESC
        `);
        
        if (idleTransactions.rows.length > 0) {
            console.log(`⚠️  Found ${idleTransactions.rows.length} idle transactions:`);
            idleTransactions.rows.forEach((tx, index) => {
                console.log(`   ${index + 1}. PID ${tx.pid} - ${tx.duration} - ${tx.query.substring(0, 100)}...`);
            });
        } else {
            console.log('✅ No idle transactions found');
        }
        
        client.release();
        
        console.log('\n✅ PostgreSQL status check completed');
        
        // Provide recommendations
        console.log('\n💡 Recommendations:');
        if (longQueries.rows.length > 0) {
            console.log('   - Consider terminating long-running queries if they are stuck');
            console.log('   - Review query performance and add timeouts');
        }
        if (idleTransactions.rows.length > 0) {
            console.log('   - Consider terminating idle transactions');
            console.log('   - Review application code for missing transaction commits/rollbacks');
        }
        console.log('   - Ensure proper connection cleanup in your application');
        console.log('   - Consider increasing max_connections if needed');
        
    } catch (error) {
        console.error('❌ Failed to check PostgreSQL status:', error.message);
        
        if (error.code === '53300') {
            console.log('\n🚨 CRITICAL: Connection slots exhausted!');
            console.log('   All available connections are reserved for privileged roles.');
            console.log('\n💡 Solutions:');
            console.log('   1. Restart your PostgreSQL server');
            console.log('   2. Check for stuck connections and terminate them');
            console.log('   3. Increase max_connections in postgresql.conf');
            console.log('   4. Ensure your application properly closes connections');
        }
    }
}

// Run status check
checkPostgresStatus().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Status check failed:', error);
    process.exit(1);
});
