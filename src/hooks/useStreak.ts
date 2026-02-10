import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import { useGlobalModalQueue } from '@/context/GlobalModalQueueContext';

interface StreakBrokenResult {
    is_broken: boolean;
    previous_streak: number;
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════

export function useStreak({ enableTokenCheck = true }: { enableTokenCheck?: boolean } = {}) {
    const { couple, userProfile, loading: coupleLoading } = useCoupleData();
    const { enqueueModal, ackModal, currentModal } = useGlobalModalQueue();

    // Derived state from global queue
    const showTokenModal = currentModal?.type === 'raincheck';
    const streakBroken = currentModal?.type === 'streak_broken';
    const previousStreak = currentModal?.type === 'streak_broken' ? currentModal.data.previousStreak : 0;

    const prevTokensRef = useRef<number | null>(null);
    const prevCoupleIdRef = useRef<string | null>(null);
    const isRefundingRef = useRef(false);

    // Listen for refund event (Local + Broadcast)
    useEffect(() => {
        const handleRefund = () => {
            isRefundingRef.current = true;

            setTimeout(() => {
                if (isRefundingRef.current) {
                    isRefundingRef.current = false;
                }
            }, 2000);
        };

        window.addEventListener('couplelink:expect-refund', handleRefund);

        let channel: ReturnType<typeof supabase.channel> | null = null;
        if (couple?.id) {
            channel = supabase.channel(`partner-challenges-${couple.id}`)
                .on('broadcast', { event: 'token_refund' }, () => {
                    handleRefund();
                })
                .subscribe();
        }

        return () => {
            window.removeEventListener('couplelink:expect-refund', handleRefund);
            if (channel) supabase.removeChannel(channel);
        };
    }, [couple?.id]);

    // Check for broken streak on load
    useEffect(() => {
        if (!couple?.id) return;

        const checkBroken = async () => {
            try {
                const { data, error } = await supabase.rpc('check_streak_broken', {
                    p_couple_id: couple.id
                });
                if (error) throw error;
                const result = data as StreakBrokenResult | null;
                if (result?.is_broken) {
                    enqueueModal('streak_broken', {
                        previousStreak: result.previous_streak
                    });
                }
            } catch (err) {
                logger.error('useStreak', 'Error checking streak status', err);
            }
        };

        checkBroken();
    }, [couple?.id, enqueueModal]);

    useEffect(() => {
        if (!couple || !userProfile || !enableTokenCheck) return;

        const currentTokens = couple.rain_check_tokens || 0;
        const lastSeen = userProfile.last_seen_rain_check_tokens || 0;

        // When couple changes (restore/join), reset baseline to prevent false delta
        if (prevCoupleIdRef.current !== null && prevCoupleIdRef.current !== couple.id) {
            prevTokensRef.current = null;
        }
        prevCoupleIdRef.current = couple.id;

        if (prevTokensRef.current === null) {
            prevTokensRef.current = currentTokens;
            if (currentTokens > lastSeen) {
                enqueueModal('raincheck');
            }
            return;
        }

        if (currentTokens > prevTokensRef.current) {
            if (!isRefundingRef.current) {
                enqueueModal('raincheck');
            }
        }

        prevTokensRef.current = currentTokens;

    }, [couple, userProfile, enableTokenCheck, enqueueModal]);

    const handleCloseTokenModal = useCallback(async () => {
        // Acknowledge the modal to remove it from queue
        ackModal('raincheck');

        const currentTokens = couple?.rain_check_tokens || 0;
        if (userProfile?.id && currentTokens > (userProfile.last_seen_rain_check_tokens || 0)) {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen_rain_check_tokens: currentTokens })
                    .eq('id', userProfile.id);
            } catch (err) {
                logger.error('useStreak', 'Failed to update last_seen_rain_check_tokens', err);
            }
        }
    }, [ackModal, couple?.rain_check_tokens, userProfile?.id, userProfile?.last_seen_rain_check_tokens]);

    // Self-healing: If currents tokens are LESS than last seen (e.g. spent tokens), 
    // update last_seen silently so the NEXT earn counts as an increase.
    useEffect(() => {
        if (!couple || !userProfile || !enableTokenCheck) return;
        const currentTokens = couple.rain_check_tokens || 0;
        const lastSeen = userProfile.last_seen_rain_check_tokens || 0;

        if (currentTokens < lastSeen) {
            logger.debug('useStreak', 'Current tokens < last seen. Syncing baseline', { currentTokens, lastSeen });
            supabase
                .from('profiles')
                .update({ last_seen_rain_check_tokens: currentTokens })
                .eq('id', userProfile.id)
                .then(({ error }) => {
                    if (error) {
                        logger.error('useStreak', 'Failed to silent-sync last_seen', error);
                    }
                });
        }
    }, [couple, userProfile, enableTokenCheck]);

    const handleCloseStreakBroken = useCallback(() => {
        ackModal('streak_broken');
    }, [ackModal]);

    const restoreStreak = useCallback(async () => {
        if (!couple?.id) return;
        try {
            const { data, error } = await supabase.rpc('restore_streak', {
                p_couple_id: couple.id
            });
            if (error) throw error;
            if (data) {
                // Streak restored, close modal
                ackModal('streak_broken');
            }
        } catch (err) {
            logger.error('useStreak', 'Error restoring streak', err);
        }
    }, [couple?.id, ackModal]);

    const checkStreakUpdate = useCallback(async () => {
        if (!couple?.id) return;
        try {
            await supabase.rpc('check_and_update_streak', {
                p_couple_id: couple.id
            });
        } catch (err) {
            logger.error('useStreak', 'Error updating streak', err);
        }
    }, [couple?.id]);

    const addPoints = useCallback(async (points: number) => {
        if (!couple?.id) return;
        try {
            await supabase.rpc('add_love_action_points', {
                p_couple_id: couple.id,
                p_points: points
            });
        } catch (err) {
            logger.error('useStreak', 'Error adding points', err);
        }
    }, [couple?.id]);

    return {
        streakBroken,
        previousStreak,
        showTokenModal,
        setShowTokenModal: () => { }, // No-op or remove if unused externally
        restoreStreak,
        checkStreakUpdate,
        addPoints,
        handleCloseTokenModal,
        handleCloseStreakBroken,
        loading: coupleLoading
    };
}
