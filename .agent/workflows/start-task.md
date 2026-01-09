---
description: Start working on a backlog task
---

This workflow picks up a task from the backlog and prepares for implementation.
**Note:** Feature branching happens in `/create-task-spec`. This workflow just loads skills and starts work.

---

## 0. Read the Hive Mind
- Read `backlog/KNOWLEDGE.md` to understand past lessons and gotchas.
- Apply any relevant knowledge to the upcoming task.

---

## 1. Identify the Task
- User provides Task ID (e.g., "6")
- **If no ID provided:**
  - Run `npx backlog.md task list --priority high` to see critical tasks.
  - Pick the top one.
- Locate `backlog/tasks/task-<ID> - <Title>.md`
- Read its content to understand requirements

---

## 2. Check Dependency Guardrails (CRITICAL)

**Read the `dependencies:` list in the task frontmatter.**
(e.g., `dependencies: [task-6]`)

- **If empty:** Proceed.
- **If populated:** Check the status of each dependent task.
  - If any dependency is NOT `Done`:
    - **STOP.** Do not start this task.
    - Notify user: "Task <ID> is blocked by <Dep-ID>. Please finish <Dep-ID> first."

---

## 3. Check Context Links
If stuck or need clarity:
- Read the `spec:` link in frontmatter for full feature context (usually in `backlog/specs/` or `backlog/docs/`)
- Read the `related_adr:` link for architectural decisions

---

## 4. Check Task-Decomposer Trigger
- If effort is L or XL, or task is vague → Load `.agent/skills/task-decomposer/SKILL.md`
- Break down into subtasks before proceeding

---

## 5. Update Status to "In Progress"
- Use CLI: `npx backlog.md task edit <ID> --status "In Progress"`

---

## 6. Verify Branch (Do NOT Create)

> [!IMPORTANT]
> Do NOT create a new branch. Feature branches are created in `/create-task-spec`.

**Read the `branch:` field from task frontmatter** to know which branch you should be on.

**Check current branch and switch if needed:**
```bash
git branch --show-current
# If wrong, switch to the branch specified in task frontmatter:
git checkout <branch-from-frontmatter>
```

**Valid scenarios:**
- Task has `branch: main` → You should be on `main`
- Task has `branch: feature/skills-migration` → You should be on `feature/skills-migration`

---

## 7. Load Relevant Skills
- Check `skills:` field in task frontmatter
- Read each skill's SKILL.md before coding
- Common mappings:
  - UI work → `frontend-mastery`
  - DB work → `supabase-expert`
  - Bugs → `research-deep-dive`

---

## 8. Implement the Task
- Follow the subtasks in the task file
- Mark subtasks complete as you go: `- [x]`
- **STOP** when implementation is complete.

---

## 9. Update Status to "In Review"
- Use CLI: `npx backlog.md task edit <ID> --status "In Review"`

---

## 10. Notify User
- Notify User: "Task <ID> implementation complete. Status updated to `In Review`. Ready for `@[/commit-task] <ID>`."

---

> [!NOTE]
> ## After Task Completion
> 
> 1. implementation ends. Agent notifies user.
> 2. User invokes `@[/commit-task]` (or agent requests it).
> 3. Repeat `/start-task` for next task.
> 4. After ALL tasks: Run `/finish-spec`.
