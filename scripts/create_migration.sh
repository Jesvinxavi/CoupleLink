#!/bin/bash
# =============================================================================
# SUPABASE MIGRATION GENERATOR
# =============================================================================

# Check if a name was provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/create_migration.sh <migration_name>"
  echo "Example: ./scripts/create_migration.sh add_user_profiles"
  exit 1
fi

MIGRATION_NAME=$1
TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
FILENAME="supabase/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"

touch "$FILENAME"
echo "-- Migration: ${MIGRATION_NAME}" > "$FILENAME"
echo "-- Created at: $(date)" >> "$FILENAME"
echo "" >> "$FILENAME"

echo "Created migration file: $FILENAME"
