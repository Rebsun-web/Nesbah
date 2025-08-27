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
  // Further reduced connection pool limits to prevent PostgreSQL connection exhaustion
  max: 10, // Reduced from 20 to 10 connections
  min: 2, // Reduced from 5 to 2 minimum connections
  idleTimeoutMillis: 30000, // Reduced to 30 seconds
  connectionTimeoutMillis: 5000, // Reduced timeout to 5 seconds
  maxUses: 50, // Reduced to prevent long-running connections
  allowExitOnIdle: true, // Allow the pool to exit when idle
});

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Handle connection errors
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

// Log pool status for debugging
pool.on('acquire', (client) => {
  console.log(`🔗 Database connection acquired. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
});

pool.on('release', (client) => {
  console.log(`🔓 Database connection released. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
});

// Monitor pool for potential issues
setInterval(() => {
  const { totalCount, idleCount, waitingCount } = pool;
  if (waitingCount > 0) {
    console.warn(`⚠️  Database pool has ${waitingCount} waiting connections. Total: ${totalCount}, Idle: ${idleCount}`);
  }
  if (totalCount >= pool.options.max) {
    console.warn(`⚠️  Database pool at maximum capacity: ${totalCount}/${pool.options.max}`);
  }
  
  // Log pool status every 5 minutes for monitoring
  if (Date.now() % 300000 < 30000) { // Every 5 minutes
    console.log(`📊 Database pool status: Total: ${totalCount}, Idle: ${idleCount}, Waiting: ${waitingCount}, Max: ${pool.options.max}`);
  }
}, 30000); // Check every 30 seconds

// Add connection health check method
pool.healthCheck = async () => {
  try {
    const client = await pool.connectWithRetry();
    await client.query('SELECT 1');
    client.release();
    return { healthy: true, timestamp: new Date().toISOString() };
  } catch (error) {
    return { healthy: false, error: error.message, timestamp: new Date().toISOString() };
  }
};

// Connection management utility to ensure proper release
pool.withConnection = async (callback) => {
  const client = await pool.connectWithRetry();
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
  try {
    await pool.end();
    console.log('🔧 Database pool cleanup completed');
  } catch (error) {
    console.error('❌ Database pool cleanup error:', error);
  }
};

// Connection request queue for high concurrency
let connectionQueue = [];
let isProcessingQueue = false;

const processConnectionQueue = async () => {
  if (isProcessingQueue || connectionQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (connectionQueue.length > 0) {
    const { resolve, reject, maxRetries, delay } = connectionQueue.shift();
    
    try {
      const client = await pool.connect();
      resolve(client);
    } catch (error) {
      if ((error.code === '53300' || error.message.includes('connection slots are reserved')) && maxRetries > 0) {
        console.warn(`⚠️ Connection pool exhausted, queuing retry in ${delay}ms`);
        setTimeout(() => {
          connectionQueue.push({ resolve, reject, maxRetries: maxRetries - 1, delay: delay * 2 });
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

// Add connection retry wrapper with queue
pool.connectWithRetry = async (maxRetries = 2, delay = 1000) => {
  return new Promise((resolve, reject) => {
    // Try to get a connection immediately first
    pool.connect().then(resolve).catch((error) => {
      if (error.code === '53300' || error.message.includes('connection slots are reserved')) {
        console.warn(`⚠️ Connection pool exhausted, queuing retry...`);
        connectionQueue.push({ resolve, reject, maxRetries, delay });
        processConnectionQueue();
      } else {
        reject(error);
      }
    });
  });
};

export default pool;
