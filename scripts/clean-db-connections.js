const { Pool } = require('pg');

// Database connection configuration
const config = {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  // Force new connections
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
  max: 1, // Limit to 1 connection for cleanup
};

async function cleanDatabaseConnections() {
  console.log('🧹 Starting database connection cleanup...');
  
  let pool = null;
  
  try {
    // Create a minimal pool for cleanup
    pool = new Pool(config);
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database for cleanup');
    
    // Kill all active connections except our own
    const killQuery = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state = 'active';
    `;
    
    const result = await client.query(killQuery);
    console.log(`🔪 Terminated ${result.rowCount} active connections`);
    
    // Get connection count
    const countQuery = `
      SELECT count(*) as active_connections
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    
    const countResult = await client.query(countQuery);
    console.log(`📊 Current active connections: ${countResult.rows[0].active_connections}`);
    
    // Reset connection pool settings
    const resetQuery = `
      SELECT pg_reload_conf();
    `;
    
    try {
      await client.query(resetQuery);
      console.log('🔄 Reloaded PostgreSQL configuration');
    } catch (error) {
      console.log('⚠️ Could not reload config (this is normal for non-superuser)');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    
    if (error.code === '53300') {
      console.log('🚨 Connection pool exhausted - trying alternative cleanup method...');
      
      // Try to connect with different credentials or wait for connections to timeout
      console.log('⏳ Waiting for connections to timeout...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const retryPool = new Pool({
          ...config,
          max: 1,
          connectionTimeoutMillis: 30000,
        });
        
        const retryClient = await retryPool.connect();
        console.log('✅ Successfully connected after retry');
        retryClient.release();
        await retryPool.end();
        
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError.message);
      }
    }
    
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Cleanup pool closed');
    }
  }
  
  console.log('✨ Database connection cleanup completed');
}

// Also create a function to reset the application's connection pool
async function resetApplicationPool() {
  console.log('🔄 Resetting application connection pool...');
  
  try {
    // This would typically be called from your main application
    // to reset the global connection pool
    if (global.dbPool) {
      await global.dbPool.end();
      global.dbPool = null;
      console.log('✅ Application pool reset');
    } else {
      console.log('ℹ️ No global pool found to reset');
    }
  } catch (error) {
    console.error('❌ Error resetting application pool:', error.message);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanDatabaseConnections()
    .then(() => {
      console.log('🎉 Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanDatabaseConnections,
  resetApplicationPool
};
