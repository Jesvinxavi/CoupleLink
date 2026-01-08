# RLS Policy Patterns

## Common Policy Types

### 1. User Can Only See Own Data
```sql
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

### 2. Couple Members Can Access Shared Data
```sql
CREATE POLICY "Couple members can view"
ON table_name FOR SELECT
USING (
  couple_id IN (
    SELECT id FROM couples
    WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
  )
);
```

### 3. Insert With Automatic User Assignment
```sql
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4. Service Role Bypass (Edge Functions)
```sql
CREATE POLICY "Service role full access"
ON table_name FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

## Testing Policies

1. Test as authenticated user
2. Test as different user (should fail)
3. Test as anonymous (should fail)
4. Test as service_role (should pass if needed)

## Common Mistakes

- Forgetting to enable RLS: `ALTER TABLE t ENABLE ROW LEVEL SECURITY;`
- Using `auth.uid()` without null check (anonymous users)
- Not covering all operations (SELECT, INSERT, UPDATE, DELETE)
