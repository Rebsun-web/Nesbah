// Runs at server startup before any requests — used to warm the DB pool.
// Next.js 15 loads this file before the first request is served.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: pool } = await import('./lib/db.js')
    // db.js schedules pool pre-warm (setTimeout 2s) and health monitoring
    // (setTimeout 5s) internally. Importing it here ensures those fire at
    // startup rather than on the first user request.
    console.log('🚀 instrumentation: db.js loaded at startup, pool pre-warm scheduled')
  }
}
