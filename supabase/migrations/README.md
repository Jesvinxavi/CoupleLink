Migration naming convention

- Use `YYYYMMDDHHMMSS_description.sql` for new migrations.
- Keep descriptions short and snake_case.
- Do not rename existing historical migrations; some older files use legacy
  timestamp patterns and are kept for compatibility.

Unconsolidated migrations

- Any files under `unconsolidated_*` directories are retained for reference and
  should not be applied to new environments. Prefer the consolidated migration
  files in the root `supabase/migrations/` folder.
