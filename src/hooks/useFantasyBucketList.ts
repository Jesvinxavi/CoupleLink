import { useFantasyBucketListContext, type Fantasy } from '@/context/FantasyBucketListContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export type { Fantasy };

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
// Thin wrapper around FantasyBucketListContext to keep imports stable.
export function useFantasyBucketList() {
    return useFantasyBucketListContext();
}
