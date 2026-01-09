# Feature Spec: Elite Agent Scaffold Script 🚀

## Goal
Upgrade `scaffold-agents.sh` to be a production-grade, "elite" installer that handles versioning, configuration merging, and intelligent setup for new projects.

## User Scenarios
1.  **New Project**: `curl ... | bash` → Sets up EVERYTHING (backlog, agents, config, knowledge).
2.  **Upgrade**: `./scaffold-agents.sh` → Updates skills but preserves custom user config.
3.  **Audit**: `./scaffold-agents.sh --check-updates` → Tells user if a new version exists.

## Proposed Changes

### 1. Versioning System
- **Implementation**: Add `VERSION="2.0.0"` variable to script.
- **Remote Check**: Fetch `remote_version` from GitHub raw `scaffold-agents.sh` and compare.

### 2. Intelligent Config Merging
- **Current Behavior**: Overwrites `backlog/config.yml`.
- **New Behavior**:
    - If `backlog/config.yml` exists: Parse it (simple grep/sed) to keep user settings, merge new defaults only if missing.
    - Or simpler: Backup existing config to `config.yml.bak` and warn user.

### 3. `backlog init` Integration
- Run `backlog init --defaults` *before* our setup to ensure basic Backlog.md structure exists.
- Then apply our "Elite" overlays (templates, agents.md).

### 4. Starter Knowledge Base
- Create `backlog/docs/KNOWLEDGE-STARTER.md` in the package.
- On install, if `backlog/KNOWLEDGE.md` is missing, copy starter to valid path.

### 5. Shell Completion
- Attempt to install `backlog completion` for the active shell (zsh/bash).

## Detailed Implementation Plan

### Script Logic Flow
1.  **Pre-flight**: Check git, npm, backlog.md.
2.  **Backlog Init**: Run `npx backlog.md init --defaults` (idempotent).
3.  **Source Fetch**: Clone `jesvinxavi/agent-skills`.
4.  **Install/Update**:
    - Skills (overwrite)
    - Workflows (overwrite)
    - AGENTS.md (overwrite)
    - Templates (overwrite)
    - **Config**: Check exists -> Backup -> Install Default -> (Manual Merge needed by user is safest).
5.  **Post-Flight**:
    - Completion install.
    - Version check.

## Files to Create/Modify
1.  `scripts/scaffold-agents.sh` (The Brain)
2.  `agent-skills-package/backlog/docs/KNOWLEDGE-STARTER.md` (The Seed)

## Generated Tasks (Auto-Generated)
- [x] [Task-12: Implement Elite Script Logic](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/tasks/task-12%20-%20Implement-Elite-Scaffold-Script-Logic.md)
- [x] [Task-13: Create Starter Knowledge Base](file:///Users/jesvinxavi/Downloads/CoupleLink-main/backlog/tasks/task-13%20-%20Create-Starter-Knowledge-Base.md)

## Files Changed (Auto-Generated)
- `agent-skills-package/backlog/docs/KNOWLEDGE-STARTER.md`
- `backlog/config.yml`
- `backlog/specs/feature-elite-scaffold-improvements.md`
- `backlog/tasks/task-12 - Implement-Elite-Scaffold-Script-Logic.md`
- `backlog/tasks/task-13 - Create-Starter-Knowledge-Base.md`
- `scripts/scaffold-agents.sh`
