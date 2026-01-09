---
description: Commit task changes with a quick build check
---

# Commit Task Workflow

**Use after completing a task, before moving to the next task in a spec.**

This is a lightweight checkpoint - NOT a full quality gate.
Full quality review happens in `/finish-spec`.

---

## 1. Stage Changes
```bash
git add .
```

---

## 2. Commit with Conventional Format
```bash
git commit -m "<type>(task-<ID>): <description>"
```

**Commit Types:**
| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructure |
| `docs` | Documentation only |
| `chore` | Maintenance, deps |

**Examples:**
- `feat(task-6): create agent-skills-package folder`
- `fix(task-3): resolve scroll behavior on page exit`

---

## 3. Quick Build Check
```bash
npm run build
```

| Result | Action |
|--------|--------|
| ✅ Passes | Proceed to next task |
| ❌ Fails | Fix build errors before moving on |

> [!WARNING]
> Do NOT proceed to the next task if the build fails.
> Fix the issue and re-commit.

---

## 4. Update Task Status to Done
- **Verify status is `In Review`** (it should be, from start-task).
- Use CLI: `npx backlog.md task edit <ID> --status Done`
- Use CLI for subtasks: `npx backlog.md task edit <ID> --check-ac 1 --check-ac 2 ...` (or verify manually)

---

## 5. Notify User
"Task <ID> committed. Build passes. Ready for next task or `/finish-spec`."

---

## What This Does NOT Do
- ❌ Full quality gate (that's `/finish-spec`)
- ❌ Self-reflection (that's `/finish-spec`)
- ❌ KNOWLEDGE.md updates (that's `/finish-spec`)
- ❌ Merge to main (that's `/finish-spec`)
