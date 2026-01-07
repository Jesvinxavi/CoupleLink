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
3. **Update Status to "In Progress".**
   - Edit the YAML frontmatter: `status: In Progress`.
   - Identify the user running the command (Jesvin or Agent).
4. **Create a Git Branch.**
   - Format: `task-<ID>-<kebab-case-title>`
   - Run: `git checkout -b task-<ID>-...`
5. **Analyze Requirements.**
   - If it's a "Feature" template, identify the Context Files listed.
   - If it's a "Bug" template, identify the Reproduction Steps.
6. **Confirm to User.**
   - "I have started Task <ID>. I am on branch <branch>. I am ready to code."
