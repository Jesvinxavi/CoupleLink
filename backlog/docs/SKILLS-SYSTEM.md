# Skills System Walkthrough

## Overview

This project uses a **Skills System** to give agents specialized knowledge for specific task types.

---

## Skills Available

### Domain Skills
| Skill | Purpose |
|-------|---------|
| `frontend-mastery` | UI/UX, Tailwind, animations |
| `supabase-expert` | Database, RLS, migrations |
| `research-deep-dive` | Investigation before coding |
| `git-operations` | Branching, commits, PRs |

### Meta-Skills (Autonomous Improvement)
| Skill | Trigger |
|-------|---------|
| `skill-creator` | 80%+ confidence to create new skill |
| `adr-manager` | Architectual decisions (new tech, major patterns) |
| `self-reflection` | After /finish-task |
| `workflow-creator` | 3+ repeated sequences |
| `context-curator` | KNOWLEDGE.md > 200 lines |
| `task-decomposer` | L/XL effort tasks |
| `quality-gate` | Before "In Review" status |

---

## How It Works

```
New Task
    ↓
┌─────────────────────────────────┐
│ Check effort: L/XL or vague?    │
│ → Yes: Run task-decomposer      │
└─────────────────────────────────┘
    ↓
Load domain skills (frontend-mastery, supabase-expert, etc.)
    ↓
Do Work
    ↓
┌─────────────────────────────────┐
│ Run quality-gate                │
│ → Build check                   │
│ → Skill checklists              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Run self-reflection             │
│ → What went well?               │
│ → Update KNOWLEDGE.md           │
└─────────────────────────────────┘
    ↓
Done
```

---

## Using Skills

1. **Read the SKILL.md** before starting work
2. **Follow Core Instructions** in the skill
3. **Complete Verification checklist** before marking done
4. **Reference resources/** for detailed patterns

---

## Creating New Skills

Use the `skill-creator` meta-skill when:
- Same pattern used 3+ times
- Critical domain knowledge missing
- Repeated mistakes a skill could prevent

Requires **80%+ confidence** to trigger.

---

## File Locations

- Skills: `.agent/skills/<skill-name>/SKILL.md`
- Workflows: `.agent/workflows/<workflow>.md`
- Knowledge: `backlog/KNOWLEDGE.md`
- Agent Instructions: `backlog/AGENTS.md`
