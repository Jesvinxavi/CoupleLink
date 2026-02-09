import { useCallback, useMemo } from 'react';
import { useStreak } from '@/hooks/useStreak';
import type { Challenge } from '@/types/challenge';

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
/**
 * Shared hook for challenge point awarding logic.
 * Consolidates duplicate code from ChallengesTile and ChallengeModalContext.
 */
export function useChallengePoints() {
    const { addPoints, checkStreakUpdate } = useStreak({ enableTokenCheck: false });

    /**
     * Award points for completing a challenge.
     * Points are only awarded if:
     * 1. Partner has also completed the challenge
     * 2. For competitions, both partners agree on the winner
     */
    const awardChallengePoints = useCallback(async (
        type: 'daily' | 'weekly' | 'monthly',
        challenge: Challenge | null,
        partnerMemory: any,
        winnerSelection?: 'me' | 'partner' | 'tie'
    ): Promise<number> => {
        // No partner completion = no points yet (unless not a competition)
        if (!partnerMemory) {
            // Still update streak for non-competition challenges
            if (!challenge?.isCompetition) {
                await checkStreakUpdate();
            }
            return 0;
        }

        // Check for agreement on competition challenges
        let isAgreed = true;
        if (challenge?.isCompetition) {
            const partnerSelection = partnerMemory.metadata?.winner_selection;
            if (!winnerSelection || !partnerSelection) {
                isAgreed = false;
            } else if (winnerSelection === 'tie' && partnerSelection !== 'tie') {
                isAgreed = false;
            } else if (winnerSelection === 'me' && partnerSelection !== 'partner') {
                isAgreed = false;
            } else if (winnerSelection === 'partner' && partnerSelection !== 'me') {
                isAgreed = false;
            }
        }

        if (isAgreed) {
            const points = type === 'daily' ? 1 : type === 'weekly' ? 3 : 5;
            await addPoints(points);
            await checkStreakUpdate();
            return points;
        }

        return 0;
    }, [addPoints, checkStreakUpdate]);

    /**
     * Deduct points when undoing a challenge completion.
     * Points are only deducted if they were previously awarded (partner had completed).
     * 
     * @param pointsAwarded - The number of points that were awarded when completing (from metadata)
     */
    const deductChallengePoints = useCallback(async (
        pointsAwarded: number
    ): Promise<void> => {
        if (pointsAwarded > 0) {
            await addPoints(-pointsAwarded);
        }
    }, [addPoints]);

    /**
     * Legacy undo - deducts based on partner memory existence.
     * Use this when points_awarded is not stored in metadata.
     */
    const deductChallengePointsLegacy = useCallback(async (
        type: 'daily' | 'weekly' | 'monthly',
        partnerMemory: any
    ): Promise<void> => {
        if (partnerMemory) {
            const points = type === 'daily' ? -1 : type === 'weekly' ? -3 : -5;
            await addPoints(points);
        }
    }, [addPoints]);

    return useMemo(() => ({
        awardChallengePoints,
        deductChallengePoints,
        deductChallengePointsLegacy,
        checkStreakUpdate
    }), [awardChallengePoints, deductChallengePoints, deductChallengePointsLegacy, checkStreakUpdate]);
}
