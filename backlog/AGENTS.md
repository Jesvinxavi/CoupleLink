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
status: <STATUS> # One of: "To Do", "In Progress", "In Review", "Done"
created: <DATE> # YYYY-MM-DD
labels: []
---
```

## Workflow using Vibe Kanban & Antigravity
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
- When a CLI Agent (Gemini/Vibe) finishes work, it MUST set status to `In Review`.
- This signals Antigravity (Chat Agent) to inspect the code before marking `Done`.

## Task Templates
When creating new tasks, ALWAYS start by copying the structure from `backlog/templates/`.
- **New Feature**: Use `backlog/templates/feature.md` -> Forces us to identify context files first.
- **Bug Fix**: Use `backlog/templates/bug.md` -> Forces us to write a reproduction step.

## Subtasks & Breakdowns
All subtasks MUST be implemented as Markdown Checklists within the main task file.
All subtasks MUST be implemented as Markdown Checklists within the main task file.
Do NOT create separate child task files unless the scope is massive.

**Format:**
```markdown
## Implementation Plan
- [ ] Subtask 1
- [ ] Subtask 2
```
