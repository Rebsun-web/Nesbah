#!/usr/bin/env node
/**
 * Stress test for login and public-submit endpoints.
 * Tests: concurrent requests, timeout behaviour, stale-connection recovery.
 *
 * Usage:
 *   node scripts/stress-test.js [base_url]
 *   node scripts/stress-test.js https://nesbah.com.sa
 *   node scripts/stress-test.js http://localhost:3000   (default)
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT_MS = 35000; // slightly above our 30s login timeout

// ─── helpers ────────────────────────────────────────────────────────────────

function log(label, msg, ok = true) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${label}] ${msg}`);
}

async function timedFetch(label, url, options) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const ms = Date.now() - start;
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ms, body };
  } catch (err) {
    const ms = Date.now() - start;
    return { ok: false, status: 0, ms, body: {}, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ─── test cases ─────────────────────────────────────────────────────────────

async function testLoginBadCredentials() {
  const label = 'login-bad-creds';
  const r = await timedFetch(label, `${BASE_URL}/api/auth/unified-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@test.com', password: 'wrong' }),
  });
  const pass = r.status === 401 && r.ms < 30000;
  log(label, `status=${r.status} time=${r.ms}ms expected=401 — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

async function testLoginTimeout() {
  // Send a malformed body to trigger fast path, just verify no 504
  const label = 'login-no-504';
  const r = await timedFetch(label, `${BASE_URL}/api/auth/unified-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nesbah.com', password: 'wrongpassword123' }),
  });
  const pass = r.status !== 504 && r.ms < 32000;
  log(label, `status=${r.status} time=${r.ms}ms (must not be 504, must be <32s) — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

async function testPublicSubmitValidation() {
  const label = 'submit-validation';
  const r = await timedFetch(label, `${BASE_URL}/api/applications/public-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cr_national_number: '123', financing_type: 'pos' }), // missing required fields
  });
  const pass = r.status === 400 && r.ms < 10000;
  log(label, `status=${r.status} time=${r.ms}ms expected=400 — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

async function testPublicSubmitDuplicateCR() {
  // CR 7051664865 is already in DB (app 63) — should get 409
  const label = 'submit-duplicate-cr';
  const r = await timedFetch(label, `${BASE_URL}/api/applications/public-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cr_national_number: '7051664865',
      contact_person: 'Test',
      contact_person_number: '0501234567',
      financing_type: 'pos',
    }),
  });
  const pass = r.status === 409 && r.ms < 15000;
  log(label, `status=${r.status} time=${r.ms}ms expected=409 — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

async function testConcurrentLogins(n = 10) {
  const label = `concurrent-login-x${n}`;
  const requests = Array.from({ length: n }, () =>
    timedFetch(label, `${BASE_URL}/api/auth/unified-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `user${Math.random()}@test.com`, password: 'wrong' }),
    })
  );
  const results = await Promise.all(requests);
  const hung = results.filter(r => r.ms >= 30000 || r.status === 504);
  const pass = hung.length === 0;
  const times = results.map(r => r.ms);
  const max = Math.max(...times);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  log(label, `${n} concurrent — avg=${avg}ms max=${max}ms hung=${hung.length} — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

async function testConcurrentSubmissions(n = 5) {
  const label = `concurrent-submit-x${n}`;
  // Use invalid CR numbers so they fail at validation, never hitting Wathiq
  const requests = Array.from({ length: n }, (_, i) =>
    timedFetch(label, `${BASE_URL}/api/applications/public-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cr_national_number: `123456789${i}`, // invalid format — fails at regex check
        contact_person: 'Test',
        contact_person_number: '0501234567',
        financing_type: 'pos',
      }),
    })
  );
  const results = await Promise.all(requests);
  const hung = results.filter(r => r.ms >= 30000 || r.status === 504);
  const pass = hung.length === 0;
  const max = Math.max(...results.map(r => r.ms));
  log(label, `${n} concurrent — max=${max}ms hung=${hung.length} — ${pass ? 'PASS' : 'FAIL'}`, pass);
  return pass;
}

// ─── run ────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀 Stress test — ${BASE_URL}\n`);

  const results = await Promise.all([
    testLoginBadCredentials(),
    testLoginTimeout(),
    testPublicSubmitValidation(),
    testPublicSubmitDuplicateCR(),
  ]);

  // Sequential to avoid noise in timing
  results.push(await testConcurrentLogins(10));
  results.push(await testConcurrentSubmissions(5));

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Result: ${passed}/${total} passed ${passed === total ? '✅' : '❌'}\n`);
  process.exit(passed === total ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
