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
*   [2026-01-07] **Initial Setup**: The `backlog` folder is the source of truth. Do not edit `package.json` versions manually without checking compatibility.
*   [2026-01-08] **Workflow Adherence**: When a user invokes a workflow (e.g., `@[/create-spec]`), it is a strict procedure, not just context. Each step (Draft, Review, Generate) must be executed sequentially and explicitly. Missing the "Review" or "Generate" step leads to system misalignment (e.g., missing backlog tasks).
*   [2026-01-08] **Scroll Behavior**: `window.scrollTo` in a component's effect can cause immediate jumps during page exits. Use `AnimatePresence` mode="wait" and handle scrolling in the entering component's effect instead.
