import { useFantasyBucketListContext, type Fantasy } from '../context/FantasyBucketListContext';

export type { Fantasy };

export function useFantasyBucketList() {
    return useFantasyBucketListContext();
}
