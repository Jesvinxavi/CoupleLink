---
description: How to regenerate Supabase types after database schema changes
---

# Regenerating Supabase Types

When you make any database schema changes (new tables, new columns, RPC functions, etc.), you MUST regenerate the TypeScript types to keep them in sync.

## Command
// turbo
```bash
npx supabase gen types typescript --project-id jbsteocyiiyzpsodlcbv > src/lib/database.types.ts
```

## Important Notes

1. **Single Source of Truth**: All type imports should use `@/lib/database.types` (NOT `@/types/supabase` - that file was deleted)

2. **RPC Function Results**: RPC functions return `Json` type. Cast them using interfaces from `src/types/rpc.ts`:
   ```typescript
   const result = data as unknown as SomeRpcResultType;
   ```

3. **After Regeneration**: Run `npm run build` to verify no type errors were introduced

4. **If migration adds new RPC functions**: Add corresponding result interfaces to `src/types/rpc.ts`

## Files That Import Types
- `src/lib/supabase.ts` - main client
- `src/context/CoupleContext.tsx`
- `src/components/dashboard/*.tsx`
- `src/hooks/*.ts`
- Various page components
