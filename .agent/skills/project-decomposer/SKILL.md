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

### 3. The Feature Map (The "Production-Aware MVP")
**Strategy**: "Build for Speed, Architect for Scale."
- **MVP (P0)**: "What is the absolute minimum to solve the user's problem? (e.g., Simple Chat)" -> *Build this First.*
- **Roadmap (V2)**: "What makes it a billion-dollar app? (e.g., E2E Encryption, AI summarization)" -> *Architect for this (DB schema supports it), but don't build UI yet.*
*Ensure the DB Schema in TECH-SPEC supports V2, but the Codebase only implements MVP.*

### 4. Technical Constraints
- "Auth provider?" (Supabase, Clerk, Firebase)
- "Database type?" (SQL, NoSQL)
- "Hosting target?" (Vercel, Netlify, AWS)

### 5. The Production Readiness Check (CRITICAL)
**Before finalizing the plan, you MUST "Stress Test" the idea:**
- **Scaling**: "Will this architecture assume 10k users or 1M? If 1M, how do we handle DB load? (Read replicas? Redis?)"
- **Security**: "How do we secure user data? (RLS Policies is NOT optional). How do we handle PII?"
- **Auth**: "What about session expiry? Refresh tokens? Social login edge cases?"
- **Database**: "Are we using proper Foreign Keys? Indexes on query paths? Constraints?"
*Explicitly discuss these with the user to show you are thinking like a CTO.*

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

