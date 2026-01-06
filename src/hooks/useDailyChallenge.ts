import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '@/lib/database.types';

type Activity = Database['public']['Tables']['activities']['Row'];
type UserAnswer = Database['public']['Tables']['user_answers']['Row'];

export function useDailyChallenge(coupleId: string | null) {
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [userAnswer, setUserAnswer] = useState<UserAnswer | null>(null);
    const [partnerAnswer, setPartnerAnswer] = useState<UserAnswer | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Channel Ref
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Helper to fetch answers only
    const fetchAnswers = async (currentActivity: Activity | null) => {
        if (!coupleId) return;
        // Use provided activity or fallback to current state if available
        const targetActivity = currentActivity || activity;

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
            console.error("Error refreshing answers:", err);
        }
    };

    useEffect(() => {
        if (!coupleId) {
            setLoading(false)
            return
        }

        let mounted = true;

        const fetchDailyChallenge = async () => {
            // ... existing start ...
            try {
                if (mounted) {
                    setLoading(true)
                    setError(null)
                }

                // 1. Get synchronized daily question from RPC
                const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_daily_question', {
                    couple_id_input: coupleId
                })

                if (rpcError) throw rpcError

                if (!rpcData.success) {
                    if (mounted) setLoading(false)
                    return
                }


                const activityData = rpcData.data
                if (mounted) setActivity(activityData)

                // Track question shown in challenge_history
                if (activityData?.id) {
                    const today = new Date().toISOString().split('T')[0];
                    supabase
                        .from('challenge_history')
                        .upsert({
                            couple_id: coupleId,
                            challenge_type: 'question',
                            activity_id: activityData.id,
                            period_key: today,
                            status: 'shown',
                            shown_at: new Date().toISOString()
                        }, { onConflict: 'couple_id,challenge_type,period_key' })
                        .then(({ error }) => {
                            if (error) console.error('[QuestionTracking] Error:', error);
                        });
                }

                // 2. Fetch answers immediately using our helper
                if (mounted) await fetchAnswers(activityData);

            } catch (err: any) {
                console.error('Error fetching daily challenge:', err)
                if (mounted) setError(err.message)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchDailyChallenge()

        const channelName = `partner-daily-question-${coupleId}`;

        // Realtime subscription
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
                    // Fetch answers using the LATEST activity from state (checked inside helper)
                    // Note: 'activity' in closure might be stale if not careful. 
                    // But we can trigger re-fetch of everything or just answers.
                    // To be safe and simple, we call fetchAnswers which uses 'activity' from state ref? 
                    // Actually, useEffect closure traps 'activity'.
                    // We need to use a ref for activity if we want to access it inside the channel callback without re-subscribing.
                    // BETTER: Just re-fetch the answers for the *current* Activity ID if we have it?
                    // OR: Just re-run fetchDailyChallenge? No, that's heavy (RPC call).

                    // We need access to the current Activity ID.
                    // Since we can't easily get it from closure without adding it to dependency array (re-subscribing),
                    // let's rely on the fact that 'fetchAnswers' uses the 'activity' from the closure, 
                    // AND we add 'activity?.id' to the dependency array. 
                    // This means whenever activity changes (once a day), we re-subscribe. This is acceptable.
                    fetchAnswers(null);
                }
            )
            .on('broadcast', { event: 'question_update' }, () => {
                fetchAnswers(null);
            })
            .subscribe()

        channelRef.current = channel;

        // 30s polling fallback
        const intervalId = setInterval(() => {
            fetchAnswers(null);
        }, 30000);

        return () => {
            mounted = false;
            supabase.removeChannel(channel)
            clearInterval(intervalId);
            channelRef.current = null;
        }
    }, [coupleId, activity?.id]) // Re-run if activity changes, ensuring updated closure for fetchAnswers

    const submitAnswer = async (answerText: string) => {
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
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq('couple_id', coupleId)
                    .eq('challenge_type', 'question')
                    .eq('period_key', today)
                    .then(({ error }) => {
                        if (error) console.error('[QuestionTracking] Completion error:', error);
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
            console.error("Error submitting answer:", err);
            throw err;
        }
    };

    const markAnswerSeen = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('profiles').update({
                last_seen_daily_question_at: new Date().toISOString()
            }).eq('id', user.id);
        } catch (error) {
            console.error("Error marking answer seen:", error);
        }
    };

    return {
        loading,
        activity,
        userAnswer,
        partnerAnswer,
        error,
        submitAnswer,
        markAnswerSeen
    };
}
