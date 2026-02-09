import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Required frontend environment variables:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY

// ═══════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// ═══════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
