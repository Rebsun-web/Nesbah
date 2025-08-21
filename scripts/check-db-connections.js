#!/usr/bin/env node

const { Pool } = require('pg');

async function checkDatabaseConnections() {
    const pool = new Pool({
        host: '34.166.77.134',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Riyadh123!@#',
        ssl: {
            rejectUnauthorized: false,
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxUses: 7500,
    });

    try {
        console.log('🔍 Checking database connections...');
        
        // Get pool status
        const poolStatus = {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
        
        console.log('📊 Pool Status:', poolStatus);
        
        if (poolStatus.totalCount > 15) {
            console.log('⚠️  Warning: High connection count detected!');
        }
        
        if (poolStatus.waitingCount > 0) {
            console.log('⚠️  Warning: Connections are waiting!');
        }
        
        // Test a simple query
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT NOW() as current_time, version() as db_version');
            console.log('✅ Database connection test successful');
            console.log('🕐 Current time:', result.rows[0].current_time);
            console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
        } finally {
            client.release();
        }
        
        // Check active connections in PostgreSQL
        const adminClient = await pool.connect();
        try {
            const connectionsResult = await adminClient.query(`
                SELECT 
                    state,
                    COUNT(*) as count,
                    MAX(backend_start) as oldest_connection
                FROM pg_stat_activity 
                WHERE datname = current_database()
                GROUP BY state
                ORDER BY count DESC
            `);
            
            console.log('\n📈 Active PostgreSQL Connections:');
            connectionsResult.rows.forEach(row => {
                console.log(`  ${row.state || 'unknown'}: ${row.count} connections`);
                if (row.oldest_connection) {
                    console.log(`    Oldest: ${row.oldest_connection}`);
                }
            });
            
        } finally {
            adminClient.release();
        }
        
    } catch (error) {
        console.error('❌ Error checking database connections:', error.message);
    } finally {
        await pool.end();
    }
}

// Run the check
checkDatabaseConnections().catch(console.error);
