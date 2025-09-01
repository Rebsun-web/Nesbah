// lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

// Use DATABASE_URL if available, otherwise use direct connection parameters
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('34.166.77.134') ? {
    rejectUnauthorized: false,
  } : (process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false),
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
  // Conservative connection pool configuration to prevent exhaustion
  max: 5, // Reduced from 10 to 5
  min: 1, // Reduced from 2 to 1
  idleTimeoutMillis: 10000, // Reduced from 30000 to 10000 (10 seconds)
  connectionTimeoutMillis: 5000, // Reduced from 10000 to 5000 (5 seconds)
  acquireTimeoutMillis: 10000, // Reduced from 15000 to 10000 (10 seconds)
  reapIntervalMillis: 1000, // Check for dead connections every second
  maxUses: 25, // Reduced from 50 to 25 - close connections after fewer queries
  allowExitOnIdle: true, // Allow the pool to exit when idle
  // Enhanced SSL configuration
  ssl: {
    ...poolConfig.ssl,
    checkServerIdentity: () => undefined, // Skip hostname verification
  }
});

// Enhanced error handling for pool events
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', {
    error: err.message,
    code: err.code,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  
  // Attempt to recover from pool errors
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
    console.warn('⚠️ Pool connection error detected, attempting recovery...');
    setTimeout(() => {
      pool.end().then(() => {
        console.log('🔧 Pool recovery completed');
      }).catch(recoveryError => {
        console.error('❌ Pool recovery failed:', recoveryError.message);
      });
    }, 5000);
  }
});

// Enhanced connection event handling
pool.on('connect', (client) => {
  console.log(`🔗 New database connection established. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
  
  // Set up client error handling
  client.on('error', (err) => {
    console.error('❌ Database client error:', {
      error: err.message,
      code: err.code,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Set up client end handling
  client.on('end', () => {
    console.log('🔓 Database client connection ended');
  });
});

// Enhanced pool event logging
pool.on('acquire', (client) => {
  console.log(`🔗 Database connection acquired. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
});

pool.on('release', (client) => {
  console.log(`🔓 Database connection released. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
});

// Enhanced monitoring with detailed metrics
const poolMetrics = {
  totalConnections: 0,
  failedConnections: 0,
  slowQueries: 0,
  queryTimeouts: 0,
  lastHealthCheck: Date.now()
};

// Monitor pool for potential issues with enhanced logging
setInterval(() => {
  const { totalCount, idleCount, waitingCount } = pool;
  
  // Update metrics
  poolMetrics.totalConnections = totalCount;
  
  // Warning thresholds
  if (waitingCount > 0) {
    console.warn(`⚠️ Database pool has ${waitingCount} waiting connections. Total: ${totalCount}, Idle: ${idleCount}`);
  }
  
  if (totalCount >= pool.options.max) {
    console.warn(`⚠️ Database pool at maximum capacity: ${totalCount}/${pool.options.max}`);
  }
  
  if (idleCount === 0 && waitingCount > 0) {
    console.warn(`⚠️ No idle connections available, ${waitingCount} requests waiting`);
  }
  
  // Log pool status every 5 minutes for monitoring
  if (Date.now() % 300000 < 30000) { // Every 5 minutes
    console.log(`📊 Database pool status:`, {
      total: totalCount,
      idle: idleCount,
      waiting: waitingCount,
      max: pool.options.max,
      min: pool.options.min,
      timestamp: new Date().toISOString()
    });
  }
}, 30000); // Check every 30 seconds

// Enhanced connection health check method
pool.healthCheck = async () => {
  const startTime = Date.now();
  
  try {
    const client = await pool.connectWithRetry();
    const result = await client.query('SELECT 1 as health_check');
    client.release();
    
    const responseTime = Date.now() - startTime;
    
    // Track slow queries
    if (responseTime > 1000) { // More than 1 second
      poolMetrics.slowQueries++;
      console.warn(`⚠️ Slow health check query: ${responseTime}ms`);
    }
    
    return { 
      healthy: true, 
      responseTime,
      timestamp: new Date().toISOString(),
      poolStatus: pool.getStatus()
    };
  } catch (error) {
    poolMetrics.failedConnections++;
    
    return { 
      healthy: false, 
      error: error.message, 
      code: error.code,
      timestamp: new Date().toISOString(),
      poolStatus: pool.getStatus()
    };
  }
};

// Enhanced connection management utility with timeout
pool.withConnection = async (callback, timeoutMs = 30000) => {
  const client = await pool.connectWithRetry();
  
  try {
    // Set query timeout
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    
    const result = await Promise.race([
      callback(client),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ]);
    
    return result;
  } catch (error) {
    if (error.message === 'Query timeout') {
      poolMetrics.queryTimeouts++;
      console.warn(`⏰ Query timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    client.release();
  }
};

// Enhanced connection management with retry and timeout
pool.withConnectionRetry = async (callback, maxRetries = 3, timeoutMs = 30000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await pool.withConnection(callback, timeoutMs);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries && pool.isRetryableError(error)) {
        console.warn(`⚠️ Connection attempt ${attempt} failed, retrying... (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
};

// Check if error is retryable
pool.isRetryableError = (error) => {
  const retryableCodes = [
    '53300', // connection slots are reserved
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    '57P01', // terminating connection due to administrator command
    '57P02'  // terminating connection due to crash
  ];
  
  return retryableCodes.includes(error.code) || 
         error.message.includes('connection slots are reserved') ||
         error.message.includes('timeout') ||
         error.message.includes('terminating connection');
};

// Get pool status for monitoring
pool.getStatus = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    max: pool.options.max,
    min: pool.options.min,
    metrics: { ...poolMetrics }
  };
};

// Get detailed pool metrics
pool.getMetrics = () => {
  return {
    ...poolMetrics,
    poolStatus: pool.getStatus(),
    timestamp: new Date().toISOString()
  };
};

// Force cleanup of idle connections
pool.cleanup = async () => {
  try {
    await pool.end();
    console.log('🔧 Database pool cleanup completed');
  } catch (error) {
    console.error('❌ Database pool cleanup error:', error);
  }
};

// Emergency connection reset function
pool.emergencyReset = async () => {
  try {
    console.log('🚨 Emergency database pool reset initiated...');
    
    // Force close all connections
    await pool.end();
    
    // Wait a moment for connections to fully close
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a new pool with the same configuration
    const newPool = new Pool({
      ...poolConfig,
      max: 3, // Even more conservative for emergency
      min: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 3000,
      acquireTimeoutMillis: 5000,
      maxUses: 10,
      allowExitOnIdle: true,
      ssl: {
        ...poolConfig.ssl,
        checkServerIdentity: () => undefined,
      }
    });
    
    // Copy all methods and properties to the new pool
    Object.assign(pool, newPool);
    
    console.log('✅ Emergency pool reset completed');
    return true;
  } catch (error) {
    console.error('❌ Emergency pool reset failed:', error);
    return false;
  }
};

// Enhanced connection request queue for high concurrency
let connectionQueue = [];
let isProcessingQueue = false;
let queueMetrics = {
  totalQueued: 0,
  totalProcessed: 0,
  averageWaitTime: 0,
  maxWaitTime: 0
};

const processConnectionQueue = async () => {
  if (isProcessingQueue || connectionQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (connectionQueue.length > 0) {
    const { resolve, reject, maxRetries, delay, timestamp } = connectionQueue.shift();
    
    try {
      const client = await pool.connect();
      const waitTime = Date.now() - timestamp;
      
      // Update queue metrics
      queueMetrics.totalProcessed++;
      queueMetrics.averageWaitTime = 
        (queueMetrics.averageWaitTime * (queueMetrics.totalProcessed - 1) + waitTime) / queueMetrics.totalProcessed;
      queueMetrics.maxWaitTime = Math.max(queueMetrics.maxWaitTime, waitTime);
      
      resolve(client);
    } catch (error) {
      if (pool.isRetryableError(error) && maxRetries > 0) {
        console.warn(`⚠️ Connection pool exhausted, queuing retry in ${delay}ms`);
        setTimeout(() => {
          connectionQueue.push({ resolve, reject, maxRetries: maxRetries - 1, delay: delay * 2, timestamp });
          processConnectionQueue();
        }, delay);
      } else {
        console.error('❌ Database connection error:', error.message);
        reject(error);
      }
    }
  }
  
  isProcessingQueue = false;
};

// Enhanced connection retry wrapper with queue and metrics
pool.connectWithRetry = async (maxRetries = 2, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    
    // Try to get a connection immediately first
    pool.connect().then(resolve).catch((error) => {
      if (pool.isRetryableError(error)) {
        console.warn(`⚠️ Connection pool exhausted, queuing retry...`);
        queueMetrics.totalQueued++;
        connectionQueue.push({ resolve, reject, maxRetries, delay, timestamp });
        processConnectionQueue();
      } else {
        reject(error);
      }
    });
  });
};

// Get queue metrics
pool.getQueueMetrics = () => {
  return {
    ...queueMetrics,
    currentQueueLength: connectionQueue.length,
    isProcessing: isProcessingQueue,
    timestamp: new Date().toISOString()
  };
};

export default pool;
