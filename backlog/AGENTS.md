# Backlog.md Agent Instructions

This project uses `backlog.md` for task management. As an AI agent, you can read and write tasks directly to the filesystem.

## Agent Workflows
To ensure quality, you MUST use these standardized workflows:
- **Starting**: Use `/start-task` (Sets status, creates branch, analyzes requirements).
- **Finishing**: Use `/finish-task` (Runs build, updates Context, updates Knowledge Base).
- **Architecting**: Use `/create-spec` (Analyzes code, writes spec, creates multiple tasks).
- **Utilities**: Use `/update-types` (Syncs Supabase types).

## Task File Structure
All tasks are stored in `backlog/tasks/`.
Naming convention: `task-<ID> - <TITLE>.md` (e.g., `task-1 - Fix Login.md`).

## Task Format
Every task file MUST start with this YAML Frontmatter:

```yaml
---
id: <ID>        # Integer, must be unique. Check existing files to find next ID.
title: <TITLE>  # String, same as filename title.
status: <STATUS> # One of: "Thinking", "To Do", "In Progress", "In Review", "Done"
created: <DATE> # YYYY-MM-DD
priority: P2    # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: M       # XS, S, M, L, XL
labels: []
---
```

## Task Lifecycle
1. **Creation**: Create a new file in `backlog/tasks/` with `status: To Do`.
2. **Implementation**:
    - Change status to `In Progress`.
    - Create a git branch `tasks/task-<ID>`.
    - Do the work.
3. **Review**:
    - Change status to `In Review`.
    - Notify the user or Antigravity to review.
4. **Completion**:
    - Change status to `Done`.
    - Move file to `backlog/archive/tasks/` (Optional, or just leave in tasks with Done status).

## "In Review" - The Handover Protocol
- When an Agent finishes work, it MUST set status to `In Review`.
- This signals the user or reviewing agent to inspect the code before marking `Done`.

## Task Templates
When creating new tasks, ALWAYS start by copying the structure from `backlog/templates/`.
- **New Feature**: Use `backlog/templates/feature.md` -> Forces us to identify context files first.
- **Bug Fix**: Use `backlog/templates/bug.md` -> Forces us to write a reproduction step.
- **Refactor**: Use `backlog/templates/refactor.md` -> Forces risk analysis.
- **Maintenance**: Use `backlog/templates/chore.md` -> Simple checklist format.

## Subtasks & Breakdowns
All subtasks MUST be implemented as Markdown Checklists within the main task file.
Do NOT create separate child task files unless the scope is massive.

**Format:**
```markdown
## Implementation Plan
- [ ] Subtask 1
- [ ] Subtask 2
```

## Skill Loading Protocol

Skills are specialized instructions in `.agent/skills/`. Load them dynamically based on task type.

**Available Skills:**
| Skill | When to Load |
|-------|--------------|
| `frontend-mastery` | UI components, styling, pages |
| `supabase-expert` | Database, RLS, migrations, Edge Functions |
| `research-deep-dive` | Complex investigations, debugging |
| `git-operations` | Branching, commits, PRs |
| `skill-creator` | Creating new skills (80%+ confidence) |
| `self-reflection` | After completing tasks (auto via /finish-task) |
| `workflow-creator` | Automating repeated multi-step processes |
| `context-curator` | Managing KNOWLEDGE.md (when >200 lines) |
| `task-decomposer` | Breaking down vague/large requests |
| `quality-gate` | Self-review before "In Review" status |
| `adr-manager` | Record architectural decisions (backlog/decisions) |
| `skill-orchestrator` | Auto-assign skills to tasks (via /create-spec) |
| `test-strategist` | Evaluate test needs, select type, write tests |
| `project-decomposer` | Project initialization (PRD, Tech Spec, Architecture) |

**How to Use:**
1. Read the `SKILL.md` for the relevant skill before starting work
2. Follow the skill's Core Instructions
3. Use the skill's Verification checklist before marking done
4. Reference `resources/` files for detailed patterns

**Task → Skill Mapping:**
- Task Spec Creation → `skill-orchestrator` (assigns skills to generated tasks)
- Feature (Major) → `adr-manager` → `task-decomposer`
- Bug → `research-deep-dive` → domain skill → `quality-gate`
- Refactor → `frontend-mastery` or `supabase-expert` → `quality-gate`
- Chore → `git-operations` → `quality-gate`
- Task Complete → `self-reflection` (always)
