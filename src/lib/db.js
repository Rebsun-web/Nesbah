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
    idleTimeoutMillis: 600000,  // 10 min — keeps pre-warmed connections alive between requests
    connectionTimeoutMillis: 30000,
    // Client-side query timeout — kills any hung query after 10s regardless of socket state.
    // statement_timeout is server-side and never fires if the socket is stale/dead.
    // query_timeout is client-side: works even when bytes never reach Cloud SQL.
    query_timeout: 10000,
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
  // QUERY_TIMEOUT_ERROR = pg client-side query timeout (stale socket, bytes never reached Cloud SQL)
  const codes = ['53300', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOENT', '57P01', '57P02', 'QUERY_TIMEOUT_ERROR'];
  return codes.includes(err.code) || /timeout|terminating connection/i.test(err.message);
};

pool.getStatus = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount,
  max: pool.options.max,
  min: pool.options.min,
});

pool.getMetrics = pool.getStatus;

pool.getQueueMetrics = () => ({ currentQueueLength: 0, totalQueued: 0, totalProcessed: 0, averageWaitTime: 0, maxWaitTime: 0 });

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

// db.js is imported by both instrumentation.js (at startup) and layout.jsx (on first request).
// The pool singleton prevents duplicate Pool objects, but without this flag the pre-warm
// and keepalive setInterval would register twice — creating 6 connections instead of 3
// and running two keepalive loops.
if (process.env.NODE_ENV === 'production' && !global._pgPoolScheduled) {
  global._pgPoolScheduled = true;

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
  // normal traffic, leaving the others stale. The proxy may drop idle sockets
  // in under 9 minutes, so ping every 4 minutes to stay ahead of that.
  // Critical: release stale connections WITH an error so pg-pool destroys them
  // rather than returning them to the idle pool for the next request to hang on.
  let keepaliveRunning = false;
  setInterval(async () => {
    // Guard: if the previous run is still in progress, skip and warn.
    // setInterval fires every 4 min regardless of whether the last run finished.
    // Without this, a slow run and a new run would overlap and double-acquire connections.
    if (keepaliveRunning) {
      console.warn('[DB] keepalive: previous run still in progress — skipping this cycle (event loop may be slow)');
      return;
    }
    keepaliveRunning = true;
    const t0 = Date.now();

    const count = pool.idleCount;
    if (count === 0) {
      console.log('[DB] keepalive: no idle connections to ping');
      keepaliveRunning = false;
      return;
    }

    console.log(`[DB] keepalive: pinging ${count} idle connection(s)`);
    const clients = [];

    try {
      for (let i = 0; i < count; i++) clients.push(await pool.connect());
    } catch (err) {
      console.error('[DB] keepalive: failed to acquire connections:', err.message);
      clients.forEach(c => { try { c.release(); } catch (_) {} });
      keepaliveRunning = false;
      return;
    }

    let ok = 0;
    let destroyed = 0;
    await Promise.all(clients.map(async (c) => {
      try {
        await Promise.race([
          c.query('SELECT 1'),
          new Promise((_, rej) => setTimeout(() => rej(new Error('keepalive timeout')), 3000)),
        ]);
        c.release();
        ok++;
      } catch (err) {
        // release(err) tells pg-pool to destroy this connection instead of
        // returning it to the idle pool — prevents the next request getting a dead socket
        console.warn(`[DB] keepalive: stale connection destroyed (${err.message})`);
        c.release(err);
        destroyed++;
      }
    }));

    const elapsed = Date.now() - t0;
    if (elapsed > 5000) {
      console.warn(`[DB] keepalive: took ${elapsed}ms — connections or event loop are slow`);
    } else {
      console.log(`[DB] keepalive done in ${elapsed}ms — ok:${ok} destroyed:${destroyed} pool:`, {
        total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount,
      });
    }
    keepaliveRunning = false;
  }, 4 * 60 * 1000);
}

export default pool;
