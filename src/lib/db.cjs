// lib/db.cjs (CommonJS version)
const { Pool } = require('pg');

// Use DATABASE_URL if available, otherwise use direct connection parameters
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

const pool = new Pool({
  ...poolConfig,
  // Reduced connection pool limits to prevent exhaustion
  max: 20, // Reduced from 100 to 20 connections
  min: 5,  // Reduced from 20 to 5 minimum connections
  idleTimeoutMillis: 60000, // Reduced to 1 minute
  connectionTimeoutMillis: 15000, // Reduced timeout to 15 seconds
  maxUses: 100, // Reduced to prevent long-running connections
  allowExitOnIdle: true, // Allow the pool to exit when idle
  // Add connection retry logic
  retryDelay: 1000,
  maxRetries: 3, // Increased retries
});

// Built-in monitoring system
let monitoringInterval;
let lastWarningTime = 0;
const WARNING_COOLDOWN = 60000; // 60 seconds between warnings (increased from 30)

function startMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  monitoringInterval = setInterval(() => {
    const status = pool.getStatus();
    const now = Date.now();
    
    // Check for critical issues
    if (status.waitingCount > 0) {
      if (now - lastWarningTime > WARNING_COOLDOWN) {
        console.warn(`⚠️  DATABASE WARNING: ${status.waitingCount} requests waiting for connections`);
        console.warn(`   Pool status: ${status.totalCount}/${status.idleCount}/${status.waitingCount} (total/idle/waiting)`);
        lastWarningTime = now;
      }
    }
    
    if (status.totalCount >= status.max * 0.8) {
      if (now - lastWarningTime > WARNING_COOLDOWN) {
        console.warn(`⚠️  DATABASE WARNING: Pool at ${Math.round((status.totalCount / status.max) * 100)}% capacity`);
        console.warn(`   Pool status: ${status.totalCount}/${status.max} connections used`);
        lastWarningTime = now;
      }
    }
    
    // Log pool status every 10 minutes in development (reduced frequency)
    if (process.env.NODE_ENV === 'development' && now % 600000 < 5000) {
      console.log(`📊 Database pool status: ${status.totalCount}/${status.idleCount}/${status.waitingCount} (total/idle/waiting) - ${Math.round((status.totalCount / status.max) * 100)}% utilization`);
    }
  }, 30000); // Check every 30 seconds (increased from 10)
}

// Enhanced error handling and monitoring
pool.on('error', (err, client) => {
  console.error('❌ Database pool error:', err);
  
  // Auto-cleanup on critical errors
  if (err.code === '53300') {
    console.error('🚨 Connection pool exhausted - attempting cleanup...');
    setTimeout(() => {
      pool.cleanup().then(() => {
        console.log('✅ Pool cleanup completed after exhaustion');
      }).catch(cleanupError => {
        console.error('❌ Pool cleanup failed:', cleanupError);
      });
    }, 1000);
  }
  
  // Log to monitoring system
  if (process.env.NODE_ENV === 'production') {
    console.error('Database pool error details:', {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
  }
});

// Handle connection errors
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('❌ Database client error:', err);
  });
});

// Enhanced logging for monitoring (both development and production)
pool.on('acquire', (client) => {
  if (pool.totalCount > pool.options.max * 0.8) {
    console.log(`🔗 Database connection acquired. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount} (WARNING: Pool getting full)`);
  }
});

pool.on('release', (client) => {
  // Only log releases if there are waiting requests
  if (pool.waitingCount > 0) {
    console.log(`🔓 Database connection released. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
  }
});

// Add connection health check method
pool.healthCheck = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

// Connection management utility to ensure proper release
pool.withConnection = async (callback) => {
  const client = await pool.connect();
  try {
    const result = await callback(client);
    return result;
  } finally {
    client.release();
  }
};

// Get pool status for monitoring
pool.getStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    max: pool.options.max,
    min: pool.options.min
  };
};

// Force cleanup of idle connections
pool.cleanup = async () => {
  // Skip cleanup in production to prevent connection issues
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Database pool cleanup skipped in production environment');
    return;
  }
  
  try {
    await pool.end();
    console.log('🔧 Database pool cleanup completed');
  } catch (error) {
    console.error('❌ Database pool cleanup error:', error);
  }
};

// Emergency cleanup for connection exhaustion
pool.emergencyCleanup = async () => {
  // Skip emergency cleanup in production to prevent connection issues
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Emergency database pool cleanup skipped in production environment');
    return false;
  }
  
  try {
    console.log('🚨 Emergency database pool cleanup initiated...');
    
    // Force close all connections
    await pool.end();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recreate the pool
    const newPool = new Pool({
      ...poolConfig,
      max: 50, // Reasonable emergency limit
      min: 10,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
    });
    
    // Copy methods to new pool
    Object.assign(newPool, {
      withConnection: pool.withConnection,
      connectWithRetry: pool.connectWithRetry,
      getStatus: pool.getStatus,
      cleanup: pool.cleanup,
      emergencyCleanup: pool.emergencyCleanup,
      healthCheck: pool.healthCheck,
    });
    
    console.log('✅ Emergency pool cleanup completed');
    return newPool;
  } catch (error) {
    console.error('❌ Emergency pool cleanup failed:', error);
    throw error;
  }
};

// Add connection retry wrapper with exponential backoff
pool.connectWithRetry = async (maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.connect();
    } catch (error) {
      if (error.code === '53300' && attempt < maxRetries) {
        console.warn(`⚠️ Connection pool exhausted, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

// Start monitoring automatically
startMonitoring();

// Graceful shutdown - but don't close pool in production
process.on('SIGINT', () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  // Only close pool in development/test environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development environment: closing database pool on SIGINT');
    pool.end();
  } else {
    console.log('⚠️ Production environment: keeping database pool alive on SIGINT');
  }
});

process.on('SIGTERM', () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  // Only close pool in development/test environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development environment: closing database pool on SIGTERM');
    pool.end();
  } else {
    console.log('⚠️ Production environment: keeping database pool alive on SIGTERM');
  }
});

module.exports = pool;
