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
