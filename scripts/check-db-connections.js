#!/usr/bin/env node

const { Pool } = require('pg');

// Create a temporary pool for checking connections
const tempPool = new Pool({
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1, // Use only 1 connection for this check
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

async function checkDatabaseConnections() {
  console.log('🔍 Checking database connection limits...');
  
  try {
    const client = await tempPool.connect();
    
    // Check current connection limits
    const result = await client.query(`
      SELECT 
        name,
        setting,
        unit,
        context,
        category
      FROM pg_settings 
      WHERE name IN (
        'max_connections',
        'shared_preload_libraries',
        'tcp_keepalives_idle',
        'tcp_keepalives_interval',
        'tcp_keepalives_count'
      )
      ORDER BY name;
    `);
    
    console.log('\n📊 PostgreSQL Connection Settings:');
    result.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.setting}${row.unit ? ' ' + row.unit : ''}`);
    });
    
    // Check current connection count
    const connResult = await client.query(`
      SELECT 
        count(*) as active_connections,
        count(*) FILTER (WHERE state = 'active') as active_queries,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `);
    
    console.log('\n🔗 Current Connection Status:');
    const conn = connResult.rows[0];
    console.log(`  Total connections: ${conn.active_connections}`);
    console.log(`  Active queries: ${conn.active_queries}`);
    console.log(`  Idle connections: ${conn.idle_connections}`);
    console.log(`  Idle in transaction: ${conn.idle_in_transaction}`);
    
    client.release();
    
    console.log('\n✅ Database connection check completed');
    
  } catch (error) {
    console.error('❌ Error checking database connections:', error.message);
  } finally {
    await tempPool.end();
  }
}

checkDatabaseConnections();
