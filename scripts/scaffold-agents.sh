#!/bin/bash

# Scaffold Agent & Backlog Environment v2.0 (Optimized)
# Usage: ./scaffold-agents.sh

echo "🚀 Initializing Agent & Backlog Environment..."

# 1. Create Directories
mkdir -p .agent/workflows
mkdir -p .agent/skills/frontend-mastery/resources
mkdir -p .agent/skills/supabase-expert/resources
mkdir -p .agent/skills/research-deep-dive
mkdir -p .agent/skills/git-operations/resources
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
- When an Agent finishes work, it MUST set status to \`In Review\`.
- This signals the user or reviewing agent to inspect the code before marking \`Done\`.

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

## Skill Loading Protocol

Skills are specialized instructions in \`.agent/skills/\`. Load them dynamically based on task type.

**Available Skills:**
| Skill | When to Load |
|-------|--------------|
| \`frontend-mastery\` | UI components, styling, pages |
| \`supabase-expert\` | Database, RLS, migrations, Edge Functions |
| \`research-deep-dive\` | Complex investigations, debugging |
| \`git-operations\` | Branching, commits, PRs |
| \`skill-creator\` | Creating new skills (80%+ confidence) |
| \`self-reflection\` | After completing tasks (auto via /finish-task) |
| \`workflow-creator\` | Automating repeated multi-step processes |
| \`context-curator\` | Managing KNOWLEDGE.md (when >200 lines) |
| \`task-decomposer\` | Breaking down vague/large requests |
| \`quality-gate\` | Self-review before "In Review" status |
| \`adr-manager\` | Record architectural decisions (backlog/decisions) |
| \`skill-orchestrator\` | Auto-assign skills to tasks (via /create-spec) |

**How to Use:**
1. Read the \`SKILL.md\` for the relevant skill before starting work
2. Follow the skill's Core Instructions
3. Use the skill's Verification checklist before marking done
4. Reference \`resources/\` files for detailed patterns

**Task → Skill Mapping:**
- Feature (Major) → \`adr-manager\` → \`task-decomposer\`
- Feature (Standard) → \`task-decomposer\` → \`frontend-mastery\` + \`supabase-expert\` → \`quality-gate\`
- Bug → \`research-deep-dive\` → domain skill → \`quality-gate\`
- Refactor → \`frontend-mastery\` or \`supabase-expert\` → \`quality-gate\`
- Chore → \`git-operations\` → \`quality-gate\`
- Task Complete → \`self-reflection\` (always)
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

# Start Task (Enhanced with Skills)
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

3. **Check Task-Decomposer Trigger.**
   - If effort is L or XL, or request is vague → Load \`.agent/skills/task-decomposer/SKILL.md\`
   - Break down into subtasks before proceeding.

4. **Update Status to "In Progress".**
   - Edit the YAML frontmatter: \`status: In Progress\`.

5. **Create a Git Branch.**
   - Format: \`task-<ID>-<kebab-case-title>\`
   - Run: \`git checkout -b task-<ID>-...\`

6. **Load Relevant Skills.**
   - Feature → \`frontend-mastery\` + \`supabase-expert\` (if DB changes)
   - Bug → \`research-deep-dive\`
   - Read SKILL.md files before coding.

7. **Confirm to User.**
   - "I have started Task <ID>. I am on branch <branch>. Skills loaded: [list]. Ready to code."
EOF

# Finish Task (Enhanced with Skills)
cat > .agent/workflows/finish-task.md <<EOF
---
description: Complete a task with quality gates and memory updates
---

This workflow standardizes the "Definition of Done".
It prevents tasks from being closed without context and lessons learned.

1.  **Identify Current Task.**
    *   Ask user/check branch name (e.g., \`task-5\`).

2.  **Run Quality-Gate Skill.**
    *   Load \`.agent/skills/quality-gate/SKILL.md\`
    *   Run \`npm run build\` (or equivalent).
    *   **If fail**: ABORT. Report error to user.
    *   Complete all applicable skill checklists.

3.  **Context Binding (Automatic).**
    *   Run \`git diff --name-only main...HEAD\`.
    *   Update \`backlog/tasks/task-5...md\` to add:
        \`\`\`markdown
        # Context (Auto-Generated)
        - \`src/modified/file.ts\`
        \`\`\`

4.  **Run Self-Reflection Skill.**
    *   Load \`.agent/skills/self-reflection/SKILL.md\`
    *   Answer: "What went well? What could improve?"
    *   Capture at least one lesson learned.
    *   Append to \`backlog/KNOWLEDGE.md\` under the **appropriate category**.

5.  **Check Context-Curator Trigger.**
    *   If \`KNOWLEDGE.md\` > 200 lines, run context-curator skill.

6.  **Status Update.**
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

# 7. Write Skills
echo "🎯 Writing Agent Skills..."

# Frontend Mastery Skill
cat > .agent/skills/frontend-mastery/SKILL.md <<'EOF'
---
name: frontend-mastery
description: Use when implementing UI components, pages, or any visual elements. Enforces premium aesthetics, responsive design, and consistent styling patterns.
---

# Frontend Mastery Skill

## Core Instructions
1. **Premium Aesthetics** - Use gradients, shadows, micro-animations
2. **Tailwind Best Practices** - Use design tokens, responsive utilities, clsx
3. **Component Structure** - Props interface at top, clean JSX
4. **Animations** - transition-all duration-200 for hovers

## Guidelines
- Never use default browser styles
- Always add hover/focus states
- Test on mobile viewport first

## Verification
- [ ] Component renders on mobile
- [ ] Hover states are smooth
- [ ] Colors match design system
EOF

# Frontend Mastery Resources
cat > .agent/skills/frontend-mastery/resources/tailwind-patterns.md <<'EOF'
# Tailwind Patterns

## Color Palette
| Purpose | Class |
|---------|-------|
| Primary | `bg-pink-500` / gradient `from-pink-500 to-rose-500` |
| Success | `bg-emerald-500` |
| Warning | `bg-amber-500` |
| Danger | `bg-red-500` |

## Spacing: 4px increments
`p-1` (4px), `p-2` (8px), `p-4` (16px), `p-6` (24px)

## Border Radius
`rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full`

## Shadows
`shadow-sm`, `shadow`, `shadow-lg`, `shadow-xl`
EOF

# Supabase Expert Skill
cat > .agent/skills/supabase-expert/SKILL.md <<'EOF'
---
name: supabase-expert
description: Use when working with database schemas, RLS policies, migrations, or Edge Functions.
---

# Supabase Expert Skill

## Core Instructions
1. **Migrations First** - Use apply_migration for DDL
2. **RLS Policies** - Every table MUST have RLS enabled
3. **Type Generation** - Run /update-types after schema changes

## Guidelines
- Check get_advisors for security issues
- Use parameterized queries
- Handle errors from Supabase client

## Verification
- [ ] RLS enabled on new tables
- [ ] Types regenerated
- [ ] No security advisories
EOF

# Supabase Expert Resources
cat > .agent/skills/supabase-expert/resources/rls-patterns.md <<'EOF'
# RLS Policy Patterns

## Common Policy Types
| Type | SQL Pattern |
|------|-------------|
| Owner Only | `auth.uid() = user_id` |
| Couple Access | `couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())` |
| Public Read | `true` (for SELECT) |

## Testing RLS
```sql
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM your_table;
```

## Common Mistakes
- Forgetting to enable RLS on new tables
- Not handling `auth.uid() IS NULL` for unauthenticated access
EOF

cat > .agent/skills/supabase-expert/resources/migration-guide.md <<'EOF'
# Migration Best Practices

## Naming: `YYYYMMDD_HH_description`
Example: `20260108_01_add_user_preferences`

## Checklist
- [ ] Migration is reversible (has DROP)
- [ ] RLS policies included
- [ ] Indexes for foreign keys
- [ ] Types regenerated after

## Rollback
Always test rollback: `apply_migration` with DROP statements
EOF

# Research Deep Dive Skill
cat > .agent/skills/research-deep-dive/SKILL.md <<'EOF'
---
name: research-deep-dive
description: Use when investigating complex problems or gathering information before implementation.
---

# Research Deep Dive Skill

## Core Instructions
1. Use search_web for external patterns
2. Use grep_search for codebase investigation
3. Document findings before coding
4. Propose 2-3 approaches if unclear

## Guidelines
- Don't rush to code; understand first
- Read at least 3 sources
- Update KNOWLEDGE.md with learnings

## Verification
- [ ] Question clearly defined
- [ ] Multiple sources consulted
- [ ] Conclusion documented
EOF

# Git Operations Skill
cat > .agent/skills/git-operations/SKILL.md <<'EOF'
---
name: git-operations
description: Use when managing branches, commits, or any git workflow.
---

# Git Operations Skill

## Branch Naming
- Features: feat/<task-id>-<desc>
- Bugs: fix/<task-id>-<desc>
- Chores: chore/<desc>

## Commit Format
<type>(<scope>): <description>
Types: feat, fix, refactor, chore, docs, style, test

## Verification
- [ ] Branch name follows convention
- [ ] Commits use conventional format
- [ ] No secrets committed
EOF

# Skill-Creator Meta-Skill
mkdir -p .agent/skills/skill-creator/resources
cat > .agent/skills/skill-creator/SKILL.md <<'EOF'
---
name: skill-creator
description: A meta-skill for creating new skills. Trigger when you identify repeated patterns or gaps. Requires 80%+ confidence.
---

# Skill-Creator Meta-Skill

## Confidence Thresholds
| Confidence | Action |
|------------|--------|
| 90%+ | Auto-create skill |
| 80-89% | Propose to user |
| 60-79% | Note in KNOWLEDGE.md |
| <60% | Do not create |

## Process
1. Identify the gap (repeated pattern, missing knowledge)
2. Create folder: `.agent/skills/<name>/`
3. Write SKILL.md with YAML frontmatter
4. Update AGENTS.md skills table
5. Log in KNOWLEDGE.md

## Quality Checklist
- [ ] Name is lowercase-with-hyphens
- [ ] Description states trigger conditions
- [ ] SKILL.md under 500 lines
- [ ] Verification checklist exists
EOF

# Skill-Creator Resources
cat > .agent/skills/skill-creator/resources/skill-template.md <<'EOF'
# Skill Template

```markdown
---
name: <skill-name>
description: <When to load this skill>
---

# <Skill Name> Skill

## Core Instructions
1. First principle
2. Second principle

## Guidelines
- Constraint 1
- Constraint 2

## Verification
- [ ] Check 1
- [ ] Check 2
```

## Naming: lowercase-with-hyphens (max 64 chars)
## Description: Trigger condition (max 1024 chars)
EOF

# Meta-Skills: ADR Manager
mkdir -p .agent/skills/adr-manager/resources
cat > .agent/skills/adr-manager/SKILL.md <<'EOF'
---
name: adr-manager
description: Use when significant architectural decisions are made. Creates standard Architecture Decision Records (ADRs) in Nygard format.
---

# ADR Manager Skill

## Trigger
Use this skill when you make a decision that:
- Introduces a new technology or library
- Changes the database schema structure significantly
- Defines a new pattern (e.g., "Use Edge Functions for X")
- Changes a core workflow or navigation flow

## Core Instructions
1.  **Check Context**: Is this a *decision* or just *work*? If decision, proceed.
2.  **Generate ID**: Count existing files in `backlog/decisions/`. New ID = Count + 1 (padded to 4 digits, e.g., `0003`).
3.  **Create File**: `backlog/decisions/<ID>-<kebab-case-title>.md`
4.  **Use Template**: Follow the Nygard format (see `resources/adr-template.md`).

## Verification
- [ ] File created in `backlog/decisions/`
- [ ] ID is sequential
- [ ] Status is set correctly
- [ ] Consequences list at least one "con" (trade-off)
EOF

cat > .agent/skills/adr-manager/resources/adr-template.md <<'EOF'
# Architecture Decision Record (ADR) Template

File Name Format: `YYYY-MM-DD-short-title.md`

```markdown
# [Short Title]

- Status: [Proposed | Accepted | Deprecated | Superseded]
- Date: [YYYY-MM-DD]
- Deciders: [List everyone involved]

## Context and Problem Statement
[Describe the context and problem statement...]

## Decision Drivers
* [driver 1...]

## Considered Options
* [option 1]
* [option 2]

## Decision Outcome
Chosen option: "[option 1]", because...

### Positive Consequences
* [e.g., improvement...]

### Negative Consequences
* [e.g., trade-off...]
```
EOF

# Meta-Skills: Skill Orchestrator
mkdir -p .agent/skills/skill-orchestrator
cat > .agent/skills/skill-orchestrator/SKILL.md <<'EOF'
---
name: skill-orchestrator
description: Use during task creation (/create-spec) to analyze requirements and assign relevant skills. Ensures worker agents know which skills to load.
---

# Skill Orchestrator

## Purpose
Analyze new tasks/specs and assign relevant skills automatically.

## Trigger
Run during `/create-spec` workflow (step 5).

## Skill Assignment Matrix
| Task Contains | Assign Skill(s) |
|---------------|-----------------|
| UI, component, page, styling | `frontend-mastery` |
| Database, RLS, migration, Supabase | `supabase-expert` |
| Bug, investigation, debug | `research-deep-dive` |
| Branch, commit, merge | `git-operations` |
| Major architecture, new library | `adr-manager` |
| Effort L/XL, vague requirements | `task-decomposer` |

## Output
Add `## Skills (Auto-Assigned)` section to each task file.
EOF

# Meta-Skills: Self-Reflection
mkdir -p .agent/skills/self-reflection
cat > .agent/skills/self-reflection/SKILL.md <<'EOF'
---
name: self-reflection
description: Use after completing tasks to analyze performance and capture lessons for KNOWLEDGE.md.
---
# Self-Reflection Skill
Run after each task to improve future performance.
## Process
1. What went well?
2. What could improve?
3. Capture lesson in KNOWLEDGE.md
EOF

# Meta-Skills: Workflow-Creator
mkdir -p .agent/skills/workflow-creator
cat > .agent/skills/workflow-creator/SKILL.md <<'EOF'
---
name: workflow-creator
description: Use to create new .agent/workflows/*.md for repeated processes.
---
# Workflow-Creator Skill
Automate multi-step processes that repeat.
## When to Trigger
- Same sequence used 3+ times
EOF

# Meta-Skills: Context-Curator
mkdir -p .agent/skills/context-curator
cat > .agent/skills/context-curator/SKILL.md <<'EOF'
---
name: context-curator
description: Use to manage KNOWLEDGE.md. Prune outdated entries when file exceeds 200 lines.
---
# Context-Curator Skill
Keep project memory clean and organized.
EOF

# Meta-Skills: Task-Decomposer (Full Version)
mkdir -p .agent/skills/task-decomposer
cat > .agent/skills/task-decomposer/SKILL.md <<'EOF'
---
name: task-decomposer
description: Use when receiving vague or complex requests. Asks clarifying questions, then breaks down requirements into structured subtasks. Prevents rushing into code.
---

# Task-Decomposer Skill

Transform vague requests into clear, executable plans.

---

## When to Trigger

- Request is vague ("make it better", "fix the issues", "I want X")
- Request spans multiple files or systems
- Request has unclear acceptance criteria
- Effort estimate is L or XL
- You're unsure where to start
- Invoked by `/create-task-spec` workflow

---

## Step 1: Assess Complexity (FIRST)

| Complexity | Signs | Action |
|------------|-------|--------|
| **Simple** | Clear request, single file, cosmetic | Skip questions, proceed |
| **Medium** | Multiple files, some unknowns | Ask 2-3 targeted questions |
| **Complex** | Vague, architecture impact | Full elicitation below |

**Examples:**
- "Make button purple" → **Simple** → Confirm which button, proceed
- "Add dark mode" → **Medium** → Scope, components, persistence
- "I want notifications" → **Complex** → Full question battery

---

## Step 2: Clarifying Questions (Adaptive)

**Universal Rule:** For EVERY task, briefly scan these 4 categories for ambiguity:
1.  **Technical Implementation** (Schema, APIs, Perf)
2.  **UI & UX** (Empty states, transitions, mobile)
3.  **Concerns** (Security, failure states)
4.  **Tradeoffs** (Speed vs Robustness)

---

### For SIMPLE Tasks
**Action:** Quick Scan.
- Is the request *actually* simple, or are there hidden UI/Tech implications?
- **IF Clear**: Just confirm the specific element/file.
- **IF Ambiguous**: Ask with a recommendation.
  - *Example:* "This button submits data. I recommend adding a **loading spinner** for feedback. Or we could just disable it. Shall we add the spinner?"

→ Then skip to Step 5 (Subtasks).

---

### For MEDIUM Tasks
**Action:** Targeted Scan.
Don't just ask "what is the flow?". **Check the 4 categories** and ask only about what's missing.
- **Technical**: "Does this need a new DB column? I suggest **adding 'status' to 'tasks'** for tracking."
- **UI/UX**: "For mobile, I recommend **stacking the columns**. Or we could hide the sidebar. Thoughts?"
- **Concerns**: "If offline, I suggest we **queue the request**. Agree?"

**Decision:**
- If a category is obvious (e.g., standard button), skip it.
- If a category has *any* doubt, ASK with a recommendation.

→ Then proceed to Step 3.

---

### For COMPLEX Tasks (Deep Interview Mode)

**Goal:** Interview the user in detail. **Avoid obvious questions.** Dig for edge cases, tradeoffs, and hidden complexity.

#### 1. The Interview Protocol
Act as a Senior Architect. Don't just ask "what do you want?". Ask "what have you considered?".

**CRITICAL: Always provide Options + Recommendation.**
- **❌ Bad:** "How should we handle errors?"
- **✅ Good:** "I recommend we **toast the error** so the user knows to retry. We could also just log it, but that feels silent. Thoughts?"

- **UI & UX:** "For empty states, I suggest a **placeholder illustration** (cleaner) vs just text. Do you agree?"
- **Technical:** "What are the performance implications? Security concerns?"
- **Tradeoffs:** "We could do X (fast) or Y (robust). Which do you prefer?"
- **Concerns:** "I'm worried about [potential issue]. How should we handle it?"

#### 2. Question Categories (Must Cover All)
1.  **Technical Implementation:** Database schema, API design, libraries.
2.  **UI & UX Details:** Interactions, error states, responsiveness.
3.  **Risk & Concerns:** "What if the API fails?", "What if user is offline?"
4.  **Strategic Tradeoffs:** Quality vs Speed, Flexibility vs Simplicity.

#### 3. The Loop (Continual Interview)
```
REPEAT:
  1. Analyze current understanding.
  2. Identify GAPS (non-obvious ones).
  3. Ask deep, investigative questions.
  4. Wait for response.
UNTIL: You can write the FULL spec without guessing.
```

---

## Step 3: Identify Components

Break into independent pieces:
- [ ] Frontend changes
- [ ] Backend/database changes  
- [ ] Configuration changes
- [ ] Documentation updates

---

## Step 4: Pre-Mortem Analysis (Elite Move)

**For Complex/Critical Tasks, ask:**
"Imagine we released this and it FAILED. What happened?"

*Examples:*
- "We migrated the DB but didn't update the types."
- "The UI looks good but the API is slow."
- "Users on mobile can't see the button."

**Action:** Turn these failures into **Prevention Subtasks** (e.g., "Add loading skeleton", "Verify mobile overflow").

---

## Step 5: Create Subtask List

Format for task file:
```markdown
## Implementation Plan
- [ ] Subtask 1 (effort: S)
- [ ] Subtask 2 (effort: M, depends on 1)
- [ ] Subtask 3 (effort: S)
```

---

## Step 6: Estimate Effort

| Size | Criteria |
|------|----------|
| XS | < 30 min, single file |
| S | 30 min - 2 hr, 1-3 files |
| M | 2-4 hr, multiple files |
| L | 4-8 hr, multiple components |
| XL | > 8 hr, consider splitting |

---

## Output Template

```markdown
## Task Decomposition: [Original Request]

### Complexity: [Simple/Medium/Complex]

### Clarifying Questions Asked
1. Q: [Question] → A: [Answer]
2. Q: [Question] → A: [Answer]

### Goal (After Clarification)
[What I now understand the user wants]

### Components Affected
- Component A
- Component B

### Subtasks
1. **[Subtask 1]** - [Description] (effort: S)
2. **[Subtask 2]** - [Description] (effort: M)

### Risks/Unknowns
- [Any remaining uncertainties]
```

---

## Verification
- [ ] Complexity assessed before questioning
- [ ] Questions proportional to complexity
- [ ] All ambiguities resolved before decomposition
- [ ] Subtasks are actionable and sized

---

## Anti-Patterns (Avoid These)

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Ask 20 questions for a button color change | Assess complexity first |
| Start coding with "I'll figure it out" | Clarify unknowns upfront |
| Create subtasks without effort estimates | Size every subtask |
| Ignore edge cases | Explicitly ask "what should NOT happen?" |
| Assume database changes are obvious | Always confirm RLS/schema impact |
| Make subtasks too large (> 4hr) | Split anything XL into multiple tasks |

---

## Success Criteria

Your decomposition is "good enough" when:
- [ ] A different agent could execute it without asking questions
- [ ] Each subtask has ONE clear deliverable
- [ ] Dependencies are explicit (not assumed)
- [ ] Effort estimates are realistic
- [ ] Edge cases are documented
- [ ] User has confirmed understanding
EOF

# Meta-Skills: Quality-Gate
mkdir -p .agent/skills/quality-gate
cat > .agent/skills/quality-gate/SKILL.md <<'EOF'
---
name: quality-gate
description: Use before marking tasks "In Review". Self-review against skill checklists.
---
# Quality-Gate Skill
Self-review before human review.
## Checks
- [ ] Build passes
- [ ] Skill checklists complete
- [ ] No obvious issues
EOF

# 9. Write Skills System Walkthrough
echo "📖 Writing Skills System Walkthrough..."
mkdir -p backlog/docs
cat > backlog/docs/SKILLS-SYSTEM.md <<'EOF'
---
title: Skills System Walkthrough
type: doc
---

# Skills System Walkthrough

## Overview

This project uses a **Skills System** to give agents specialized knowledge for specific task types.
**Total Skills: 15** (4 Domain + 11 Meta)

---

## Skills Available

### Domain Skills (4)
| Skill | Purpose |
|-------|---------|
| `frontend-mastery` | UI/UX, Tailwind, animations |
| `supabase-expert` | Database, RLS, migrations |
| `research-deep-dive` | Investigation before coding |
| `git-operations` | Branching, commits, PRs |

### Meta-Skills (11)
| Skill | Trigger |
|-------|---------|
| `skill-creator` | 80%+ confidence to create new skill |
| `adr-manager` | Architectural decisions (new tech, major patterns) |
| `self-reflection` | After /finish-task |
| `workflow-creator` | 3+ repeated sequences |
| `context-curator` | KNOWLEDGE.md > 200 lines |
| `task-decomposer` | L/XL effort tasks, `/create-task-spec` |
| `quality-gate` | Before "In Review" status |
| `skill-orchestrator` | Auto-assign skills during spec creation |
| `test-strategist` | Evaluate test needs, write tests |
| `project-decomposer` | New project initialization (PRD, Tech Spec) |

---

## Key Workflows

| Workflow | Purpose |
|----------|---------|
| `/create-project-spec` | New repo → Vision → Docs (PRD, Tech Spec) → Bootstrap |
| `/create-task-spec` | Feature idea → Spec → Tasks |
| `/start-task` | Begin work on a backlog item |
| `/finish-task` | Quality gate + Self-reflection |

---

## How It Works

```
New Project? → /create-project-spec
    ↓ (project-decomposer)
PRD.md, TECH-SPEC.md, ARCHITECTURE.md
    ↓
Repo Scaffolded
    ↓
New Feature? → /create-task-spec
    ↓ (task-decomposer + skill-orchestrator)
Spec + Tasks with Skills Assigned
    ↓
/start-task → Do Work → /finish-task
    ↓ (quality-gate + self-reflection)
Done
```

---

## Using Skills

1. **Read the SKILL.md** before starting work
2. **Follow Core Instructions** in the skill
3. **Complete Verification checklist** before marking done
4. **Reference resources/** for detailed patterns

---

## File Locations

- Skills: `.agent/skills/<skill-name>/SKILL.md`
- Workflows: `.agent/workflows/<workflow>.md`
- Knowledge: `backlog/KNOWLEDGE.md`
- Agent Instructions: `backlog/AGENTS.md`
EOF

# 10. Final Instructions
echo "✅ Done! Environment Scaffolded (v4.0 with Meta-Skills)."
echo ""
echo "Next Steps:"
echo "1. Run 'npx backlog.md init' if you haven't (to install the CLI binary)."
echo "2. Start the board: 'npx backlog.md browser'"
echo "3. Skills available in .agent/skills/ for specialized tasks."
echo "4. Read backlog/docs/SKILLS-SYSTEM.md for the walkthrough."
echo "5. Antigravity is ready to use /start-task and /create-task-spec."

# Project Decomposer Skill
mkdir -p .agent/skills/project-decomposer/resources
cat > .agent/skills/project-decomposer/SKILL.md <<'EOF'
---
name: project-decomposer
description: Triggers at project start. Deeply interviews user to generate PRD, Tech Spec, and Architecture Design. Scaffolds entire project structure.
---

# Project Decomposer Skill

**The "Principal Architect" in a box.**
Use this skill to convert a raw idea into a fully scaffolded, production-ready repository.

---

## Trigger
- `/create-project-spec` workflow (Step 1)
- New repository initialization

---

## Phase 1: The Deep Interview (Project Scale)
**Goal:** Extract the "Soul" of the project.
*Don't just ask "what features?". Ask "what success looks like?".*

### Guiding Principle: The Opinionated Partner
**Never ask an open-ended question without providing a path forward.**
- **❌ Bad:** "What database do you want?"
- **✅ Good:** "For this, I recommend **PostgreSQL (Supabase)** because of its relational integrity. Alternatively, we could use Firebase if realtime is the priority. I suggest Supabase to keep options open. Thoughts?"

### 1. The Vision
- "In one sentence, what is this? (e.g., 'Uber for Dog Walkers')"
- "Who is the user? (e.g., 'Busy professionals', 'Teenagers')"
- "What is the 'Magic Moment'? (e.g., 'When the dog is matched')"

### 2. The Stack Selection (Auto-Recommend)
Based on requirements, recommend the stack:
- **Web App**: React, Vite, Tailwind, Supabase
- **Mobile**: React Native / Expo
- **Backend-Heavy**: NestJS / Node
*Ask user to confirm or override.*

### 3. The Feature Map
- "List the core 3 features for MVP."
- "What are the nice-to-haves (V2)?"
- "Are there complex flows (Payments, Realtime, AI)?"

### 4. Technical Constraints
- "Auth provider?" (Supabase, Clerk, Firebase)
- "Database type?" (SQL, NoSQL)
- "Hosting target?" (Vercel, Netlify, AWS)

---

## Phase 2: Document Generation (The "Ambiguity Killer")

**Rule:** Every document must be detailed enough for a stranger to build the app without asking questions.

### 1. PRD.md (Product Requirements Document)
**Goal:** Zero ambiguity on behaviour.
- **Executive Summary:** The "Elevator Pitch".
- **User Personas:** Detailed (Name, Age, Goal, Frustration).
- **User Stories:** `As a [Persona], I want [Action], So that [Benefit]`.
- **Requirements Table:**
  | ID | Feature | Description | Priority |
  |----|---------|-------------|----------|
  | F-01 | Sign Up | Email/Password + Google Auth | P0 |
- **Non-Functional Requirements:** Performance (<1s load), Scale (10k users), Accessibility.
- **Success Metrics:** "100 Daily Active Users", "Retention > 20%".

### 2. TECH-SPEC.md (Technical Specification)
**Goal:** Zero ambiguity on code structure.
- **Stack Decision:** Frameworks, Libraries with rationale.
- **Data Schema:** 
  - Table definitions (Name, Columns, Types, Relationships).
  - *Example:* `users (id: uuid, email: text, created_at: timestamptz)`
- **API Surface:**
  - `POST /api/auth/login` - Body: {email, password}
  - `GET /api/dashboard` - RLS Protected
- **Project Structure:** File tree diagram.

### 3. ARCHITECTURE.md
**Goal:** Zero ambiguity on data flow.
- **System Diagram:** Mermaid chart showing Frontend -> API -> DB -> External Services.
- **Data Flow:** How data moves for key actions (e.g. Checkout).
- **Security Strategy:** RLS Policies, Auth flow, API Gateways.
- **Third-Party Integrations:** Stripe, SendGrid, AI Models (with fallback strategies).

---

## Phase 3: Project Bootstrap (Scaffold)
**Action:** Execute shell commands to set up the repo.

### 1. Install & Configure
- `npm create vite@latest . -- --template react-ts`
- `npm install tailwindcss postcss autoprefixer ...`
- `npx tailwindcss init -p`

### 2. Setup Directory Structure
- `src/components/ui` (Design System)
- `src/features` (Domain Modules)
- `src/lib` (Utilities, API clients)
- `src/hooks` (Custom hooks)

### 3. Setup Tooling
- ESLint / Prettier config
- VS Code extensions (`.vscode/extensions.json`)
- API Clients (Supabase client)

---

## Anti-Patterns
- Skipping the "Vision" step (builds the wrong thing)
- Assessing tech stack without knowing requirements
- Creating a monolith implementation plan (break it down!)
- Ignoring "V2" features (leads to dead-end architecture)

---

## Verification Checklist
- [ ] Vision clearly articulated (one-sentence pitch)
- [ ] Stack confirmed by user
- [ ] PRD.md created with all required sections
- [ ] TECH-SPEC.md created with schema and API surface
- [ ] ARCHITECTURE.md created with Mermaid diagram
- [ ] All three docs reviewed and approved by user
- [ ] Project bootstrapped with correct folder structure
EOF

# Create Project Spec Workflow
cat > .agent/workflows/create-project-spec.md <<'EOF'
---
description: Initialize a new project from scratch (Idea -> Architecture -> Codebase)
---

# Create Project Spec Workflow

**Use this ONLY at the very start of a new project.**
It converts a raw idea into a production-ready codebase.

---

## 1. The Deep Interview (Invoke project-decomposer)
**Load** `.agent/skills/project-decomposer/SKILL.md`
1.  **Vision**: Define the core value proposal.
2.  **Stack Selection**: React vs Next, SQL vs NoSQL (Agent recommends, User confirms).
3.  **Feature Map**: Define MVP vs V2.
4.  **Constraints**: Auth, Hosting, Budget.

---

## 2. Generate Core Documents
Create these in `backlog/specs/project/`:
- `PRD.md` (Product Requirements)
- `TECH-SPEC.md` (Stack, Schema, API)
- `ARCHITECTURE.md` (Diagrams, Data Flow)

> [!IMPORTANT]
> **User Review Point**: Pause here. Ask user to review these docs. Do not proceed to code until approved.

---

## 2.5 Customize Task-Decomposer (Project-Specific)

**After docs are approved**, enhance `.agent/skills/task-decomposer/SKILL.md` with project context:

1.  **Add Project-Specific Question Categories:**
    Based on TECH-SPEC.md, add relevant categories. Example:
    - If using Supabase: "RLS Policy Impact?" 
    - If using Stripe: "Payment Edge Cases?"

2.  **Add Project-Specific Anti-Patterns:**
    Based on ARCHITECTURE.md, add things to avoid. Example:
    - "Don't create new tables without updating types"
    - "Don't bypass the feature folder structure"

3.  **Update Effort Guidelines:**
    Based on project complexity, adjust XS-XL definitions if needed.

> [!NOTE]
> This step is optional for simple projects. Apply only if the project has unique patterns worth encoding.

## 3. Project Bootstrap (Scaffold)
**Once approved, execute the setup:**

1.  **Initialize Repo**:
    - `npm create vite@latest` (or selected stack)
    - `git init`

2.  **Install Dependencies**:
    - `npm install tailwindcss ...` (based on tech spec)
    - Install Linting/Prettier

3.  **Setup Structure**:
    - Create `src/features`, `src/components`, `src/lib`
    - Create `backlog/` directories (if not present)

4.  **Configuration**:
    - `tsconfig.json`
    - `.eslintrc`
    - `.vscode/extensions.json`

---

## 4. Final Handover
1.  Commit changes: `feat: project initialization`.
2.  Notify user: "Project is ready. You can now use `/create-task-spec` for individual features."

---

## Definition of Done (Project Spec Complete When)

- [ ] Vision defined (one-sentence pitch)
- [ ] Stack selected and confirmed by user
- [ ] PRD.md created in `backlog/specs/project/`
- [ ] TECH-SPEC.md created in `backlog/specs/project/`
- [ ] ARCHITECTURE.md created in `backlog/specs/project/`
- [ ] User has reviewed and approved all 3 docs
- [ ] Repo initialized with correct structure
- [ ] Dependencies installed
- [ ] Initial commit made
EOF

# Create Task Spec Workflow (Renamed from create-spec)
cat > .agent/workflows/create-task-spec.md <<'EOF'
---
description: Convert a vague idea into a technical specification
---

This workflow turns "I want X" into a rigorous plan.
**Use this BEFORE creating a task.**

---

## 1. Gather Requirements (Invoke Task-Decomposer)

**Load** `.agent/skills/task-decomposer/SKILL.md` and follow its process:
1. Assess complexity (Simple/Medium/Complex)
2. Ask clarifying questions proportional to complexity
3. Resolve all ambiguity before proceeding

> [!NOTE]
> The skill handles adaptive questioning - simple tasks get 1-2 confirms, complex tasks get full elicitation.

---

## 2. Analyze the Codebase & Roadmap
*   Read `package.json`, `index.css`, and relevant components.
*   **Conflict Check (Crucial):**
    *   Read `backlog/tasks/` - Is overlap work already in progress?
    *   Read `backlog/specs/` - Is this feature already defined?
    *   If conflict found → **STOP**. Notify user.
*   Identify existing patterns to reuse.

---

## 3. Draft the Specification
*   Create `backlog/specs/feature-<name>.md`.
*   Include:
    *   **User Stories** (As a user, I want...)
    *   **Acceptance Criteria** (Given/When/Then)
    *   **Technical Implementation** (Approach, file changes)
    *   **Database Changes** (if any)
    *   **Out of Scope** (What we're NOT doing)

---

## 4. Review with User
*   Present the spec for approval.
*   Ask: "Is there anything I missed or got wrong?"
*   If changes needed → Update spec → Re-review

---

## 5. Assign Skills (Skill Orchestrator)
*   Load `.agent/skills/skill-orchestrator/SKILL.md`
*   Analyze the spec for skill keywords
*   Determine skills for resulting tasks

---

## 6. Generate Tasks
*   **Small Feature (< 10 tasks)**: Generate tasks directly.
*   **Large Feature (> 10 tasks)**: Create a Milestone first.
*   **Include `## Skills` section** in each task.

---

## 7. Check ADR Trigger

Ask: "Does this introduce new technology, patterns, or architecture changes?"
- **Yes** → Load `adr-manager` skill, create ADR in `backlog/decisions/`
- **No** → Proceed

---

## 8. Testing Strategy (Invoke Test-Strategist)

**Load** `.agent/skills/test-strategist/SKILL.md` and:
1. Evaluate if tests are needed (impact matrix)
2. Select test type (Unit/Integration/E2E)
3. Document the test plan in the spec using the Output Template
4. Note: Tests are WRITTEN during task execution, VERIFIED during finish-task

---

## Definition of Done (Spec Complete When)

- [ ] All clarifying questions answered
- [ ] Codebase analyzed for patterns/constraints
- [ ] Spec file created in `backlog/specs/`
- [ ] User has reviewed and approved
- [ ] Skills assigned via skill-orchestrator
- [ ] Tasks generated with effort estimates
- [ ] Testing strategy documented
- [ ] ADR created (if architectural change)
EOF

echo "Agents Scaffolding Complete! v4.1"
