#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function resetDatabasePool() {
    console.log('🔄 Resetting database connection pool...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('34.166.77.134') ? {
            rejectUnauthorized: false,
        } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        maxUses: 7500,
    });

    try {
        // Force close all connections
        await pool.end();
        console.log('✅ Database pool closed successfully');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create a new pool
        const newPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('34.166.77.134') ? {
                rejectUnauthorized: false,
            } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            maxUses: 7500,
        });
        
        // Test the new pool
        const client = await newPool.connect();
        try {
            const result = await client.query('SELECT NOW() as current_time');
            console.log('✅ New pool connection test successful');
            console.log('🕐 Current time:', result.rows[0].current_time);
        } finally {
            client.release();
        }
        
        await newPool.end();
        console.log('✅ Pool reset completed successfully');
        
    } catch (error) {
        console.error('❌ Error resetting database pool:', error.message);
    }
}

// Run the reset
resetDatabasePool().catch(console.error);
