// ═══════════════════════════════════════
// CONTENT SYNC SCRIPT
// ═══════════════════════════════════════
// Syncs local activity data into Supabase.
import { createClient } from '@supabase/supabase-js'
import { activities } from './data/activities.js'

try {
    // Optional: load .env if dotenv is installed
    await import('dotenv/config')
} catch {
    // If dotenv isn't installed, rely on environment variables provided by the shell
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// CRITICAL: We need the SERVICE_ROLE_KEY to bypass RLS and WRITE to the activities table
// if it is read-only for public users.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const log = {
    info: (message, data) => console.log('[sync_content]', message, data ?? ''),
    warn: (message, data) => console.warn('[sync_content]', message, data ?? ''),
    error: (message, data) => console.error('[sync_content]', message, data ?? '')
};

if (!supabaseUrl || !supabaseKey) {
    log.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncActivities() {
    log.info(`Starting sync of ${activities.length} activities...`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const activity of activities) {
        // 1. Check if activity exists
        // We use a combination of category, type, and title (inside content) to identify uniqueness
        const title = activity.content.title || activity.content.question; // Handle Quiz vs Challenge

        // Safety check: skip if no title/question found
        if (!title) {
            log.warn('Skipping activity with missing title/question:', activity);
            continue;
        }

        // Check query based on the JSON content
        // Note: This relies on the JSONB containment operator @>
        const { data: existing, error: findError } = await supabase
            .from('activities')
            .select('id')
            .eq('category', activity.category)
            .eq('type', activity.type)
            .contains('content', activity.type === 'quiz' ? { question: title } : { title: title })
            .limit(1);

        if (findError) {
            log.error(`Error checking existence of "${title}":`, findError);
            errors++;
            continue;
        }

        if (existing && existing.length > 0) {
            // It exists - skip or update?
            // For now, let's just skip to be safe/fast, or update to fix typos.
            // Uncomment the update block if you want to overwrite details.
            /*
            const { error: updateError } = await supabase
              .from('activities')
              .update({ content: activity.content })
              .eq('id', existing[0].id);
            */
            skipped++;
        } else {
            // Insert new
            const { error: insertError } = await supabase
                .from('activities')
                .insert([activity]);

            if (insertError) {
                log.error(`Error inserting "${title}":`, insertError);
                errors++;
            } else {
                log.info(`Successfully added: "${title}"`);
                inserted++;
            }
        }
    }

    log.info('--- Sync Complete ---');
    log.info(`Inserted: ${inserted}`);
    log.info(`Skipped:  ${skipped}`);
    log.info(`Errors:   ${errors}`);
}

syncActivities();
