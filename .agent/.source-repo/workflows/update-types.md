---
description: Update Supabase TypeScript types
---

This workflow keeps your frontend in sync with your database.
**Run this after any migration or Dashboard edit.**

1.  **Login to Supabase (if needed).**
    *   Check if `npx supabase` is authenticated.
2.  **Generate Types.**
    *   Run: `npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/supabase.ts`
    *   *Note: Ask user for Project ID if unknown.*
3.  **Commit.**
    *   `git add src/types/supabase.ts`
    *   `git commit -m "chore: update database types"`
