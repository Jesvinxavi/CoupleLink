import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Database } from '@/lib/database.types';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type Activity = Database['public']['Tables']['activities']['Row'];
type UserAnswer = Database['public']['Tables']['user_answers']['Row'];

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useDailyChallenge(coupleId: string | null) {
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [userAnswer, setUserAnswer] = useState<UserAnswer | null>(null);
    const [partnerAnswer, setPartnerAnswer] = useState<UserAnswer | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs to avoid circular dependencies in useEffect
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const activityRef = useRef<Activity | null>(null);

    // Keep activityRef in sync
    useEffect(() => {
        activityRef.current = activity;
    }, [activity]);

    // Helper to fetch answers only — uses ref to avoid dependency on activity state
    const fetchAnswers = useCallback(async (currentActivity?: Activity | null) => {
        if (!coupleId) return;
        // Use provided activity, then ref fallback
        const targetActivity = currentActivity || activityRef.current;

        if (!targetActivity) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: answers, error: answersError } = await supabase
                .from('user_answers')
                .select('*')
                .eq('couple_id', coupleId)
                .eq('activity_id', targetActivity.id);

            if (!answersError && answers) {
                const myAns = answers.find(a => a.user_id === user.id) || null;
                const partnerAns = answers.find(a => a.user_id !== user.id) || null;
                setUserAnswer(myAns);
                setPartnerAnswer(partnerAns);
            }
        } catch (err) {
            logger.error('useDailyChallenge', 'Error refreshing answers', err);
        }
    }, [coupleId]); // Only depends on coupleId — uses activityRef for activity

    // Main effect — only depends on coupleId. No circular dependency.
    useEffect(() => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const fetchDailyChallenge = async () => {
            try {
                if (mounted) {
                    setLoading(true);
                    setError(null);
                }

                // 1. Get synchronized daily question from RPC
                const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_daily_question', {
                    couple_id_input: coupleId
                });

                if (rpcError) throw rpcError;

                if (!rpcData.success) {
                    if (mounted) setLoading(false);
                    return;
                }

                const activityData = rpcData.data;
                if (mounted) {
                    setActivity(activityData);
                    activityRef.current = activityData; // Update ref immediately
                }

                // Track question shown in challenge_history
                if (activityData?.id) {
                    const today = new Date().toISOString().split('T')[0];
                    supabase
                        .from('challenge_history')
                        .upsert({
                            couple_id: coupleId,
                            challenge_type: 'question' as const,
                            activity_id: activityData.id,
                            period_key: today,
                            status: 'shown' as const,
                            shown_at: new Date().toISOString()
                        }, { onConflict: 'couple_id,challenge_type,period_key' })
                        .then(({ error }) => {
                            if (error) {
                                logger.error('useDailyChallenge', 'Question tracking error', error);
                            }
                        });
                }

                // 2. Fetch answers immediately
                if (mounted) await fetchAnswers(activityData);

            } catch (err: any) {
                logger.error('useDailyChallenge', 'Error fetching daily challenge', err);
                if (mounted) setError(err?.message || 'Failed to fetch daily challenge');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchDailyChallenge();

        const channelName = `partner-daily-question-${coupleId}`;

        // Realtime subscription — uses fetchAnswers which reads activityRef
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_answers',
                    filter: `couple_id=eq.${coupleId}`
                },
                async () => {
                    fetchAnswers();
                }
            )
            .on('broadcast', { event: 'question_update' }, () => {
                fetchAnswers();
            })
            .subscribe();

        channelRef.current = channel;

        // 30s polling fallback
        const intervalId = setInterval(() => {
            fetchAnswers();
        }, 30000);

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            channelRef.current = null;
        };
    }, [coupleId, fetchAnswers]); // fetchAnswers only depends on coupleId, so this is stable

    const submitAnswer = useCallback(async (answerText: string) => {
        if (!activity || !coupleId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { data, error } = await supabase
                .from('user_answers')
                .insert({
                    couple_id: coupleId,
                    user_id: user.id,
                    activity_id: activity.id,
                    answer_text: answerText,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            setUserAnswer(data);

            // Check if partner already answered - if so, mark as completed
            if (partnerAnswer) {
                const today = new Date().toISOString().split('T')[0];
                supabase
                    .from('challenge_history')
                    .update({
                        status: 'completed' as const,
                        completed_at: new Date().toISOString()
                    })
                    .eq('couple_id', coupleId)
                    .eq('challenge_type', 'question' as const)
                    .eq('period_key', today)
                    .then(({ error }) => {
                        if (error) {
                            logger.error('useDailyChallenge', 'Question completion update error', error);
                        }
                    });
            }

            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'question_update',
                    payload: { action: 'answer', id: data.id }
                });
            }

            return data;
        } catch (err) {
            logger.error('useDailyChallenge', 'Error submitting answer', err);
            throw err;
        }
    }, [activity, coupleId, partnerAnswer]);

    const markAnswerSeen = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('profiles').update({
                last_seen_daily_question_at: new Date().toISOString()
            }).eq('id', user.id);
        } catch (error) {
            logger.error('useDailyChallenge', 'Error marking answer seen', error);
        }
    }, []);

    return useMemo(() => ({
        loading,
        activity,
        userAnswer,
        partnerAnswer,
        error,
        submitAnswer,
        markAnswerSeen
    }), [loading, activity, userAnswer, partnerAnswer, error, submitAnswer, markAnswerSeen]);
}
