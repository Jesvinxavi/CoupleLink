import { useChallengeContext, type ChallengeState } from '@/context/ChallengeContext';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export type { ChallengeStatus, ChallengeState } from '@/context/ChallengeContext';

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
// Thin wrapper around ChallengeContext to keep imports stable.
export const useChallenges = (): ChallengeState => {
    return useChallengeContext();
};
