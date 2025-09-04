// lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

// Check if we're in a build environment
const isBuildEnvironment = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

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
  // Production-optimized connection pool configuration
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Higher limit for production
  min: process.env.NODE_ENV === 'production' ? 3 : 2, // More baseline connections in production
  idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 60000 : 30000, // Longer idle time in production
  connectionTimeoutMillis: 10000, // 10 seconds to establish connection
  acquireTimeoutMillis: 20000, // 20 seconds to acquire connection (increased for production)
  reapIntervalMillis: 1000, // Check for dead connections every second
  maxUses: process.env.NODE_ENV === 'production' ? 100 : 50, // More uses per connection in production
  allowExitOnIdle: process.env.NODE_ENV !== 'production', // Don't exit on idle in production
  // Enhanced SSL configuration
  ssl: {
    ...poolConfig.ssl,
    checkServerIdentity: () => undefined, // Skip hostname verification
  }
});

// Add safeguard to prevent multiple pool.end() calls
let isPoolEnding = false;
const originalEnd = pool.end.bind(pool);

pool.end = async function() {
  console.log('🔍 DEBUG: pool.end() called', {
    isBuildEnvironment,
    nodeEnv: process.env.NODE_ENV,
    isPoolEnding,
    timestamp: new Date().toISOString(),
    stack: new Error().stack?.split('\n').slice(1, 4)
  });
  
  // Skip pool.end() calls during build process
  if (isBuildEnvironment) {
    console.log('⚠️ Pool.end() skipped during build process');
    return Promise.resolve();
  }
  
  // Skip pool.end() calls in production to prevent connection issues
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Pool.end() skipped in production environment to maintain connections');
    return Promise.resolve();
  }
  
  if (isPoolEnding) {
    console.log('⚠️ Pool.end() called multiple times, ignoring duplicate call');
    return Promise.resolve();
  }
  
  isPoolEnding = true;
  console.log('🔧 Pool.end() called, closing all connections...');
  
  try {
    await originalEnd();
    console.log('✅ Pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing pool:', error.message);
    // Reset flag on error so future calls can retry
    isPoolEnding = false;
    throw error;
  }
};

// Enhanced error handling for pool events
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', {
    error: err.message,
    code: err.code,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  
  // Attempt to recover from pool errors without closing the pool
  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
    console.warn('⚠️ Pool connection error detected, attempting recovery without pool closure...');
    // Don't close the pool, just log the error and let it recover naturally
    console.log('🔧 Pool will attempt to recover connections naturally');
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
  lastHealthCheck: Date.now(),
  connectionLeaks: 0,
  activeConnections: 0
};

// Connection leak detection and cleanup
let connectionTracker = new Map();
let cleanupInterval;

// Start connection monitoring
const startConnectionMonitoring = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const maxConnectionAge = 2 * 60 * 1000; // Reduced from 5 minutes to 2 minutes
    
    // Check for stale connections
    for (const [connectionId, connection] of connectionTracker.entries()) {
      if (now - connection.acquiredAt > maxConnectionAge) {
        console.warn(`⚠️ Potential connection leak detected: ${connection.taskName} (${connectionId})`);
        poolMetrics.connectionLeaks++;
        
        // Force release the connection
        try {
          if (connection.client && typeof connection.client.release === 'function') {
            connection.client.release();
          }
        } catch (error) {
          console.error('❌ Error force releasing leaked connection:', error.message);
        }
        
        connectionTracker.delete(connectionId);
      }
    }
    
    // Update metrics
    poolMetrics.activeConnections = connectionTracker.size;
    poolMetrics.lastHealthCheck = now;
    
    // Log pool status every 2 minutes (reduced from 5)
    if (now % (2 * 60 * 1000) < 1000) {
      console.log(`📊 Pool Status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount} (Active: ${poolMetrics.activeConnections})`);
    }
    
    // Log warning if pool is getting too full, but don't force cleanup
    if (pool.totalCount > 8) {
      console.warn(`⚠️ Pool getting full (${pool.totalCount}), consider scaling up`);
    }
  }, 15000); // Check every 15 seconds (reduced from 30)
};

// Enhanced connection tracking
const trackConnection = (client, taskName) => {
  const connectionId = `${taskName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  connectionTracker.set(connectionId, {
    client,
    taskName,
    acquiredAt: Date.now()
  });
  
  poolMetrics.totalConnections++;
  poolMetrics.activeConnections = connectionTracker.size;
  
  return connectionId;
};

const releaseConnection = (connectionId) => {
  const connection = connectionTracker.get(connectionId);
  if (connection) {
    connectionTracker.delete(connectionId);
    poolMetrics.activeConnections = connectionTracker.size;
    
    try {
      if (connection.client && typeof connection.client.release === 'function') {
        connection.client.release();
      }
    } catch (error) {
      console.error('❌ Error releasing tracked connection:', error.message);
    }
  }
};

// Start monitoring
startConnectionMonitoring();

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
  
  console.log('🔍 DEBUG: pool.healthCheck() called', {
    isPoolEnding,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
  
  try {
    const client = await pool.connectWithRetry();
    const result = await client.query('SELECT 1 as health_check');
    client.release();
    
    const responseTime = Date.now() - startTime;
    
    console.log('🔍 DEBUG: health check successful', {
      responseTime,
      result: result.rows[0]
    });
    
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
    
    console.log('🔍 DEBUG: health check failed', {
      error: error.message,
      responseTime: Date.now() - startTime,
      isPoolEnding
    });
    
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
  // Skip cleanup during build process
  if (isBuildEnvironment) {
    console.log('⚠️ Database pool cleanup skipped during build process');
    return;
  }
  
  // Skip cleanup in production to prevent connection issues
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Database pool cleanup skipped in production environment');
    return;
  }
  
  try {
    await pool.end(); // This will use protected version
    console.log('🔧 Database pool cleanup completed');
  } catch (error) {
    console.error('❌ Database pool cleanup error:', error);
  }
};

// Emergency connection reset function
pool.emergencyReset = async () => {
  // Skip emergency reset during build process
  if (isBuildEnvironment) {
    console.log('⚠️ Emergency database pool reset skipped during build process');
    return false;
  }
  
  // Skip emergency reset in production to prevent connection issues
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Emergency database pool reset skipped in production environment');
    return false;
  }
  
  try {
    console.log('🚨 Emergency database pool reset initiated...');
    
    // Force close all connections
    await pool.end(); // This will use our protected version
    
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

// Connection exhaustion prevention
const exhaustionPrevention = {
  maxQueueSize: process.env.NODE_ENV === 'production' ? 50 : 20,
  maxWaitTime: process.env.NODE_ENV === 'production' ? 30000 : 15000,
  circuitBreakerThreshold: 5, // Number of consecutive failures before circuit opens
  circuitBreakerTimeout: 60000, // 1 minute before trying again
  circuitBreakerState: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  consecutiveFailures: 0,
  lastFailureTime: 0
};

const processConnectionQueue = async () => {
  if (isProcessingQueue || connectionQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (connectionQueue.length > 0) {
    const { resolve, reject, maxRetries, delay, timestamp } = connectionQueue.shift();
    
    try {
      const client = await pool.connectWithRetry(2, 1000, 'queue-processor');
      const waitTime = Date.now() - timestamp;
      
      // Track the connection if taskName is available
      if (taskName) {
        const connectionId = trackConnection(client, taskName);
        
        // Add a custom release method that also untracks
        const originalRelease = client.release;
        let isReleased = false;
        
        client.release = () => {
          if (!isReleased) {
            isReleased = true;
            releaseConnection(connectionId);
            originalRelease.call(client);
          }
        };
      }
      
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

// Enhanced connection retry wrapper with exhaustion prevention
pool.connectWithRetry = async (maxRetries = 2, delay = 1000, taskName = 'unknown') => {
  console.log('🔍 DEBUG: connectWithRetry called', {
    taskName,
    maxRetries,
    isPoolEnding,
    poolTotalCount: pool.totalCount,
    poolIdleCount: pool.idleCount,
    timestamp: new Date().toISOString()
  });
  
  // Check if pool is still valid first
  if (pool.totalCount === undefined || pool.idleCount === undefined || isPoolEnding) {
    console.error('❌ Database pool has been closed or is invalid', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      isPoolEnding
    });
    throw new Error('Database pool has been closed or is invalid');
  }
  
  // Circuit breaker check
  if (exhaustionPrevention.circuitBreakerState === 'OPEN') {
    const timeSinceLastFailure = Date.now() - exhaustionPrevention.lastFailureTime;
    if (timeSinceLastFailure < exhaustionPrevention.circuitBreakerTimeout) {
      throw new Error(`Circuit breaker is OPEN. Database connections are temporarily unavailable. Retry in ${Math.ceil((exhaustionPrevention.circuitBreakerTimeout - timeSinceLastFailure) / 1000)} seconds.`);
    } else {
      // Move to half-open state
      exhaustionPrevention.circuitBreakerState = 'HALF_OPEN';
      console.log('🔧 Circuit breaker moved to HALF_OPEN state');
    }
  }
  
  // Check queue size to prevent exhaustion
  if (connectionQueue.length >= exhaustionPrevention.maxQueueSize) {
    throw new Error(`Connection queue is full (${connectionQueue.length}/${exhaustionPrevention.maxQueueSize}). Too many concurrent requests.`);
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      
      // Reset circuit breaker on successful connection
      if (exhaustionPrevention.circuitBreakerState === 'HALF_OPEN') {
        exhaustionPrevention.circuitBreakerState = 'CLOSED';
        exhaustionPrevention.consecutiveFailures = 0;
        console.log('✅ Circuit breaker moved to CLOSED state');
      }
      
      // Track the connection
      const connectionId = trackConnection(client, taskName);
      
      // Add a custom release method that also untracks
      const originalRelease = client.release;
      let isReleased = false;
      
      client.release = () => {
        if (!isReleased) {
          isReleased = true;
          releaseConnection(connectionId);
          originalRelease.call(client);
        }
      };
      
      return client;
    } catch (error) {
      lastError = error;
      
      // Update circuit breaker state
      exhaustionPrevention.consecutiveFailures++;
      exhaustionPrevention.lastFailureTime = Date.now();
      
      if (exhaustionPrevention.consecutiveFailures >= exhaustionPrevention.circuitBreakerThreshold) {
        exhaustionPrevention.circuitBreakerState = 'OPEN';
        console.warn(`🚨 Circuit breaker OPENED after ${exhaustionPrevention.consecutiveFailures} consecutive failures`);
      }
      
      if (attempt < maxRetries && pool.isRetryableError(error)) {
        console.warn(`⚠️ Connection attempt ${attempt} failed, retrying in ${delay}ms... (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
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

// Get exhaustion prevention status
pool.getExhaustionPreventionStatus = () => {
  return {
    ...exhaustionPrevention,
    currentQueueLength: connectionQueue.length,
    poolStatus: pool.getStatus(),
    timestamp: new Date().toISOString()
  };
};

// Pool health check function
pool.isHealthy = () => {
  const healthy = pool.totalCount !== undefined && 
         pool.idleCount !== undefined && 
         !isPoolEnding && 
         !isBuildEnvironment;
  
  console.log('🔍 DEBUG: isHealthy check', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    isPoolEnding,
    isBuildEnvironment,
    healthy,
    timestamp: new Date().toISOString()
  });
  
  return healthy;
};

// Get pool status
pool.getStatus = () => {
  return {
    isHealthy: pool.isHealthy(),
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    isPoolEnding,
    isBuildEnvironment,
    timestamp: new Date().toISOString()
  };
};

// Enhanced connection management utilities
pool.withConnection = async (callback, taskName = 'unknown', timeoutMs = 30000) => {
  const client = await pool.connectWithRetry(2, 1000, taskName);
  
  try {
    const result = await Promise.race([
      callback(client),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ]);
    
    return result;
  } finally {
    client.release();
  }
};

// Pool recovery function
pool.recover = async () => {
  console.log('🔍 DEBUG: pool.recover() called', {
    isBuildEnvironment,
    nodeEnv: process.env.NODE_ENV,
    isPoolEnding,
    poolHealthy: pool.isHealthy(),
    timestamp: new Date().toISOString()
  });
  
  if (isBuildEnvironment) {
    console.log('⚠️ Pool recovery skipped during build process');
    return false;
  }
  
  if (pool.isHealthy()) {
    console.log('🔧 Pool is already healthy, no recovery needed');
    return true;
  }
  
  try {
    console.log('🔧 Attempting to recover database pool...');
    
    // Always reset the ending flag first
    isPoolEnding = false;
    console.log('🔧 Reset pool ending flag');
    
    // In production, don't recreate the pool, just reset the ending flag
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Production environment: resetting pool state without recreation');
      return true;
    }
    
    // Create a new pool with the same configuration (only in development)
    const newPool = new Pool(poolConfig);
    
    // Copy all methods and properties to the new pool
    Object.assign(pool, newPool);
    
    console.log('✅ Pool recovery completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Pool recovery failed:', error);
    return false;
  }
};

// Enhanced pool health monitoring for production
pool.startProductionHealthMonitoring = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Production health monitoring only runs in production environment');
    return;
  }
  
  console.log('🔧 Starting production pool health monitoring...');
  
  // Monitor pool health every 30 seconds
  const healthInterval = setInterval(async () => {
    try {
      const healthStatus = await pool.healthCheck();
      const exhaustionStatus = pool.getExhaustionPreventionStatus();
      
      if (!healthStatus.healthy) {
        console.warn('⚠️ Pool health check failed:', healthStatus);
        
        // Attempt recovery without closing the pool
        const recoveryResult = await pool.recover();
        if (recoveryResult) {
          console.log('✅ Pool recovery successful');
        } else {
          console.error('❌ Pool recovery failed');
        }
      } else if (healthStatus.responseTime > 5000) {
        console.warn(`⚠️ Slow pool response time: ${healthStatus.responseTime}ms`);
      }
      
      // Check for exhaustion warning signs
      if (exhaustionStatus.currentQueueLength > exhaustionStatus.maxQueueSize * 0.8) {
        console.warn(`⚠️ Connection queue getting full: ${exhaustionStatus.currentQueueLength}/${exhaustionStatus.maxQueueSize}`);
      }
      
      if (exhaustionStatus.circuitBreakerState === 'OPEN') {
        console.warn(`🚨 Circuit breaker is OPEN - database connections temporarily unavailable`);
      }
      
      // Log pool status every 5 minutes
      if (Date.now() % 300000 < 30000) {
        console.log('📊 Production pool status:', {
          healthy: healthStatus.healthy,
          responseTime: healthStatus.responseTime,
          poolStatus: pool.getStatus(),
          exhaustionPrevention: exhaustionStatus,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Pool health monitoring error:', error);
    }
  }, 30000);
  
  // Store interval for cleanup
  pool._healthMonitoringInterval = healthInterval;
  
  console.log('✅ Production pool health monitoring started');
};

// Stop production health monitoring
pool.stopProductionHealthMonitoring = () => {
  if (pool._healthMonitoringInterval) {
    clearInterval(pool._healthMonitoringInterval);
    pool._healthMonitoringInterval = null;
    console.log('🔧 Production pool health monitoring stopped');
  }
};

// Auto-start production health monitoring
if (process.env.NODE_ENV === 'production') {
  // Start production health monitoring after a short delay
  setTimeout(() => {
    pool.startProductionHealthMonitoring();
  }, 5000);
}

// Export tracking functions for external use
export { trackConnection, releaseConnection, startConnectionMonitoring };

export default pool;
