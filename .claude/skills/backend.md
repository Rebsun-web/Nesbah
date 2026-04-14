# Backend guidelines — Nesbah

Raw SQL, pg driver, Next.js App Router API routes. No ORM. Match existing patterns.

---

## Non-negotiables

- Raw SQL only. No Prisma, no Drizzle, no Sequelize — ever
- Parameterised queries — `$1, $2` always. String interpolation in SQL is a critical bug
- Auth check before anything else in every handler
- Role check explicitly inside the handler — do not rely on route path
- No new npm dependencies without asking

---

## Query pattern

```javascript
import { query } from '@/lib/db'

// Always parameterised
const result = await query(
  `SELECT a.id, a.status, a.created_at, b.name as business_name
   FROM applications a
   JOIN businesses b ON b.id = a.business_id
   WHERE a.bank_id = $1 AND a.status = $2
   ORDER BY a.created_at DESC
   LIMIT $3 OFFSET $4`,
  [bankId, status, limit, offset]
)

// Rows are in result.rows
// Row count in result.rowCount
```

For transactions (multi-step writes):
```javascript
import { getClient } from '@/lib/db'

const client = await getClient()
try {
  await client.query('BEGIN')
  await client.query('INSERT INTO ...', [...])
  await client.query('UPDATE ...', [...])
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  client.release()
}
```

Always use transactions for any operation that writes to more than one table.

---

## Route handler structure

```javascript
// src/app/api/[resource]/route.js

import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth/[relevant-auth-file]'
import { NextResponse } from 'next/server'

export async function POST(request) {
  // 1. Auth — always first
  const user = await verifyToken(request)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // 2. Role check
  if (user.role !== 'bank_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Parse and validate input
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { applicationId, amount } = body
  if (!applicationId || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 4. Business logic + DB
  try {
    const result = await query(
      'INSERT INTO offers (application_id, bank_id, amount) VALUES ($1, $2, $3) RETURNING id',
      [applicationId, user.bankId, amount]
    )
    return NextResponse.json({ data: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Create offer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Pagination

Every list endpoint needs pagination. Match this pattern:

```javascript
const page = parseInt(searchParams.get('page') || '1')
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
const offset = (page - 1) * limit

const [rows, count] = await Promise.all([
  query('SELECT ... LIMIT $1 OFFSET $2', [limit, offset]),
  query('SELECT COUNT(*) FROM ... WHERE ...', [...filterParams])
])

return NextResponse.json({
  data: rows.rows,
  meta: {
    total: parseInt(count.rows[0].count),
    page,
    limit
  }
})
```

---

## Background jobs (node-cron)

All scheduled jobs live in `src/lib/background-tasks.js`. This file runs auction
automation — financial side effects if broken.

To add a job: describe the schedule and side effects, wait for confirmation, then
add it to the existing file following the pattern already there.
Never create a second background task file.

---

## File uploads (Busboy + GCS)

Uploads use Busboy for streaming and Google Cloud Storage for persistence.
Match the existing upload pattern — do not use Next.js built-in body parsing for
file upload routes (it conflicts with Busboy).

---

## Email (@emailjs/nodejs)

Email via @emailjs/nodejs. Keys come from env. Never hardcode service ID, template ID,
or private key — they are in environment variables.

---

## Before marking done

- [ ] Auth checked first in handler
- [ ] Role checked explicitly
- [ ] All SQL parameterised — no string interpolation
- [ ] Multi-table writes wrapped in transaction
- [ ] List endpoints have pagination
- [ ] 500 errors log the real error server-side, return generic message to client
- [ ] No console.log left in production code
- [ ] No new dependencies added