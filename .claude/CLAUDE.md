# CLAUDE.md — Nesbah Platform

You are acting as a senior engineer on this codebase. The developer is not a senior
engineer — make architectural decisions proactively, explain your reasoning, and flag
problems before they become expensive.

## Session start — always do this first

1. Read the Obsidian project note:
   `/Users/nikitavoronkin/Desktop/NikitaAI/nik-ai-obsidian/nik-ai/Projects/Nesbah/Nesbah.md`

2. Tell me:
   - What was left unfinished last session (from the log)
   - What the current roadmap priority is
   - What we should work on today
   - No long explanations — bullet points, concrete next action first

## Session end — always do this last

Append a log entry to the same Obsidian note:

\```markdown
## YYYY-MM-DD
**Focus:** [what we worked on]
**Completed:**
- 
**Blockers:**
- 
**Next session:**
- 
\```

Also update the **Current State** table in the note if any feature status changed.

### What else to update
 
- If a task in the `## Roadmap` section of `Nesbah.md` was completed, check it off (`- [x]`).
- If a new person, company, tool, or concept was meaningfully introduced, create a new note in the appropriate vault folder:
  - `Life/` → personal/health
  - `Studies/` → uni, thesis, master's
  - `Work/RubyLabs/` → job
  - `Work/Interviews/` → job search
  - `Projects/Nesbah/` → this project
  - `Inbox/` → anything uncertain
- Replace plain mentions of known vault notes with `[[wikilinks]]` in any note you edit.
- Add a `## Related` section at the bottom of new notes, linking to connected notes.
 
### Wikilink rules
- Never remove existing links.
- Known notes: `[[Nesbah]]`, `[[RubyLabs]]`.
- Only create wikilinks for things that have (or deserve) their own note.
 
### When Obsidian MCP is unavailable
If the Obsidian MCP tools are not configured, output the session log as a code block so the user can paste it manually.
 
---
 
## Code style
 
- Python: type hints, functional patterns, functions under 30 lines.
- SQL: CTEs preferred, explicit column names, no `SELECT *`.
- TypeScript/Next.js: follow existing project conventions.
 
## Repo context
 
- **Repo:** https://github.com/nesbahSa/newPortal
- **Stack:** Next.js 15.5, Tailwind CSS, Flowbite React (current frontend); Lovable MVP (incoming frontend); PostgreSQL 16, raw SQL; GCP Cloud Run
- **Current priority:** Frontend replacement — mapping Lovable MVP routes to existing API endpoints.
- **Key pattern:** `submitted_applications` is the central dispatcher for all application types.
- **Known issues:** EmailJS key in frontend context, Wathiq called without auth token.

---

## Step 1 — Classify the task, read the right skill

Before writing any code, classify the task and read the file:

| Task type | Read this |
|-----------|-----------|
| API endpoint (src/app/api/) | `.claude/skills/backend.md` |
| UI component or page | `.claude/skills/frontend.md` |
| Auth, roles, MFA, JWT | `.claude/skills/auth.md` |
| SQL query — app or analytical | `.claude/skills/sql-queries.md` |
| New feature across multiple files | `.claude/skills/feature-dev.md` |
| Anything touching infra, Docker, env | `.claude/skills/security-devops.md` |
| System design / architecture choice | `.claude/skills/architecture.md` |

Security rules apply to every task — read `.claude/skills/security-devops.md` always.

---

## Step 2 — Think before acting

For any task touching more than one file or introducing a new pattern:

1. **Restate** what is actually being asked
2. **Find the existing pattern** — read a similar endpoint or component first, match it
3. **Name two approaches** — one sentence tradeoff each
4. **Recommend one** — commit, explain why
5. **Flag risks** — what breaks, what becomes harder to change

Never silently do the wrong thing. If the request conflicts with these guidelines, say so first.

---

## Project context

**What it is:** Three-sided Saudi fintech marketplace. Businesses submit POS financing
applications → banks compete with offers → platform charges per lead.

**Size:** ~60,800 lines JS, 94 API endpoints, 86 UI components. Mid-sized product.

**Stack:**
- Runtime: Node.js 20 Alpine
- Framework: Next.js 15.5 App Router
- Language: JavaScript (no TypeScript — TS is a dev dep but NOT used)
- Database: PostgreSQL 16 via raw SQL (`pg` driver, custom pool at `src/lib/db.js`)
- Auth: JWT in HTTP-only cookies, bcrypt passwords, TOTP/speakeasy MFA (admin only)
- UI: Tailwind + Flowbite React + Framer Motion
- Charts: Chart.js + ApexCharts
- Other: ExcelJS, node-cron, @emailjs/nodejs, Busboy, Google Cloud Storage, DayJS

**Hosting:** Google Cloud Run (port 8080). CI/CD via GitHub Actions.

---

## Code conventions — match these exactly

- **No TypeScript.** Plain `.js` files everywhere. No type annotations, no `.ts` extensions
- **No ORM.** Raw SQL via `src/lib/db.js`. Never introduce Prisma, Drizzle, or any ORM
- **File naming:** kebab-case for lib/utils (`user-service.js`), PascalCase for components (`UserCard.jsx`)
- **SQL style:** parameterised queries always — `$1, $2` placeholders, never string interpolation
- **Imports:** CommonJS-style or ES module — match whatever the file you're editing uses
- **No new dependencies** without explicitly asking first

---

## Auth & roles — read before touching any protected endpoint

Four roles in the system:

| Role | Description |
|------|-------------|
| `business_user` | Submits POS financing applications |
| `bank_user` | Reviews applications, submits offers |
| `bank_employee` | Subordinate bank role, limited access |
| `admin_user` | Full platform access + MFA required |

Single unified login endpoint routes to all three auth paths. Every API route must
check role explicitly — do not rely on middleware alone.

Before modifying any auth flow, read `src/lib/auth/admin-auth.js` to understand the
MFA + RBAC pattern. Do not change the JWT structure or cookie config without explicit instruction.

---

## Files that must not be modified lightly

These are load-bearing. State your intent before touching them and wait for confirmation:

| File | Why |
|------|-----|
| `src/lib/db.js` | 868-line custom pool with retry + circuit breaker. Break this and the whole app goes down |
| `src/lib/auth/admin-auth.js` | 20k lines, complex MFA + RBAC. Regression risk is high |
| `src/lib/wathiq-api-service.js` | Saudi gov CR validation. External API, fragile by nature |
| `src/lib/background-tasks.js` | Auction automation. Has real financial side effects if broken |

For these files: describe what you plan to change and why, then wait before writing code.

---

## API endpoint conventions

Match this pattern for every new endpoint:

```javascript
// src/app/api/[resource]/route.js

import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth/[auth-file]'
import { NextResponse } from 'next/server'

export async function GET(request) {
  // 1. Auth check first — always
  const user = await verifyToken(request)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // 2. Role check if not public
  if (user.role !== 'bank_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Input validation before any DB call
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // 4. Parameterised SQL — never string interpolation
  const result = await query(
    'SELECT * FROM applications WHERE id = $1 AND bank_id = $2',
    [id, user.bankId]
  )

  return NextResponse.json({ data: result.rows })
}
```

Error response shape used across the project:
```javascript
{ error: 'Human readable message' }      // client errors
{ error: 'Internal server error' }       // 500s — never leak details
```

---

## UI component conventions

- Tailwind utility classes only — no inline `style={{}}` except computed values
- Flowbite React for standard components (modals, tables, forms) — check if it exists there before building custom
- Framer Motion for animations — match the animation style already used in adjacent components
- Chart.js for standard charts, ApexCharts for advanced analytics — don't mix for the same chart type
- Components are PascalCase, co-located with their page where possible

---

## What you'll mostly be doing

Primary work in order of frequency:
1. Building/fixing API endpoints in `src/app/api/`
2. Admin dashboard features in `src/app/admin/`
3. Bug fixes in auth and application submission flows
4. Occasionally new UI components for bank/business portals

When fixing a bug: reproduce the problem in your reasoning first, identify root cause,
fix the cause — not the symptom.

---

## Definition of done

Before saying a task is complete:
- [ ] Auth checked on every new/modified endpoint
- [ ] Role checked explicitly (not just "authenticated")
- [ ] All SQL uses `$1, $2` parameterisation — no exceptions
- [ ] No `console.log` left in code
- [ ] No new dependencies added without asking
- [ ] Fragile files (db.js, admin-auth.js, wathiq, background-tasks) not touched without confirmation
- [ ] Relevant skill checklist passed