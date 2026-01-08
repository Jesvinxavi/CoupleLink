---
title: Remote Skills Repository Architecture
status: accepted
date: 2026-01-08
context: Skills migration to centralized repo
---

# ADR: Remote Skills Repository Architecture

## Context
The current `scaffold-agents.sh` script embeds all 15 skills and workflows as heredocs (~1400 lines). This makes:
- Adding new skills require editing the script
- Keeping skills in sync across projects difficult
- The script hard to maintain

## Decision
Move the source of truth for skills/workflows to a dedicated GitHub repository (`jesvinxavi/agent-skills`). The scaffold script will clone/pull from this remote and copy files locally.

## Consequences

### Positive
- Single source of truth across all projects
- Adding a skill = push to repo (no script editing)
- Script reduced from 1400 to ~200 lines
- Version control for skills themselves

### Negative
- Requires network access to scaffold (first time)
- New dependency on external repo availability
- Must push to GitHub before script works remotely

### Neutral
- CoupleLink's existing `.agent/` folder remains untouched (not deleted)

## Alternatives Considered
1. **Local global folder (`~/.agent-skills/`)** - Rejected: not cloud-synced, not shareable
2. **npm package** - Rejected: overkill for this use case
3. **Keep heredocs** - Rejected: doesn't scale
