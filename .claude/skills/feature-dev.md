# Feature development skill

## When to use this

Use `/feature-dev` instead of asking Claude to just "implement X" whenever:
- The feature touches more than 3 files
- It introduces a new pattern or layer not already in the codebase
- You are unsure how it fits with existing code
- It has security, auth, or data model implications

---

## How to trigger it

```bash
/feature-dev <plain description of what you want>
```

Examples:
```
/feature-dev Add OAuth login with Google
/feature-dev Add pagination to the users list endpoint
/feature-dev Build a dashboard page showing weekly analytics
/feature-dev Add rate limiting to the API
```

Install the plugin once if not already installed:
```
/plugin install feature-dev@claude-plugins-official
```

---

## What happens (7 phases)

**Phase 1 — Clarify**
Claude asks questions before doing anything. Answer them fully — vague answers
produce vague architecture.

**Phase 2 — Explore codebase**
`code-explorer` agent traces existing similar features: entry points, service
layers, DB access, patterns in use. Output: a map of what to understand before building.

**Phase 3 — Clarify gaps**
Based on what was found, Claude asks the remaining questions that only the codebase
could reveal. Example: "Your auth uses JWT but sessions are Redis-backed — should
OAuth tokens go through the same session layer?"

**Phase 4 — Design architecture**
`code-architect` designs the full feature: files to create, files to modify,
data flows, component hierarchy. You review and approve before implementation starts.

**Phase 5 — Implement**
Code is written file by file, following the architecture plan and the CLAUDE.md
guidelines (backend.md, frontend.md, security-devops.md).

**Phase 6 — Review**
`code-reviewer` runs automatically. Checks for:
- CLAUDE.md compliance
- Bugs and edge cases
- Security issues (confidence ≥ 80 threshold)
- Code quality

**Phase 7 — Summarise**
What was built, key decisions made, files modified, suggested next steps.

---

## If you can't use the plugin

Fall back to asking Claude directly, but force the phases manually:

```
Implement [feature]. Before writing any code:
1. Ask me clarifying questions
2. Read the existing codebase for similar patterns
3. Design the architecture and show me the plan
4. Wait for my approval
Then implement, then run the checklist from .claude/skills/backend.md (or frontend.md)
```

---

## Quality bar

A feature is not done until:
- [ ] All phases completed, not skipped
- [ ] Architecture was shown and approved before implementation
- [ ] code-reviewer found no high-confidence issues
- [ ] Relevant skill checklists passed (backend.md / frontend.md / security-devops.md)
- [ ] No new patterns introduced without documenting them in this project's CLAUDE.md