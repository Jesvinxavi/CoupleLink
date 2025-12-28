import { useChallengeContext, type ChallengeState } from '../context/ChallengeContext';

export type { ChallengeStatus, ChallengeState } from '../context/ChallengeContext';

export const useChallenges = (): ChallengeState => {
    return useChallengeContext();
};


