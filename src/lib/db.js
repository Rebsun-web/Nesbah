import pkg from 'pg';
const { Pool } = pkg;

const isUnixSocket = process.env.PGHOST?.startsWith('/');

const poolConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // Cloud SQL Auth Proxy handles TLS internally — do not enable SSL on the pg side
  ssl: isUnixSocket ? false : { rejectUnauthorized: false },
};

// Log startup config so we can verify proxy vs TCP and SSL state from the first log line
console.log('[DB] pool config:', {
  PGHOST: process.env.PGHOST || '(not set)',
  PGPORT: process.env.PGPORT || 5432,
  PGDATABASE: process.env.PGDATABASE || '(not set)',
  PGUSER: process.env.PGUSER || '(not set)',
  PGPASSWORD: process.env.PGPASSWORD ? '(set)' : '(not set)',
  isUnixSocket,
  ssl: isUnixSocket ? 'disabled (proxy handles TLS)' : 'enabled (TCP direct)',
  NODE_ENV: process.env.NODE_ENV,
  singleton: global._pgPool ? 'reusing existing pool' : 'creating new pool',
});

// Singleton: prevents hot-reload in dev from spawning duplicate pools
if (!global._pgPool) {
  global._pgPool = new Pool({
    ...poolConfig,
    max: 20,
    min: 3,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 30000,
  });
  console.log('[DB] pool created (max:20 min:3 connTimeout:30s idleTimeout:60s)');
}

const pool = global._pgPool;

// ── Pool-level events ──────────────────────────────────────────────────────────

pool.on('error', (err) => {
  // Fires when an idle client encounters an error (e.g. proxy dropped the socket)
  console.error('[DB] idle client error — proxy may have dropped the connection:', {
    message: err.message,
    code: err.code,         // ECONNRESET = socket closed by proxy; ENOENT = socket file gone
    errno: err.errno,
    syscall: err.syscall,   // 'read' or 'connect' tells us where it failed
  });
});

pool.on('connect', (client) => {
  // Fires each time a brand-new physical connection is made to the DB
  console.log('[DB] new physical connection established', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    via: isUnixSocket ? 'unix-socket (proxy)' : 'tcp+ssl',
  });
  client.query("SET timezone = 'Asia/Riyadh'; SET statement_timeout = '9000'")
    .then(() => console.log('[DB] session params set (tz=Riyadh, statement_timeout=9s)'))
    .catch((err) => console.error('[DB] failed to set session params:', err.message, err.code));
});

pool.on('remove', () => {
  // Fires when a connection is removed from the pool (idle timeout, maxUses, or error)
  console.log('[DB] connection removed from pool', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
});

// ── connectWithRetry ───────────────────────────────────────────────────────────

// Simple retry — pool.connect() respects connectionTimeoutMillis: 30s
pool.connectWithRetry = async (maxRetries = 2, delay = 1000, taskName = 'unknown') => {
  const t0 = Date.now();
  let lastError;

  console.log(`[DB:${taskName}] acquiring connection`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now();
    try {
      const client = await pool.connect();
      console.log(`[DB:${taskName}] connection acquired in ${Date.now() - attemptStart}ms (total wait: ${Date.now() - t0}ms)`);
      return client;
    } catch (err) {
      lastError = err;
      console.error(`[DB:${taskName}] connect attempt ${attempt}/${maxRetries} failed after ${Date.now() - attemptStart}ms:`, {
        message: err.message,
        code: err.code,       // ENOENT = proxy socket missing; ETIMEDOUT = proxy not responding
        errno: err.errno,
        syscall: err.syscall,
        isUnixSocket,
        PGHOST: process.env.PGHOST,
      });
      if (attempt < maxRetries) {
        console.log(`[DB:${taskName}] retrying in ${delay * attempt}ms...`);
        await new Promise(r => setTimeout(r, delay * attempt));
      }
    }
  }

  console.error(`[DB:${taskName}] all ${maxRetries} connect attempts failed (${Date.now() - t0}ms total)`);
  throw lastError;
};

// ── Convenience wrappers ───────────────────────────────────────────────────────

pool.withConnection = async (callback, taskName = 'unknown') => {
  const client = await pool.connectWithRetry(2, 1000, taskName);
  try {
    return await callback(client);
  } finally {
    client.release();
  }
};

pool.withConnectionRetry = pool.withConnection;

pool.isRetryableError = (err) => {
  const codes = ['53300', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', '57P01', '57P02'];
  return codes.includes(err.code) || /timeout|terminating connection/.test(err.message);
};

pool.getStatus = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount,
  max: pool.options.max,
  min: pool.options.min,
});

pool.getMetrics = pool.getStatus;

pool.getQueueMetrics = () => ({ currentQueueLength: 0, totalQueued: 0, totalProcessed: 0 });

pool.healthCheck = async () => {
  const t0 = Date.now();
  try {
    const client = await pool.connectWithRetry(1, 0, 'health-check');
    await client.query('SELECT 1');
    client.release();
    const ms = Date.now() - t0;
    console.log(`[DB] health check OK in ${ms}ms`);
    return { healthy: true, responseTime: ms, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error(`[DB] health check FAILED after ${Date.now() - t0}ms:`, err.message, err.code);
    return { healthy: false, error: err.message, timestamp: new Date().toISOString() };
  }
};

// ── Production-only: pre-warm + keepalive ─────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  // pg-pool creates min connections lazily on first use, not at Pool() construction.
  // Pre-warm so the first request is never cold.
  setTimeout(async () => {
    console.log('[DB] pre-warm starting (target: 3 connections)...');
    const clients = [];
    try {
      for (let i = 0; i < 3; i++) {
        const t0 = Date.now();
        const c = await pool.connect();
        console.log(`[DB] pre-warm connection ${i + 1}/3 ready in ${Date.now() - t0}ms`);
        clients.push(c);
      }
      console.log('[DB] pre-warm complete — pool:', {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      });
    } catch (err) {
      // ENOENT here = proxy socket not yet created (proxy still starting)
      // ETIMEDOUT here = proxy is up but Cloud SQL auth is failing
      console.error('[DB] pre-warm FAILED:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        syscall: err.syscall,
        isUnixSocket,
        PGHOST: process.env.PGHOST,
        hint: err.code === 'ENOENT'
          ? 'Unix socket file missing — Cloud SQL Auth Proxy may not be running'
          : err.code === 'ETIMEDOUT'
          ? 'Proxy is up but connection timed out — check Cloud SQL instance name in annotation'
          : 'Check PGHOST, PGUSER, PGPASSWORD, PGDATABASE env vars',
      });
    } finally {
      clients.forEach(c => { try { c.release(); } catch (_) {} });
    }
  }, 2000);

  // pg-pool uses LIFO — only the most-recently-used connection gets touched by
  // normal traffic, leaving the others stale. Ping all idle connections every
  // 9 minutes so Cloud SQL doesn't drop them.
  setInterval(async () => {
    const count = pool.idleCount;
    if (count === 0) return;

    console.log(`[DB] keepalive: pinging ${count} idle connection(s)`);
    const clients = [];
    const t0 = Date.now();
    try {
      for (let i = 0; i < count; i++) clients.push(await pool.connect());

      const results = await Promise.allSettled(clients.map((c, i) =>
        Promise.race([
          c.query('SELECT 1').then(() => ({ i, ok: true })),
          new Promise((_, rej) => setTimeout(() => rej(new Error('keepalive timeout')), 3000)),
        ])
      ));

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        // A rejected ping usually means the proxy dropped a stale socket.
        // The pool will create a fresh connection on the next acquire.
        console.warn(`[DB] keepalive: ${failed.length}/${count} ping(s) failed (${Date.now() - t0}ms):`,
          failed.map(r => r.reason?.message));
      } else {
        console.log(`[DB] keepalive: all ${count} ping(s) OK in ${Date.now() - t0}ms`);
      }
    } catch (err) {
      console.error('[DB] keepalive error:', { message: err.message, code: err.code });
    } finally {
      clients.forEach(c => { try { c.release(); } catch (_) {} });
    }
  }, 9 * 60 * 1000);
}

export default pool;
