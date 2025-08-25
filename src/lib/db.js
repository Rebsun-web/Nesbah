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
  // Optimized connection pool limits to prevent exhaustion
  max: 10, // Increased to handle current load
  min: 2, // Keep some connections ready
  idleTimeoutMillis: 30000, // Keep connections alive longer
  connectionTimeoutMillis: 10000, // Increased timeout for better reliability
  maxUses: 1000, // Close connections after 1000 uses to prevent memory leaks
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
}, 30000); // Check every 30 seconds

export default pool;
