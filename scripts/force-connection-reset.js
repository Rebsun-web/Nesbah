#!/usr/bin/env node

// Force connection reset script
import pkg from 'pg';
const { Client } = pkg;

async function forceConnectionReset() {
    console.log('🔄 Force Connection Reset Script\n');
    
    // Try to connect with different strategies
    const strategies = [
        {
            name: 'Connection with application_name to identify our connections',
            config: {
                host: '34.166.77.134',
                port: 5432,
                database: 'postgres',
                user: 'postgres',
                password: 'Riyadh123!@#',
                ssl: { rejectUnauthorized: false },
                application_name: 'nesbah_emergency_reset',
                connectionTimeoutMillis: 10000,
                statement_timeout: 5000
            }
        },
        {
            name: 'Connection with specific client encoding',
            config: {
                host: '34.166.77.134',
                port: 5432,
                database: 'postgres',
                user: 'postgres',
                password: 'Riyadh123!@#',
                ssl: { rejectUnauthorized: false },
                client_encoding: 'UTF8',
                connectionTimeoutMillis: 10000
            }
        },
        {
            name: 'Connection with minimal SSL',
            config: {
                host: '34.166.77.134',
                port: 5432,
                database: 'postgres',
                user: 'postgres',
                password: 'Riyadh123!@#',
                ssl: false,
                connectionTimeoutMillis: 15000
            }
        }
    ];

    for (const strategy of strategies) {
        console.log(`\n🔌 Trying: ${strategy.name}`);
        
        try {
            const client = new Client(strategy.config);
            
            // Try to connect
            await client.connect();
            console.log('✅ Connection successful!');
            
            try {
                // Try to get server info
                const versionResult = await client.query('SELECT version() as version');
                console.log(`   Server: ${versionResult.rows[0].version}`);
                
                // Check if we can see other connections
                const connectionsResult = await client.query(`
                    SELECT 
                        pid,
                        usename,
                        application_name,
                        client_addr,
                        state,
                        query_start,
                        now() - query_start as duration
                    FROM pg_stat_activity 
                    WHERE state IN ('active', 'idle', 'idle in transaction')
                    ORDER BY state, duration DESC
                    LIMIT 10
                `);
                
                console.log(`\n📊 Current Connections (${connectionsResult.rows.length}):`);
                connectionsResult.rows.forEach((conn, index) => {
                    console.log(`   ${index + 1}. PID ${conn.pid} - ${conn.state} - ${conn.usename} - ${conn.application_name || 'N/A'}`);
                    if (conn.duration) {
                        console.log(`      Duration: ${conn.duration}`);
                    }
                });
                
                // Try to terminate our own old connections if any
                try {
                    const terminateResult = await client.query(`
                        SELECT pg_terminate_backend(pid) 
                        FROM pg_stat_activity 
                        WHERE application_name = 'nesbah_emergency_reset'
                          AND pid <> pg_backend_pid()
                    `);
                    
                    if (terminateResult.rowCount > 0) {
                        console.log(`\n🧹 Terminated ${terminateResult.rowCount} old emergency connections`);
                    }
                } catch (terminateError) {
                    console.log('   Could not terminate connections (insufficient privileges)');
                }
                
                // Try to set some connection parameters
                try {
                    await client.query('SET statement_timeout = 30000');
                    await client.query('SET idle_in_transaction_session_timeout = 30000');
                    console.log('   Set connection timeouts successfully');
                } catch (setError) {
                    console.log('   Could not set connection parameters');
                }
                
                console.log('\n🎉 SUCCESS: Database is now accessible!');
                console.log('💡 You can now restart your application');
                
                await client.end();
                return;
                
            } catch (queryError) {
                console.log('⚠️  Query failed:', queryError.message);
                await client.end();
            }
            
        } catch (error) {
            console.log(`❌ Connection failed: ${error.message}`);
            
            if (error.code === '53300') {
                console.log('   → Connection slots still exhausted');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   → Connection refused');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   → Connection timeout');
            }
        }
    }
    
    // If all strategies failed
    console.log('\n🚨 ALL CONNECTION STRATEGIES FAILED');
    console.log('\n💡 SERVER RESTART REQUIRED');
    console.log('   The PostgreSQL server at 34.166.77.134 needs to be restarted.');
    console.log('\n🔧 Contact your server administrator to:');
    console.log('   1. Restart PostgreSQL service');
    console.log('   2. Check server resources (CPU, memory, disk)');
    console.log('   3. Review PostgreSQL configuration');
    console.log('   4. Check for stuck processes');
    
    console.log('\n📊 Alternative Solutions:');
    console.log('   - Use a different database server temporarily');
    console.log('   - Implement connection pooling (pgBouncer)');
    console.log('   - Increase max_connections in postgresql.conf');
    console.log('   - Optimize application connection usage');
}

// Run force reset
forceConnectionReset().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('❌ Force reset failed:', error);
    process.exit(1);
});
