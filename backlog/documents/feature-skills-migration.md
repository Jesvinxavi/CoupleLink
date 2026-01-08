---
title: Feature Spec: Centralized Agent Skills Repository (Migration)
type: doc
created: 2026-01-08
context: Refactoring skills system to remote repo
---

# Feature Spec: Centralized Agent Skills Repository (Migration)

## 1. Overview
Refactor the Agent Skills System from a monolithic `scaffold-agents.sh` script (using heredocs) to a centralized architecture where skills and workflows are hosted in a GitHub repository (`jesvinxavi/agent-skills`) and pulled dynamically.

**Goal:**
- `scaffold-agents.sh` becomes a lightweight "installer" (< 200 lines).
- Single source of truth for all projects.
- Easier maintenance and scalability.

---

## 2. User Stories
*   As a **Developer**, I want to add a skill to one repo and have it available in all my projects.
*   As a **Project Lead**, I want to initialize a new repo with specific, up-to-date skills without copying giant scripts.
*   As the **Agent**, I want to ensure my tools are always consistent across environments.

---

## 3. Technical Implementation

### A. Repository Structure (`jesvinxavi/agent-skills`)
We will prepare a directory `agent-skills-package/` in the current workspace with the following structure, ready to be pushed to GitHub:

```text
/
├── skills/                     # source: .agent/skills/
│   ├── project-decomposer/
│   ├── task-decomposer/
│   ├── frontend-mastery/
│   └── ... (all 15 skills)
├── workflows/                  # source: .agent/workflows/
│   ├── create-project-spec.md
│   ├── create-task-spec.md
│   └── ...
└── docs/                       # source: backlog/docs/
    └── SKILLS-SYSTEM.md
```

### B. The Installer Script (`scaffold-agents.sh`)
Refactor the existing script to perform these steps:
1.  **Check Environment**: Ensure `git` is available.
2.  **Clone/Pull**:
    *   Target: `~/.agent-skills/source` (Global Cache) or `.agent/cache` (Local Cache).
    *   Decision: Use `.agent/.source-repo` to keep it self-contained within the project but ignored by git.
3.  **Sync**:
    *   `rsync` or `cp` files from `.source-repo/skills/` to `.agent/skills/`.
    *   `rsync` or `cp` files from `.source-repo/workflows/` to `.agent/workflows/`.
    *   `cp` docs.
4.  **Local Overrides**: (Optional for v2) Allow local project to override specific skills. For now, strict 1:1 sync.

### C. Logic Flow
```bash
REPO_URL="https://github.com/jesvinxavi/agent-skills.git"
CACHE_DIR=".agent/.cache/source"

echo "🔄 Syncing Agent Skills from Remote..."

if [ -d "$CACHE_DIR" ]; then
    cd "$CACHE_DIR" && git pull origin main
else
    git clone "$REPO_URL" "$CACHE_DIR"
fi

echo "📂 Installing Skills..."
cp -r "$CACHE_DIR/skills/"* ".agent/skills/"
# ... copy workflows and docs ...
```

---

## 4. Migration Plan

### Step 1: Extract Content
1.  Create `agent-skills-package/` directory.
2.  Copy all **live** files (not from script heredocs, but actual files on disk) to this package folder.
    *   *.agent/skills/*
    *   *.agent/workflows/*
    *   *backlog/docs/SKILLS-SYSTEM.md*

### Step 2: Refactor Script
1.  Backup `scaffold-agents.sh` to `scaffold-agents-legacy.sh`.
2.  Rewrite `scaffold-agents.sh` to implement the logic in Section 3B.
    *   **Crucial**: Since the repo doesn't exist yet, the script will initially try to clone from the local `agent-skills-package` path for testing, then switch to the URL.

### Step 3: Verification
1.  Delete `.agent/skills/task-decomposer` (simulate fresh install).
2.  Run new script.
3.  Verify `task-decomposer` reappears.

---

## 5. Risks & Mitigations
*   **Risk**: GitHub repo doesn't exist yet.
    *   **Mitigation**: I will provide instructions for the user to push the `agent-skills-package` code. The script will be set to the GitHub URL, so it will fail until the user pushes. I can add a flag or comment to point to the local folder for immediate verification.
*   **Risk**: Network failure.
    *   **Mitigation**: Script exits if clone fails, preserving existing local files if they exist.

## 6. Definition of Done
- [ ] `agent-skills-package/` directory created with all 15 skills + workflows.
- [ ] `scaffold-agents.sh` rewritten (< 200 lines).
- [ ] Script successfully populates `.agent/` from the source (verified locally).
- [ ] Fallback/Error handling in place.

---

## 7. Skills Sequence (Auto-Assigned)
1. `git-operations` - Bash scripting, file management

---

## 8. Implementation Tasks

### Task 1: Create agent-skills-package Folder
**Effort:** M  
**Description:** Create `agent-skills-package/` with subdirectories for skills, workflows, docs. Copy all current files from `.agent/` and `backlog/docs/SKILLS-SYSTEM.md`.

### Task 2: Backup and Rewrite scaffold-agents.sh
**Effort:** L  
**Description:** Create `scaffold-agents-legacy.sh` backup. Rewrite main script to clone from GitHub URL, copy files to `.agent/`.

### Task 3: Local Verification
**Effort:** S  
**Description:** Temporarily delete `.agent/skills/task-decomposer`. Run script with local source. Verify file is recreated.

### Task 4: GitHub Push Instructions
**Effort:** XS  
**Description:** Provide user with commands to push `agent-skills-package/` to `jesvinxavi/agent-skills` repo.

---

## 9. ADR Check
**Does this introduce new technology, patterns, or architecture changes?**
→ **YES** - Changes the source-of-truth for skills from embedded heredocs to an external Git repository.

**ADR Required:** `backlog/decisions/adr-skills-remote-architecture.md`

---

## 10. Testing Strategy
| Impact | Low - infrastructure, no user-facing changes |
|--------|----------------------------------------------|
| Test Type | Manual Verification |
| Test Plan | 1. Delete a skill folder. 2. Run script. 3. Verify skill restored. |

No automated tests required (bash script, not application code).

