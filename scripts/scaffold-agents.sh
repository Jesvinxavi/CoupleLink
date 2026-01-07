#!/bin/bash

# Scaffold Agent & Backlog Environment v2.0 (Optimized)
# Usage: ./scaffold-agents.sh

echo "🚀 Initializing Agent & Backlog Environment..."

# 1. Create Directories
mkdir -p .agent/workflows
mkdir -p backlog/templates
mkdir -p backlog/tasks
mkdir -p backlog/milestones
mkdir -p backlog/specs
mkdir -p scripts

# 2. Write Config (Backlog.md)
echo "📝 Writing Backlog Configuration..."
cat > backlog/config.yml <<EOF
project_name: "My Project"
default_status: "To Do"
statuses: ["Thinking", "To Do", "In Progress", "In Review", "Done"]
labels: []
milestones: []
date_format: yyyy-mm-dd
web_ui:
  default_port: 6420
  auto_open_browser: true
EOF

# 3. Write AGENTS.md (The Brain)
echo "🧠 Writing Agent Instructions..."
cat > backlog/AGENTS.md <<EOF
# AI Agent Protocols

This project uses \`backlog.md\` for task management. As an AI agent, you can read and write tasks directly to the filesystem.

## Agent Workflows
To ensure quality, you MUST use these standardized workflows:
- **Starting**: Use \`/start-task\` (Sets status, creates branch, analyzes requirements).
- **Finishing**: Use \`/finish-task\` (Runs build, updates Context, updates Knowledge Base).
- **Architecting**: Use \`/create-spec\` (Analyzes code, writes spec, creates multiple tasks).
- **Utilities**: Use \`/update-types\` (Syncs Supabase types).

## Task File Structure
All tasks are stored in \`backlog/tasks/\`.
Naming convention: \`task-<ID> - <TITLE>.md\` (e.g., \`task-1 - Fix Login.md\`).

Frontmatter REQUIRED:
\`\`\`yaml
---
id: 1
title: Fix Login
status: To Do    # Options: Thinking, To Do, In Progress, In Review, Done
created: 2026-01-01
priority: P2     # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: M        # XS, S, M, L, XL
---
\`\`\`

## "In Review" - The Handover Protocol
- When a CLI Agent (Gemini/Vibe) finishes work, it MUST set status to \`In Review\`.
- This signals Antigravity (Chat Agent) to inspect the code before marking \`Done\`.

## Task Templates
When creating new tasks, ALWAYS start by copying the structure from \`backlog/templates/\`.
- **New Feature**: Use \`backlog/templates/feature.md\` -> Forces us to identify context files first.
- **Bug Fix**: Use \`backlog/templates/bug.md\` -> Forces us to write a reproduction step.
- **Refactor**: Use \`backlog/templates/refactor.md\` -> Forces risk analysis.
- **Maintenance**: Use \`backlog/templates/chore.md\` -> Simple checklist format.

## Subtasks & Breakdowns
All subtasks MUST be implemented as Markdown Checklists within the main task file.
Do NOT create separate child task files unless the scope is massive.

**Format:**
\`\`\`markdown
## Implementation Plan
- [ ] Subtask 1
- [ ] Subtask 2
\`\`\`
EOF

# 4. Write Templates
echo "📄 Writing Templates..."

# Feature (Enhanced)
cat > backlog/templates/feature.md <<EOF
---
id: 0
title: Feature Title
status: Thinking
created: 2026-01-01
labels: ["Feature"]
priority: P2      # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: M         # XS, S, M, L, XL
---

# Feature Description
*A concise description of what we are building and why.*

# Context Files
*List the files relevant to this task so Antigravity knows where to look immediately.*
- \`src/components/...\`
- \`src/utils/...\`

# Acceptance Criteria
*When is this feature "truly done"? Be specific.*
- [ ] User can do X
- [ ] System responds with Y
- [ ] Edge case Z is handled

# Implementation Plan
*Break it down into small, verifiable steps.*
- [ ] Step 1
- [ ] Step 2

# Verification
*How will we prove it works?*
- [ ] Automated Test: \`npm test ...\`
- [ ] Manual Check: Click X button
EOF

# Bug (Enhanced)
cat > backlog/templates/bug.md <<EOF
---
id: 0
title: Bug Title
status: To Do
created: 2026-01-01
labels: ["Bug"]
priority: P1      # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: S         # XS, S, M, L, XL
---

# Expected Behavior
*What SHOULD happen?*

# Actual Behavior
*What IS happening instead?*

# Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

# Root Cause Analysis
*Antigravity should determine this before writing code.*

# Fix Plan
- [ ] Write test to reproduce bug
- [ ] Fix the code
- [ ] Verify fix passes test
EOF

# Refactor (Enhanced)
cat > backlog/templates/refactor.md <<EOF
---
id: 0
title: Refactor Title
status: To Do
created: 2026-01-01
labels: ["Refactor"]
priority: P2      # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: M         # XS, S, M, L, XL
---

# Refactor Goal
*What are we cleaning up and why?*

# Risk Analysis
*What could break? Which features depend on this code?*

# Implementation Plan
- [ ] Create safety snapshot/branch
- [ ] Write tests for existing behavior (if missing)
- [ ] Refactor the code
- [ ] Run existing tests
- [ ] Verify nothing changed in UI behavior
EOF

# Chore (Enhanced)
cat > backlog/templates/chore.md <<EOF
---
id: 0
title: Chore Title
status: To Do
created: 2026-01-01
labels: ["Chore"]
priority: P3      # P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
effort: XS        # XS, S, M, L, XL
---

# Chore Description
*Maintenance task (e.g., upgrade dependency, update docs).*

# Checklist
- [ ] Perform the task
- [ ] Verify build passes
- [ ] Update documentation if needed
EOF

# 5. Write Workflows
echo "⚡ Writing Workflows..."

# Start Task (Enhanced with Hive Mind)
cat > .agent/workflows/start-task.md <<EOF
---
description: Start working on a backlog task
---

This workflow automates the process of picking up a task from the backlog.
It handles git branching and updates the task status.

0. **Read the Hive Mind.**
   - Read \`backlog/KNOWLEDGE.md\` to understand past lessons and gotchas.
   - Apply any relevant knowledge to the upcoming task.
1. **Ask the user for the Task ID.** (e.g., "1")
2. **Read the Task File.**
   - Locate \`backlog/tasks/task-<ID> - <Title>.md\`.
   - Read its content to understand the requirements.
3. **Update Status to "In Progress".**
   - Edit the YAML frontmatter: \`status: In Progress\`.
4. **Create a Git Branch.**
   - Format: \`task-<ID>-<kebab-case-title>\`
   - Run: \`git checkout -b task-<ID>-...\`
5. **Analyze Requirements.**
   - If it's a "Feature" template, identify the Context Files and **Acceptance Criteria**.
   - If it's a "Bug" template, identify the **Expected/Actual Behavior** and Reproduction Steps.
6. **Confirm to User.**
   - "I have started Task <ID>. I am on branch <branch>. I am ready to code."
EOF

# Finish Task
cat > .agent/workflows/finish-task.md <<EOF
---
description: Complete a task with quality gates and memory updates
---

This workflow standardizes the "Definition of Done".
It prevents tasks from being closed without context and lessons learned.

1.  **Identify Current Task.**
    *   Ask user/check branch name (e.g., \`task-5\`).
2.  **Run Quality Checks.**
    *   Run \`npm run build\` (or equivalent).
    *   **If fail**: ABORT. Report error to user.
3.  **Context Binding (Automatic).**
    *   Run \`git diff --name-only main...HEAD\`.
    *   Update \`backlog/tasks/task-5...md\` to add:
        \`\`\`markdown
        # Context (Auto-Generated)
        - \`src/modified/file.ts\`
        \`\`\`
4.  **Hive Mind (Memory).**
    *   Ask the agent: "What is one specific lesson or gotcha from this task?"
    *   Append this to \`backlog/KNOWLEDGE.md\` under the appropriate category.
5.  **Status Update.**
    *   Move card to "Done" (or "In Review") in YAML.
    *   Commit changes: \`chore: complete task 5\`.
EOF

# Create Spec
cat > .agent/workflows/create-spec.md <<EOF
---
description: Convert a vague idea into a technical specification
---

This workflow turns "I want X" into a rigorous plan.
**Use this BEFORE creating a task.**

1.  **Understand the Goal.**
    *   Ask user for the feature name (e.g., "Dark Mode").
2.  **Analyze the Codebase.**
    *   Read \`package.json\`, \`index.css\`, and relevant components.
3.  **Draft a Specification.**
    *   Create \`backlog/specs/feature-dark-mode.md\`.
    *   Include:
        *   User Stories
        *   Technical Implementation
        *   Database Changes (if any)
4.  **Review.**
    *   Ask user to review the spec.
5.  **Generate Tasks (Scaling Logic).**
    *   **Small Feature (< 10 tasks)**: Generate tasks directly with \`backlog task create\`.
    *   **Massive Project (> 10 tasks)**:
        *   Create a Milestone: \`backlog/milestones/m-<ID> - <Title>.md\`.
        *   Generate all tasks and link them: \`backlog task create ... --milestone <ID>\`.
EOF

# Update Types (Supabase specific)
cat > .agent/workflows/update-types.md <<EOF
---
description: Update Supabase TypeScript types
---

This workflow keeps your frontend in sync with your database.
**Run this after any migration or Dashboard edit.**

1.  **Login to Supabase (if needed).**
    *   Check if \`npx supabase\` is authenticated.
2.  **Generate Types.**
    *   Run: \`npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/supabase.ts\`
    *   *Note: Ask user for Project ID if unknown.*
3.  **Commit.**
    *   \`git add src/types/supabase.ts\`
    *   \`git commit -m "chore: update database types"\`
EOF

# 6. Init Knowledge Base (with categories)
echo "📘 Initializing Knowledge Base..."
cat > backlog/KNOWLEDGE.md <<EOF
# The Hive Mind (Project Knowledge Base)

This file contains accumulated wisdom from completed tasks.
**Agents MUST read this file before starting complex tasks.**

---

## 🗄️ Database & Supabase
*Lessons about schemas, RLS policies, and migrations.*

## 🎨 UI & Components
*Lessons about styling, component behavior, and responsive design.*

## 🔐 Authentication & Security
*Lessons about auth flows, tokens, and security considerations.*

## 🚀 Deployment & DevOps
*Lessons about builds, hosting, and environment configuration.*

## 📦 Dependencies & Tooling
*Lessons about package versions, compatibility, and build tools.*

---

## General Lessons Learned
*   [$(date +%Y-%m-%d)] **Initial Setup**: Environment created via scaffold-agents.sh v2.0.
EOF

# 7. Final Instructions
echo "✅ Done! Environment Scaffolded (v2.0 Optimized)."
echo ""
echo "Next Steps:"
echo "1. Run 'npx backlog.md init' if you haven't (to install the CLI binary)."
echo "2. Start the board: 'npx backlog.md browser'"
echo "3. Antigravity is ready to use /start-task and /create-spec."
