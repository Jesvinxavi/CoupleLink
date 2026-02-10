import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import {
    wouldYouRatherQuestions,
    neverHaveIEverQuestions,
    rapidFireQuestions,
    drawPrompts,
    type GameType
} from '@/data/gameQuestions';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export type GameProgress = Record<GameType, number>;

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useGameProgress(coupleId: string | undefined, spicyMode: boolean = false) {
    const [progress, setProgress] = useState<GameProgress>({
        'draw_and_guess': 0,
        'would_you_rather': 0,
        'never_have_i_ever': 0,
        'rapid_fire': 0
    });
    const [loading, setLoading] = useState(true);

    const fetchProgress = useCallback(async () => {
        if (!coupleId) return;

        try {
            // Fetch all COMPLETED game sessions for this couple
            // We only care about completed sessions to count "answered" questions
            // OR active/waiting sessions if we want to count them too? 
            // Requirement says "couples have answered", implying completed rounds.
            // However, our game state stores 'question_ids' which are used in the session.
            // A completed session definitely has answered questions.
            // Ideally, we should check 'round_answers' to be 100% sure, but 'question_ids' 
            // in a completed session is a good proxy for "consumed" questions.

            const { data: sessions, error } = await supabase
                .from('game_sessions')
                .select('game_type, game_state')
                .eq('couple_id', coupleId)
                .eq('status', 'completed');

            if (error) throw error;

            const seenIds: Record<string, Set<string>> = {
                'draw_and_guess': new Set(),
                'would_you_rather': new Set(),
                'never_have_i_ever': new Set(),
                'rapid_fire': new Set()
            };

            sessions?.forEach(session => {
                const type = session.game_type as GameType;
                const qIds = (session.game_state as any)?.question_ids || [];
                if (seenIds[type]) {
                    qIds.forEach((id: string) => seenIds[type].add(id));
                }
            });

            // Calculate Percentages
            // If spicyMode is OFF, we exclude spicy questions from the total count
            // And we also only count seen questions that are in the available pool

            const getQuestionsForType = (type: GameType) => {
                switch (type) {
                    case 'would_you_rather': return wouldYouRatherQuestions;
                    case 'never_have_i_ever': return neverHaveIEverQuestions;
                    case 'rapid_fire': return rapidFireQuestions;
                    case 'draw_and_guess': return drawPrompts;
                    default: return [];
                }
            };

            const newProgress: GameProgress = {
                'draw_and_guess': 0,
                'would_you_rather': 0,
                'never_have_i_ever': 0,
                'rapid_fire': 0
            };

            (Object.keys(newProgress) as GameType[]).forEach(key => {
                const allQuestionsForType = getQuestionsForType(key);

                // Filter available questions based on spicy settings
                const availableQuestions = spicyMode
                    ? allQuestionsForType
                    : allQuestionsForType.filter(q => !q.isSpicy);

                const total = availableQuestions.length;

                // Count how many seen questions are in the available set
                // We need to check if the seen ID is in the available questions
                // This handles the case where they might have answered a spicy question previously
                // but now have spicy mode OFF - it shouldn't count towards their current progress
                const availableIds = new Set(availableQuestions.map(q => q.id));
                let seenCount = 0;
                seenIds[key].forEach(id => {
                    if (availableIds.has(id)) {
                        seenCount++;
                    }
                });

                newProgress[key] = total > 0 ? Math.min(100, Math.round((seenCount / total) * 100)) : 0;
            });

            setProgress(newProgress);
        } catch (err) {
            logger.error('useGameProgress', 'Error fetching game progress', err);
        } finally {
            setLoading(false);
        }
    }, [coupleId, spicyMode]);

    useEffect(() => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        fetchProgress();

        // Subscribe to changes in game_sessions to update progress in real-time
        const channel = supabase
            .channel(`game_progress_tracker:${coupleId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // Only care when a session completes (status update)
                    schema: 'public',
                    table: 'game_sessions',
                    filter: `couple_id=eq.${coupleId}`
                },
                (payload) => {
                    if (payload.new.status === 'completed') {
                        fetchProgress();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [coupleId, spicyMode, fetchProgress]);

    return useMemo(() => ({ progress, loading }), [progress, loading]);
}
