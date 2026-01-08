---
id: task-7
title: Backup and Rewrite scaffold-agents.sh
status: Done
assignee: []
created_date: '2026-01-08 19:45'
labels:
  - Infrastructure
  - Skills-Migration
dependencies: [task-6]
priority: high
effort: L
skills: [git-operations]
spec: backlog/documents/feature-skills-migration.md
related_adr: backlog/decisions/adr-skills-remote-architecture.md
branch: feature/skills-migration
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refactor the monolithic `scaffold-agents.sh` script (~1400 lines) to be a lightweight installer (~50 lines) that pulls from the remote GitHub repo.
<!-- SECTION:DESCRIPTION:END -->

## Context
- **Spec:** [Skills Migration](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/documents/feature-skills-migration.md)
- **ADR:** [Remote Skills Architecture](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/decisions/adr-skills-remote-architecture.md)
- **Branch:** `feature/skills-migration`

## Subtasks
- [ ] Backup current script to `scripts/scaffold-agents-legacy.sh`
- [ ] Rewrite `scripts/scaffold-agents.sh` with:
    - [ ] Check for `git` installation
    - [ ] Logic to clone/pull from `https://github.com/jesvinxavi/agent-skills.git`
    - [ ] Logic to copy files to `.agent/`
- [ ] Ensure execution permissions

## Skills Sequence
1. `git-operations` - Script editing
