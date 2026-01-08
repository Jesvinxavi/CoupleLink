---
name: git-operations
description: Use when managing branches, commits, merges, or any git workflow. Ensures consistent commit messages and proper branch hygiene.
---

# Git Operations Skill

Load this skill for version control operations.

## Core Instructions

1. **Branch Naming**
   - Features: `feat/<task-id>-<short-description>`
   - Bugs: `fix/<task-id>-<short-description>`
   - Chores: `chore/<description>`
   - Tasks: `task-<id>-<kebab-case-title>`

2. **Commit Messages** (Conventional Commits)
   ```
   <type>(<scope>): <description>
   
   [optional body]
   ```
   
   Types:
   - `feat` - New feature
   - `fix` - Bug fix
   - `refactor` - Code change without feature/fix
   - `chore` - Maintenance tasks
   - `docs` - Documentation only
   - `style` - Formatting, no code change
   - `test` - Adding tests

3. **Workflow**
   - Always pull before starting work
   - Commit frequently with meaningful messages
   - Push at end of work session
   - Create PR when ready for review

## Examples

**Good Commits:**
```
feat(challenges): add weekly challenge reset logic
fix(auth): handle expired refresh tokens gracefully
chore: update supabase types after migration
```

**Bad Commits:**
```
fixed stuff
wip
updates
```

## Guidelines

- Never force push to main/master
- Squash trivial commits before merge
- Write PR descriptions that explain "why"
- Link commits to task IDs when relevant

## Verification

- [ ] Branch name follows convention
- [ ] Commits use conventional format
- [ ] No secrets committed
- [ ] .gitignore updated if new file types added
