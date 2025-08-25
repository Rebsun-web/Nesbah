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
  // Optimized connection pool for production load
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Increased for production
  min: process.env.NODE_ENV === 'production' ? 5 : 0, // Keep minimum connections in production
  idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 30000 : 10000, // Longer timeout in production
  connectionTimeoutMillis: 10000, // Increased timeout for better reliability
  maxUses: process.env.NODE_ENV === 'production' ? 7500 : 1000, // More uses in production
  allowExitOnIdle: process.env.NODE_ENV !== 'production', // Don't exit in production
  // Add connection retry logic
  retryDelay: 1000,
  maxRetries: 3,
});

// Enhanced error handling and monitoring
pool.on('error', (err, client) => {
  console.error('❌ Database pool error:', err);
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

// Enhanced logging for production monitoring
if (process.env.NODE_ENV === 'production') {
  pool.on('acquire', (client) => {
    console.log(`🔗 Database connection acquired. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
  });

  pool.on('release', (client) => {
    console.log(`🔓 Database connection released. Pool status: ${pool.totalCount}/${pool.idleCount}/${pool.waitingCount}`);
  });
}

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

module.exports = pool;
