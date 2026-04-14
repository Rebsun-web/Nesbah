# Architecture thinking

This file governs how Claude reasons about system design, not what code to write.
Read this whenever a task involves adding a new layer, changing data models, choosing
between approaches, or anything that will be hard to reverse.

---

## The senior engineer mindset

Ask these before designing anything:

- **What is the simplest thing that could work?** Start there, not at the complex version
- **What will change in 3 months?** Design the seam there, not everywhere
- **How will this be tested?** If it is hard to test, the design is wrong
- **What happens when this fails?** Every external call, every DB write can fail
- **Who else does this touch?** Auth, logging, billing — changes here ripple

---

## When to add abstraction vs keep it simple

**Add a layer / abstraction when:**
- The same logic appears in 3+ places
- The layer has a clear single responsibility
- It makes testing easier (inject the dependency)
- You are hiding something that genuinely needs hiding (DB driver, third-party API)

**Keep it flat when:**
- It is only used once
- The abstraction name is vaguer than the thing it wraps (`Manager`, `Helper`, `Utils`)
- It adds indirection without adding testability or reusability
- You are doing it "for future flexibility" with no concrete scenario in mind

**YAGNI** — You Aren't Gonna Need It. Do not build for hypothetical scale.

---

## Layering rules for this stack

```
Request → Handler (validate, auth check) 
        → Service (business logic, orchestration)
        → Repository (DB access only)
        → DB
```

Logic belongs in **services**. Handlers are thin. Repositories are dumb.
If you put business logic in a handler, extract it. If you put a DB call in a service, extract it.

Frontend:
```
Page (data fetching, layout)
→ Feature component (domain logic, state)
  → UI component (render only, no business logic, no API calls)
```

---

## Red flags — always raise these

Raise these explicitly before implementing, not after:

| Pattern | Why it is a problem |
|---------|-------------------|
| N+1 queries | Fetching related data inside a loop — kills performance at scale |
| No pagination on list endpoints | Will break when data grows |
| Business logic in route handlers | Cannot be tested without HTTP, cannot be reused |
| Missing index on foreign key | Silent performance cliff |
| Hardcoded config values | Cannot change per environment |
| `any` type in TypeScript | Removes all type safety downstream |
| No error handling on async calls | Silent failures in production |
| Shared mutable state | Race conditions, impossible to debug |

---

## Making a decision

When there are two or more valid approaches, present them like this and wait for input:

```
Option A: [name]
  What it does: ...
  Good because: ...
  Costs: ...

Option B: [name]
  What it does: ...
  Good because: ...
  Costs: ...

Recommendation: Option A, because [one clear reason].
Risk if wrong: [what we would need to undo]
```

Never silently pick one. Never present more than three options — if there are more,
filter down to the two most relevant before presenting.

---

## How to read an unfamiliar codebase

Before adding anything to an existing project:

1. Read the entry point (main.py, server.ts, app/page.tsx)
2. Trace one full request end to end — from route to DB and back
3. Find the auth pattern — where is identity checked?
4. Find the error handling pattern — where do errors go?
5. Find one similar feature — read it fully before designing the new one

Then match what you found. Do not introduce a second pattern for the same problem.

---

## Documentation of decisions

When a non-obvious architectural choice is made, add a brief note to the project CLAUDE.md:

```markdown
## Architecture decisions
- [date] Chose Redis for session storage over DB sessions — need sub-10ms auth checks
- [date] Using repository pattern for DB access — enables unit testing without DB
```

This is for future you and future Claude — not for now.