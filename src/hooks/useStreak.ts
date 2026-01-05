import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleData } from './useCoupleData';
import { useGlobalModalQueue } from '../context/GlobalModalQueueContext';

export function useStreak({ enableTokenCheck = true }: { enableTokenCheck?: boolean } = {}) {
    const { couple, userProfile, loading: coupleLoading } = useCoupleData();
    const { enqueueModal, ackModal, currentModal } = useGlobalModalQueue();

    // Derived state from global queue
    const showTokenModal = currentModal?.type === 'raincheck';
    const streakBroken = currentModal?.type === 'streak_broken';
    const previousStreak = currentModal?.type === 'streak_broken' ? currentModal.data.previousStreak : 0;

    const prevTokensRef = useRef<number | null>(null);
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
                if (data && (data as any).is_broken) {
                    enqueueModal('streak_broken', {
                        previousStreak: (data as any).previous_streak
                    });
                }
            } catch (err) {
                console.error('Error checking streak status:', err);
            }
        };

        checkBroken();
    }, [couple?.id, enqueueModal]);

    useEffect(() => {
        if (!couple || !userProfile || !enableTokenCheck) return;

        const currentTokens = couple.rain_check_tokens || 0;
        const lastSeen = userProfile.last_seen_rain_check_tokens || 0;

        if (prevTokensRef.current === null) {
            prevTokensRef.current = currentTokens;
            if (currentTokens > lastSeen) {
                enqueueModal('raincheck');
            }
            return;
        }

        if (currentTokens > prevTokensRef.current) {
            console.log('[useStreak] Tokens increased:', {
                current: currentTokens,
                prev: prevTokensRef.current,
                lastSeen,
                isRefunding: isRefundingRef.current
            });

            if (!isRefundingRef.current) {
                console.log('[useStreak] Enqueueing Rain Check modal');
                enqueueModal('raincheck');
            } else {
                console.log('[useStreak] Token increase ignored due to refund state');
            }
        }

        prevTokensRef.current = currentTokens;

    }, [couple?.rain_check_tokens, couple?.current_streak, userProfile?.last_seen_rain_check_tokens, enableTokenCheck, enqueueModal]);

    const handleCloseTokenModal = async () => {
        // Acknowledge the modal to remove it from queue
        ackModal('raincheck');

        const currentTokens = couple?.rain_check_tokens || 0;
        if (userProfile?.id && currentTokens > (userProfile.last_seen_rain_check_tokens || 0)) {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_seen_rain_check_tokens: currentTokens } as any)
                    .eq('id', userProfile.id);
            } catch (err) {
                console.error('[useStreak] Failed to update last_seen_rain_check_tokens', err);
            }
        }
    };

    // Self-healing: If currents tokens are LESS than last seen (e.g. spent tokens), 
    // update last_seen silently so the NEXT earn counts as an increase.
    useEffect(() => {
        if (!couple || !userProfile || !enableTokenCheck) return;
        const currentTokens = couple.rain_check_tokens || 0;
        const lastSeen = userProfile.last_seen_rain_check_tokens || 0;

        if (currentTokens < lastSeen) {
            console.log('[useStreak] Current tokens < last seen. Syncing baseline.', { currentTokens, lastSeen });
            supabase
                .from('profiles')
                .update({ last_seen_rain_check_tokens: currentTokens } as any)
                .eq('id', userProfile.id)
                .then(({ error }) => {
                    if (error) console.error('[useStreak] Failed to silent-sync last_seen', error);
                });
        }
    }, [couple?.rain_check_tokens, userProfile?.last_seen_rain_check_tokens, userProfile?.id]);

    const handleCloseStreakBroken = () => {
        ackModal('streak_broken');
    };

    const restoreStreak = async () => {
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
            console.error('Error restoring streak:', err);
        }
    };

    const checkStreakUpdate = async () => {
        if (!couple?.id) return;
        try {
            await supabase.rpc('check_and_update_streak', {
                p_couple_id: couple.id
            });
        } catch (err) {
            console.error('Error updating streak:', err);
        }
    };

    const addPoints = async (points: number) => {
        if (!couple?.id) return;
        try {
            await supabase.rpc('add_love_action_points', {
                p_couple_id: couple.id,
                p_points: points
            });
        } catch (err) {
            console.error('Error adding points:', err);
        }
    };

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
