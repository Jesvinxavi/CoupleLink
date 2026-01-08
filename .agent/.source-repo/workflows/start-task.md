---
description: Start working on a backlog task
---

This workflow automates the process of picking up a task from the backlog.
It handles git branching and updates the task status.

0. **Read the Hive Mind.**
   - Read `backlog/KNOWLEDGE.md` to understand past lessons and gotchas.
   - Apply any relevant knowledge to the upcoming task.

1. **Ask the user for the Task ID.** (e.g., "1")

2. **Read the Task File.**
   - Locate `backlog/tasks/task-<ID> - <Title>.md`.
   - Read its content to understand the requirements.

3. **Check Task-Decomposer Trigger.**
   - If effort is L or XL, or request is vague → Load `.agent/skills/task-decomposer/SKILL.md`
   - Break down into subtasks before proceeding.

4. **Update Status to "In Progress".**
   - Edit the YAML frontmatter: `status: In Progress`.

5. **Create a Git Branch.**
   - Format: `task-<ID>-<kebab-case-title>`
   - Run: `git checkout -b task-<ID>-...`

6. **Load Relevant Skills.**
   - Feature → `frontend-mastery` + `supabase-expert` (if DB changes)
   - Bug → `research-deep-dive`
   - Read SKILL.md files before coding.

7. **Confirm to User.**
   - "I have started Task <ID>. I am on branch <branch>. Skills loaded: [list]. Ready to code."
