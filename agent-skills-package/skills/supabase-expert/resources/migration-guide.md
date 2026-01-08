# Migration Guide

## Naming Convention

Format: `<action>_<subject>_<details>`

Examples:
- `add_user_preferences_table`
- `update_couples_add_anniversary`
- `create_challenge_history_indexes`

## Migration Checklist

- [ ] Table has primary key
- [ ] All foreign keys have ON DELETE behavior
- [ ] RLS enabled immediately after table creation
- [ ] Indexes on frequently queried columns
- [ ] Seed data included if needed

## Template: New Table

```sql
-- Create table
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add columns here
);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "..." ON public.table_name FOR SELECT USING (...);

-- Update trigger
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Rollback Strategy

Always have a rollback plan. For additive changes, rollback is usually not needed.
For breaking changes, create a separate rollback migration file.
