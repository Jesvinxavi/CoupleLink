---
description: Complete a task with quality gates and memory updates
---

This workflow standardizes the "Definition of Done".
It prevents tasks from being closed without context and lessons learned.

1.  **Identify Current Task.**
    *   Ask user/check branch name (e.g., `task-5`).
2.  **Run Quality Checks.**
    *   Run `npm run build` (or equivalent).
    *   **If fail**: ABORT. Report error to user.
3.  **Context Binding (Automatic).**
    *   Run `git diff --name-only main...HEAD`.
    *   Update `backlog/tasks/task-5...md` to add:
        ```markdown
        # Context (Auto-Generated)
        - `src/modified/file.ts`
        ```
4.  **Hive Mind (Memory).**
    *   Ask the agent: \"What is one specific lesson or gotcha from this task?\"
    *   Append this to `backlog/KNOWLEDGE.md` under the **appropriate category** (Database, UI, Auth, etc.).
5.  **Status Update.**
    *   Move card to "Done" (or "In Review") in YAML.
    *   Commit changes: `chore: complete task 5`.
