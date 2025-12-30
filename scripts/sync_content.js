const { createClient } = require('@supabase/supabase-js');
const { activities } = require('./data/activities');
require('dotenv').config(); // You might need to install dotenv: npm install dotenv

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// CRITICAL: We need the SERVICE_ROLE_KEY to bypass RLS and WRITE to the activities table
// if it is read-only for public users.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncActivities() {
    console.log(`Starting sync of ${activities.length} activities...`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const activity of activities) {
        // 1. Check if activity exists
        // We use a combination of category, type, and title (inside content) to identify uniqueness
        const title = activity.content.title || activity.content.question; // Handle Quiz vs Challenge

        // Safety check: skip if no title/question found
        if (!title) {
            console.warn('Skipping activity with missing title/question:', activity);
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
            console.error(`Error checking existence of "${title}":`, findError);
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
                console.error(`Error inserting "${title}":`, insertError);
                errors++;
            } else {
                console.log(`Successfully added: "${title}"`);
                inserted++;
            }
        }
    }

    console.log('--- Sync Complete ---');
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Errors:   ${errors}`);
}

syncActivities();
