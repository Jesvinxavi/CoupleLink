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

---

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

