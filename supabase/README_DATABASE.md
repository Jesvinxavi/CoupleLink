# Database Management Guide

## 🚨 CRITICAL WARNING: SEED FILES
The existing seed files (`20251230_03_seed_...` through `08`) contain **DESTRUCTIVE** logic (`DELETE FROM ...`).
**NEVER RE-RUN THESE FILES** on a production database or one with real user data you want to keep.
Re-running them will **DELETE ALL USER ANSWERS** associated with those activities.

## How to Make Changes

### 1. Creating a New Migration
To modify the schema (add tables, columns, functions) or add new data:
1.  Run the helper script:
    ```bash
    ./scripts/create_migration.sh your_migration_name
    ```
    Example: `./scripts/create_migration.sh add_avatar_column`
2.  Edit the newly created file in `supabase/migrations/`.

### 2. Adding New Activities (Content)
Do not edit the old seed files. Instead, create a new migration using the template provided.

1.  Run `./scripts/create_migration.sh add_new_questions`
2.  Copy the logic from `supabase/templates/add_activity.sql`
3.  Modify it to add your specific new questions/challenges.

### 3. Modifying Functions
When modifying a PL/pgSQL function:
1.  Create a new migration file.
2.  Always include `DROP FUNCTION IF EXISTS function_name(...);` before the `CREATE OR REPLACE FUNCTION`.
3.  Copy the updated function definition into your new file.

## Troubleshooting
- **Foreign Key Violations on Delete:** If you try to delete an activity that users have answered, Postgres will block it. You must delete the dependent `user_answers` first (see the old seed files for examples if you *really* intended to do this).
- **RLS Policy Errors:** If users cannot see data, check `supabase/migrations/*_rls_policies.sql`.
