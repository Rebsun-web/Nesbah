const { Pool } = require('pg');

// Database connection configuration
const config = {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
};

async function forceDatabaseReset() {
  console.log('🚨 FORCE DATABASE RESET - Starting aggressive cleanup...');
  
  // Method 1: Try to connect with minimal settings
  console.log('🔧 Method 1: Minimal connection attempt...');
  
  try {
    const minimalPool = new Pool({
      ...config,
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000,
    });
    
    const client = await minimalPool.connect();
    console.log('✅ Minimal connection successful');
    
    // Force terminate ALL connections (including idle ones)
    const forceKillQuery = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND pid <> pg_backend_pid();
    `;
    
    const result = await client.query(forceKillQuery);
    console.log(`💀 Force terminated ${result.rowCount} connections`);
    
    client.release();
    await minimalPool.end();
    
  } catch (error) {
    console.log(`❌ Method 1 failed: ${error.message}`);
  }
  
  // Method 2: Wait and retry with different approach
  console.log('⏳ Method 2: Waiting for connections to timeout...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  try {
    const retryPool = new Pool({
      ...config,
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 5000,
    });
    
    const retryClient = await retryPool.connect();
    console.log('✅ Retry connection successful');
    
    // Check current connection status
    const statusQuery = `
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    
    const status = await retryClient.query(statusQuery);
    console.log('📊 Connection status:', status.rows[0]);
    
    retryClient.release();
    await retryPool.end();
    
  } catch (error) {
    console.log(`❌ Method 2 failed: ${error.message}`);
  }
  
  // Method 3: Try to restart the application's connection pool
  console.log('🔄 Method 3: Attempting to reset application pool...');
  
  try {
    // This simulates what would happen when restarting the app
    if (global.dbPool) {
      console.log('🔄 Found global pool, attempting to end it...');
      await global.dbPool.end();
      global.dbPool = null;
      console.log('✅ Global pool reset');
    }
    
    // Clear any cached connections
    if (global.pgPool) {
      console.log('🔄 Found pg pool, attempting to end it...');
      await global.pgPool.end();
      global.pgPool = null;
      console.log('✅ Pg pool reset');
    }
    
  } catch (error) {
    console.log(`⚠️ Method 3 warning: ${error.message}`);
  }
  
  // Method 4: Final connection test
  console.log('🧪 Method 4: Final connection test...');
  
  try {
    const finalPool = new Pool({
      ...config,
      max: 2,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000,
    });
    
    const finalClient = await finalPool.connect();
    console.log('✅ Final connection test successful');
    
    // Test a simple query
    const testResult = await finalClient.query('SELECT NOW() as current_time');
    console.log('⏰ Database time:', testResult.rows[0].current_time);
    
    finalClient.release();
    await finalPool.end();
    
    console.log('🎉 FORCE RESET COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('💥 Final connection test failed:', error.message);
    console.log('🚨 Database may still be in a problematic state');
    console.log('💡 Consider restarting the database server or application');
  }
}

// Run the force reset
if (require.main === module) {
  forceDatabaseReset()
    .then(() => {
      console.log('✨ Force reset script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Force reset script failed:', error);
      process.exit(1);
    });
}

module.exports = { forceDatabaseReset };
