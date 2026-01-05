import { supabase } from '../lib/supabase';
import { getPeriodKey } from './dateUtils';

/**
 * Checks for challenges that were shown but never completed, and marks them as expired.
 * This should be called on app initialization or when the ChallengeContext loads.
 */
export async function checkExpiredChallenges(coupleId: string): Promise<void> {
    if (!coupleId) return;

    try {
        const now = new Date();
        const today = getPeriodKey('daily', now);
        const thisWeek = getPeriodKey('weekly', now);
        const thisMonth = getPeriodKey('monthly', now);

        // Mark expired daily challenges (period_key < today)
        await supabase
            .from('challenge_history')
            .update({ status: 'expired' })
            .eq('couple_id', coupleId)
            .eq('challenge_type', 'daily')
            .eq('status', 'shown')
            .lt('period_key', today);

        // Mark expired weekly challenges (period_key < this week)
        await supabase
            .from('challenge_history')
            .update({ status: 'expired' })
            .eq('couple_id', coupleId)
            .eq('challenge_type', 'weekly')
            .eq('status', 'shown')
            .lt('period_key', thisWeek);

        // Mark expired monthly challenges (period_key < this month)
        await supabase
            .from('challenge_history')
            .update({ status: 'expired' })
            .eq('couple_id', coupleId)
            .eq('challenge_type', 'monthly')
            .eq('status', 'shown')
            .lt('period_key', thisMonth);

        // Mark expired questions (same as daily)
        await supabase
            .from('challenge_history')
            .update({ status: 'expired' })
            .eq('couple_id', coupleId)
            .eq('challenge_type', 'question')
            .eq('status', 'shown')
            .lt('period_key', today);

    } catch (error) {
        console.error('[checkExpiredChallenges] Error:', error);
    }
}

/**
 * Backfills challenge_history from existing memories table.
 * This should only be run once per couple to populate historical data.
 */
export async function backfillChallengeHistoryFromMemories(coupleId: string): Promise<void> {
    if (!coupleId) return;

    try {
        // Check if we've already backfilled (look for any existing entries)
        const { count } = await supabase
            .from('challenge_history')
            .select('*', { count: 'exact', head: true })
            .eq('couple_id', coupleId);

        if (count && count > 0) {
            // Already has data, skip backfill
            return;
        }

        // Fetch all challenge memories
        const { data: memories, error } = await supabase
            .from('memories')
            .select('metadata, created_at, challenge_id')
            .eq('couple_id', coupleId)
            .eq('type', 'challenge');

        if (error) throw error;
        if (!memories || memories.length === 0) return;

        // Group by challenge_type + period_key to avoid duplicates
        const uniqueEntries = new Map<string, any>();

        for (const mem of memories) {
            const metadata = mem.metadata as any;
            const challengeType = metadata?.challenge_type || 'daily';
            const createdAt = new Date(mem.created_at);
            const periodKey = getPeriodKey(challengeType, createdAt);
            const key = `${challengeType}-${periodKey}`;

            if (!uniqueEntries.has(key)) {
                uniqueEntries.set(key, {
                    couple_id: coupleId,
                    challenge_type: challengeType,
                    activity_id: mem.challenge_id || null,
                    period_key: periodKey,
                    status: metadata?.skipped ? 'expired' : 'completed',
                    shown_at: mem.created_at,
                    completed_at: metadata?.skipped ? null : mem.created_at
                });
            }
        }

        // Insert all entries
        const entries = Array.from(uniqueEntries.values());
        if (entries.length > 0) {
            await supabase
                .from('challenge_history')
                .upsert(entries, { onConflict: 'couple_id,challenge_type,period_key', ignoreDuplicates: true });
        }

    } catch (error) {
        console.error('[backfillChallengeHistoryFromMemories] Error:', error);
    }
}
