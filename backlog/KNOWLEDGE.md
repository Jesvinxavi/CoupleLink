# The Hive Mind (Project Knowledge Base)

This file contains accumulated wisdom from completed tasks.
**Agents MUST read this file before starting complex tasks.**

---

## 🗄️ Database & Supabase
*Lessons about schemas, RLS policies, and migrations.*

## 🎨 UI & Components
*Lessons about styling, component behavior, and responsive design.*
*   [2026-01-08] **Button Styling**: When overriding Button component styles with `className`, remove the `variant` prop entirely. Keeping `variant="outline"` or `variant="ghost"` alongside custom background classes can cause conflicts. Use explicit classes like `bg-purple-600` without variant.

## 🔐 Authentication & Security
*Lessons about auth flows, tokens, and security considerations.*

## 🚀 Deployment & DevOps
*Lessons about builds, hosting, and environment configuration.*

## 📦 Dependencies & Tooling
*Lessons about package versions, compatibility, and build tools.*

---

## General Lessons Learned
*   [2026-01-08] **Skills System**: Automation of meta-skills (like `github-automator`) significantly reduces friction. Encapsulating CLI commands into skills ensures consistency and robustness.
*   [2026-01-08] **Comprehensive Audit**: Embedding automated "grep" checks into the audit skill itself (Phase 2.5) catches low-hanging fruit (secrets, debug logs) before manual review, making the 100/100 robustness score more achievable and meaningful.
*   [2026-01-08] **Safe Verification**: When testing destructive operations (like syncing/overwriting skills), always verify locally first by deleting a single target file (e.g., `task-decomposer`) and confirming its restoration, rather than risking the entire directory immediately.
*   [2026-01-08] **Installer Pattern**: Keep installer scripts (`scaffold-agents.sh`) lightweight (< 50 lines). Delegate complex logic to the skills themselves or the repository structure, rather than embedding massive heredocs.
*   [2026-01-07] **Initial Setup**: The `backlog` folder is the source of truth. Do not edit `package.json` versions manually without checking compatibility.
*   [2026-01-08] **Workflow Adherence**: When a user invokes a workflow (e.g., `@[/create-spec]`), it is a strict procedure, not just context. Each step (Draft, Review, Generate) must be executed sequentially and explicitly. Missing the "Review" or "Generate" step leads to system misalignment (e.g., missing backlog tasks).
*   [2026-01-08] **Scroll Behavior**: `window.scrollTo` in a component's effect can cause immediate jumps during page exits. Use `AnimatePresence` mode="wait" and handle scrolling in the entering component's effect instead.
