---
name: skill-orchestrator
description: Use during task creation (/create-task-spec) to analyze requirements and assign relevant skills. Ensures worker agents know which skills to load.
---

# Skill Orchestrator

## Purpose
Automatically analyze new tasks/specs and assign the most relevant skills to them. This bridges the gap between task creation and task execution.

## Trigger
Run this skill during:
1. `/create-task-spec` workflow (after spec is drafted)
2. Task creation (before status changes to "To Do")

## Core Instructions

### 1. Analyze the Task/Spec
Read the task content and identify:
- **Domain**: Frontend, Backend, Database, DevOps, Research
- **Complexity**: Simple (1 skill), Medium (2 skills), Complex (3+ skills)
- **Keywords**: UI, component, RLS, migration, API, investigation, refactor

### 2. Match Skills Using This Matrix

| Task Contains | Assign Skill(s) |
|---------------|-----------------|
| UI, component, page, styling, Tailwind | `frontend-mastery` |
| Database, RLS, migration, Supabase, Edge Function | `supabase-expert` |
| Bug, investigation, unclear, debug | `research-deep-dive` |
| Branch, commit, merge, PR | `git-operations` |
| Major architecture, new library, pattern change | `adr-manager` |
| Effort L/XL, vague requirements | `task-decomposer` |

### 3. Check for New Skills (Dynamic Discovery)
**Don't just use the matrix.** Read `backlog/AGENTS.md` to see if new skills have been added that match the task keywords.

### 4. Determine Sequencing (Elite Move)
Skills aren't just a list; they are a sequence.
- **Investigation First:** If `research-deep-dive` is needed, it always comes first.
- **Architecture Second:** If `adr-manager` is needed, it comes before coding.
- **Implementation Third:** `frontend-mastery` / `supabase-expert`.
- **Polish Last:** `test-strategist` / `quality-gate`.

### 5. Write to Task File
Add a `## Skills Sequence` section to the task markdown:

```markdown
## Skills Sequence (Auto-Assigned)
1. `research-deep-dive` - Investigate API limit (Primary)
2. `frontend-mastery` - Implement UI components
3. `test-strategist` - Add regression test
```

### 6. Update Frontmatter (Optional)
If task uses YAML frontmatter, add:
```yaml
skills: [research-deep-dive, frontend-mastery, test-strategist]
```

## Workflow Integration

**In `/create-task-spec` workflow:**
After step 4 (Review), before step 5 (Generate Tasks):
```
4.5 **Assign Skills & Sequence.**
    * Load `.agent/skills/skill-orchestrator/SKILL.md`
    * Identify skills + Sequence them (Research -> Architecture -> Code -> Test)
    * Add `## Skills Sequence` section to each generated task
```

## Verification
- [ ] At least one skill assigned to each task
- [ ] Skills match the task content (no random assignments)
- [ ] `## Skills` section added to task file
