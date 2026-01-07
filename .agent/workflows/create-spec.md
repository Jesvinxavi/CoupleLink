---
description: Convert a vague idea into a technical specification
---

This workflow turns "I want X" into a rigorous plan.
**Use this BEFORE creating a task.**

1.  **Understand the Goal.**
    *   Ask user for the feature name (e.g., "Dark Mode").
2.  **Analyze the Codebase.**
    *   Read `package.json`, `index.css`, and relevant components.
3.  **Draft a Specification.**
    *   Create `backlog/specs/feature-dark-mode.md`.
    *   Include:
        *   User Stories
        *   Technical Implementation (CSS variables approach vs Tailwind class)
        *   Database Changes (if any)
4.  **Review.**
    *   Ask user to review the spec.
5.  **Generate Tasks (Scaling Logic).**
    *   **Small Feature (< 10 tasks)**: Generate tasks directly with `backlog task create`.
    *   **Massive Project (> 10 tasks)**:
        *   Create a Milestone: `backlog/milestones/m-<ID> - <Title>.md`.
        *   Generate all tasks and link them: `backlog task create ... --milestone <ID>`.
