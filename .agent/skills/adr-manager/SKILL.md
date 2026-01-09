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
3.  **Create File (Option A - CLI)**: `npx backlog.md decision create "Decision Title"` (auto-generates ID and file)
4.  **Create File (Option B - Manual)**: `backlog/decisions/<ID>-<kebab-case-title>.md`
5.  **Use Template**: Follow the Nygard format (see `resources/adr-template.md`).

## Guidelines
- **Title**: Short noun phrase (e.g., "Use Supabase Auth")
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: The "Why". What forced this decision?
- **Decision**: The "What". What are we doing?
- **Consequences**: The "Result". Positive and negative impacts.

## Verification
- [ ] File created in `backlog/decisions/`
- [ ] ID is sequential
- [ ] Status is set correctly
- [ ] Consequences list at least one "con" (trade-off)
