---
id: task-12
title: Implement Elite Scaffold Script Logic
status: Done
assignee: []
created_date: '2026-01-09'
updated_date: '2026-01-09 02:07'
labels: []
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rewrite `scripts/scaffold-agents.sh` to support versioning, config merging/backup, and `backlog init` integration.
<!-- SECTION:DESCRIPTION:END -->

## Context
- **Spec:** [Elite Scaffold Improvements](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/specs/feature-elite-scaffold-improvements.md)
- **Repo:** `jesvinxavi/agent-skills`

## Subtasks
- [ ] Add `VERSION` variable and remote version check logic
- [ ] Add `backlog init --defaults` pre-step
- [ ] Implement `config.yml` backup logic (if exists, mv to .bak)
- [ ] Implement `backlog completion` install attempt
- [ ] Verify script with a dry run (or safe test)

## Skills Sequence
1. `test-strategist` - Define safe test cases (don't nuke local config)
2. `git-operations` - Commit changes
