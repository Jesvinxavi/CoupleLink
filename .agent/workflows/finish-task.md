---
description: Complete a task with quality gates and memory updates
---

This workflow standardizes the "Definition of Done".
It prevents tasks from being closed without context and lessons learned.

1.  **Identify Current Task.**
    *   Ask user/check branch name (e.g., `task-5`).

2.  **Run Quality-Gate Skill.**
    *   Load `.agent/skills/quality-gate/SKILL.md`
    *   Run `npm run build` (or equivalent).
    *   **If fail**: ABORT. Report error to user.
    *   Complete all applicable skill checklists.

3.  **Context Binding (Automatic).**
    *   Run `git diff --name-only main...HEAD`.
    *   Update `backlog/tasks/task-5...md` to add:
        ```markdown
        # Context (Auto-Generated)
        - `src/modified/file.ts`
        ```

4.  **Run Self-Reflection Skill.**
    *   Load `.agent/skills/self-reflection/SKILL.md`
    *   Answer: "What went well? What could improve?"
    *   Capture at least one lesson learned.
    *   Append to `backlog/KNOWLEDGE.md` under the **appropriate category**.

5.  **Check Context-Curator Trigger.**
    *   If `KNOWLEDGE.md` > 200 lines, run context-curator skill.

6.  **Status Update.**
    *   Move card to "Done" (or "In Review") in YAML.
    *   Commit changes: `chore: complete task 5`.
