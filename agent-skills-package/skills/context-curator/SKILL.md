---
name: context-curator
description: Use to manage and organize KNOWLEDGE.md. Prune outdated entries, categorize new learnings, and maintain project memory health. Trigger periodically or when KNOWLEDGE.md exceeds 200 lines.
---

# Context-Curator Skill

Maintain healthy, organized project memory.

---

## When to Trigger

- KNOWLEDGE.md exceeds 200 lines
- After adding 10+ new entries
- Before starting a major project phase
- When finding contradictory information
- Monthly maintenance (if remembered)

---

## Curation Process

### 1. Audit Current State
- Read entire KNOWLEDGE.md
- Count entries per category
- Identify outdated information

### 2. Categorization Health Check

Standard categories:
```markdown
## 🗄️ Database & Supabase
## 🎨 UI & Components
## 🔐 Authentication & Security
## 🚀 Deployment & DevOps
## 📦 Dependencies & Tooling
## 🎯 Skills Created
## General Lessons Learned
```

### 3. Pruning Criteria

| Condition | Action |
|-----------|--------|
| Entry > 6 months old + superseded | Remove |
| Entry contradicts newer entry | Remove older |
| Entry is too vague to be actionable | Rewrite or remove |
| Entry duplicates another | Merge |
| Entry no longer relevant (deprecated tech) | Archive |

### 4. Quality Improvements

For each entry, ensure:
- Date is present `[YYYY-MM-DD]`
- Context is bold `**Context**:`
- Lesson is specific and actionable
- Proper category assignment

### 5. Archive (if needed)

Move historical entries to `backlog/docs/knowledge-archive.md`

---

## Entry Format

**Good:**
```markdown
* [2026-01-07] **RLS Policy Bug**: Always test RLS policies with `auth.uid()` null check for anonymous users.
```

**Bad:**
```markdown
* Fixed a bug with auth
```

---

## Maintenance Template

After curation, log:
```markdown
## General Lessons Learned
* [YYYY-MM-DD] **Knowledge Curation**: Pruned X entries, reorganized Y, archived Z.
```

---

## Integration

- Trigger via self-reflection if KNOWLEDGE.md is getting large
- Run before major milestones
- Consider after every 10 tasks completed
