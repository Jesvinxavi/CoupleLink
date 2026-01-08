---
name: supabase-expert
description: Use when working with database schemas, RLS policies, migrations, Edge Functions, or Supabase client operations. Ensures security-first patterns and proper type generation.
---

# Supabase Expert Skill

Load this skill for any database or backend work involving Supabase.

## Core Instructions

1. **Migrations First**
   - Never modify production directly
   - Use `apply_migration` MCP tool for DDL
   - Use `execute_sql` only for queries, not schema changes
   - Name migrations descriptively: `add_user_preferences_table`

2. **RLS Policies (Critical)**
   - Every table MUST have RLS enabled
   - Default deny: Enable RLS, then add policies
   - Test policies from user perspective
   - Common patterns in `resources/rls-patterns.md`

3. **Type Generation**
   - Run `/update-types` after any schema change
   - Import types from `src/types/supabase.ts`
   - Use `Database['public']['Tables']['table_name']['Row']`

4. **Edge Functions**
   - Always enable JWT verification (unless webhook)
   - Use Deno imports from `jsr:@supabase/`
   - Return proper `Content-Type` headers

## Guidelines

- Check `get_advisors` for security issues after migrations
- Use parameterized queries to prevent SQL injection
- Prefer database functions over client-side logic for complex ops
- Always handle errors from Supabase client

## Verification

- [ ] RLS enabled on new tables
- [ ] Types regenerated and committed
- [ ] No security advisories from `get_advisors`
- [ ] Functions tested with valid and invalid auth
