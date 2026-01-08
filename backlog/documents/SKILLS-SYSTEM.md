---
title: Skills System Walkthrough
type: doc
created: 2026-01-07
updated: 2026-01-08
---

# Skills System Walkthrough

## Overview

This project uses a **Skills System** to give agents specialized knowledge for specific task types.
**Total Skills: 17** (4 Domain + 13 Meta)

---

## Skills Available

### Domain Skills (4)
| Skill | Purpose |
|-------|---------|
| `frontend-mastery` | UI/UX, Tailwind, animations |
| `supabase-expert` | Database, RLS, migrations |
| `research-deep-dive` | Investigation before coding |
| `git-operations` | Branching, commits, PRs |

### Meta-Skills (13)
| Skill | Trigger |
|-------|---------|
| `skill-creator` | 80%+ confidence to create new skill |
| `adr-manager` | Architectural decisions (new tech, major patterns) |
| `self-reflection` | After /finish-task |
| `workflow-creator` | 3+ repeated sequences |
| `context-curator` | KNOWLEDGE.md > 200 lines |
| `task-decomposer` | L/XL effort tasks, `/create-task-spec` |
| `quality-gate` | Before "In Review" status |
| `skill-orchestrator` | Auto-assign skills during spec creation |
| `test-strategist` | Evaluate test needs, write tests |
| `project-decomposer` | New project initialization (PRD, Tech Spec) |
| `github-automator` | Automate GitHub actions (create repo, issues, PRs) |
| `comprehensive-audit` | Deep review of spec implementation for robustness |

---

## Key Workflows

| Workflow | Purpose |
|----------|---------|
| `/create-project-spec` | New repo → Vision → Docs (PRD, Tech Spec) → Bootstrap |
| `/create-task-spec` | Feature idea → Spec → Tasks |
| `/start-task` | Begin work on a backlog item |
| `/finish-task` | Quality gate + Self-reflection |

---

## How It Works

```
New Project? → /create-project-spec
    ↓ (project-decomposer)
PRD.md, TECH-SPEC.md, ARCHITECTURE.md
    ↓
Repo Scaffolded
    ↓
New Feature? → /create-task-spec
    ↓ (task-decomposer + skill-orchestrator)
Spec + Tasks with Skills Assigned
    ↓
/start-task → Do Work → /finish-task
    ↓ (quality-gate + self-reflection)
Done
```

---

## Using Skills

1. **Read the SKILL.md** before starting work
2. **Follow Core Instructions** in the skill
3. **Complete Verification checklist** before marking done
4. **Reference resources/** for detailed patterns

---

## File Locations

- Skills: `.agent/skills/<skill-name>/SKILL.md`
- Workflows: `.agent/workflows/<workflow>.md`
- Knowledge: `backlog/KNOWLEDGE.md`
- Agent Instructions: `backlog/AGENTS.md`

