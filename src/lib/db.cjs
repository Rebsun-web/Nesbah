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
  // Optimized connection pool limits to prevent exhaustion
  max: 10, // Reduced from 20 to prevent overwhelming the server
  min: 0, // Start with no connections
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (reduced from 30)
  connectionTimeoutMillis: 5000, // Increased timeout for better reliability
  maxUses: 1000, // Close connections after 1000 uses (reduced from 7500)
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

module.exports = pool;
