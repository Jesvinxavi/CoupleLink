---
id: task-8
title: Local Verification of Scaffold Script
status: In Review
assignee: []
created_date: '2026-01-08 19:45'
labels:
  - Infrastructure
  - Skills-Migration
  - Testing
dependencies: [task-7]
priority: medium
effort: S
skills: [test-strategist]
spec: backlog/documents/feature-skills-migration.md
related_adr: backlog/decisions/adr-skills-remote-architecture.md
branch: feature/skills-migration
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify the new script works correctly using a local path simulation before pushing to GitHub.
<!-- SECTION:DESCRIPTION:END -->

## Context
- **Spec:** [Skills Migration](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/documents/feature-skills-migration.md)
- **ADR:** [Remote Skills Architecture](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/decisions/adr-skills-remote-architecture.md)
- **Branch:** `feature/skills-migration`

## Subtasks
- [ ] Configure script to use local `agent-skills-package/` as source
- [ ] Delete a specific skill (e.g., `task-decomposer`) from `.agent/skills/`
- [ ] Run the new script
- [ ] Verify the deleted skill is restored 1:1

## Skills Sequence
1. `test-strategist` - Verification
