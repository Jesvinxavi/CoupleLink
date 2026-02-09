import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import {
    gameTypeLabels,
    getRandomQuestions,
    wouldYouRatherQuestions,
    neverHaveIEverQuestions,
    rapidFireQuestions,
    drawPrompts,
    type GameType
} from '@/data/gameQuestions';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface GameSession {
    id: string;
    couple_id: string;
    game_type: GameType;
    status: 'waiting' | 'active' | 'completed';
    created_by: string;
    current_round: number;
    total_rounds: number;
    game_state: Record<string, any>;
    player_one_id: string | null;
    player_two_id: string | null;
    player_one_joined_at: string | null;
    player_two_joined_at: string | null;
    created_at: string;
    ended_at: string | null;
}

interface GameSessionContextType {
    // Session state
    activeSession: GameSession | null;
    isLoading: boolean;
    error: string | null;

    // Player info
    isPlayerOne: boolean;
    isPlayerTwo: boolean;
    isInSession: boolean;
    partnerInSession: boolean;

    // Actions
    createSession: (gameType: GameType) => Promise<GameSession | null>;
    joinSession: (sessionId: string) => Promise<boolean>;
    leaveSession: () => Promise<void>;
    endSession: () => Promise<void>;
    updateGameState: (newState: Record<string, any>) => Promise<void>;
    nextRound: () => Promise<void>;
    joinOrStartSession: (gameType: GameType) => Promise<GameSession | null>;

    // Helpers
    getGameLabel: (gameType: GameType) => string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const GAME_SESSION_FIELDS = [
    'id',
    'couple_id',
    'created_at',
    'created_by',
    'current_round',
    'ended_at',
    'game_state',
    'game_type',
    'player_one_id',
    'player_one_joined_at',
    'player_two_id',
    'player_two_joined_at',
    'status',
    'total_rounds'
].join(', ');

// Helper to generate unique questions for a session
const generateSessionQuestions = async (gameType: string, coupleId: string, count: number, spicyMode: boolean) => {
    // 1. Fetch all completed sessions for this game type and couple
    const { data: previousSessions } = await supabase
        .from('game_sessions')
        .select('game_state')
        .eq('couple_id', coupleId)
        .eq('game_type', gameType)
        .eq('status', 'completed');

    // 2. Extract seen question IDs
    const seenQuestionIds = new Set<string>();

    previousSessions?.forEach(session => {
        const state = session.game_state as any;
        if (state?.question_ids) {
            state.question_ids.forEach((id: string) => seenQuestionIds.add(id));
        }
    });

    // 3. Get all available questions for this game type
    let allQuestions: any[] = [];
    switch (gameType) {
        case 'would_you_rather':
            allQuestions = wouldYouRatherQuestions; // Get ALL questions initially
            break;
        case 'never_have_i_ever':
            allQuestions = neverHaveIEverQuestions;
            break;
        case 'rapid_fire':
            allQuestions = rapidFireQuestions;
            break;
        case 'draw_and_guess':
            allQuestions = drawPrompts;
            break;
    }

    // 4. Separate Spicy and Regular
    const availableSpicy = allQuestions.filter(q => q.isSpicy && !seenQuestionIds.has(q.id));
    const availableRegular = allQuestions.filter(q => !q.isSpicy && !seenQuestionIds.has(q.id));

    // Also keep seen pools for fallback if we run out
    const seenSpicy = allQuestions.filter(q => q.isSpicy && seenQuestionIds.has(q.id));
    const seenRegular = allQuestions.filter(q => !q.isSpicy && seenQuestionIds.has(q.id));

    // 5. Select Questions Logic
    let selectedQuestions: any[] = [];

    // Determine counts
    const spicyTarget = spicyMode ? 3 : 0; // Max 3 spicy if mode is on
    // const regularTarget = count - spicyTarget; // Unused, calculated later as finalRegularTarget

    // --- Select Spicy ---
    let chosenSpicy: any[] = [];
    if (spicyTarget > 0) {
        if (availableSpicy.length >= spicyTarget) {
            chosenSpicy = getRandomQuestions(availableSpicy, spicyTarget);
        } else {
            // Take all available, fill with seen
            chosenSpicy = [...availableSpicy];
            const needed = spicyTarget - chosenSpicy.length;
            const filled = getRandomQuestions(seenSpicy, needed);
            chosenSpicy = [...chosenSpicy, ...filled];
        }
        // If we still don't have enough (unlikely), we just proceed with what we have
    }

    // --- Select Regular ---
    let chosenRegular: any[] = [];
    // Adjust regular target if we didn't get enough spicy
    const actualSpicyCount = chosenSpicy.length;
    const finalRegularTarget = count - actualSpicyCount;

    if (availableRegular.length >= finalRegularTarget) {
        chosenRegular = getRandomQuestions(availableRegular, finalRegularTarget);
    } else {
        // Take all available, fill with seen
        chosenRegular = [...availableRegular];
        const needed = finalRegularTarget - chosenRegular.length;
        const filled = getRandomQuestions(seenRegular, needed);
        chosenRegular = [...chosenRegular, ...filled];
    }

    // 6. Merge and Shuffle with Constraints (No consecutive spicy)

    if (chosenSpicy.length === 0) {
        // Just shuffle regular
        selectedQuestions = chosenRegular.sort(() => Math.random() - 0.5);
    } else {
        // Randomized insertion strategy
        // Start with regular questions shuffled
        const result = [...chosenRegular].sort(() => Math.random() - 0.5);
        const spicyToInsert = [...chosenSpicy].sort(() => Math.random() - 0.5);

        for (const spicyQ of spicyToInsert) {
            // Find valid indices where we can insert this spicy Q without touching another spicy Q
            // We check slots in the CURRENT result array.

            const validIndices = [];
            // We can insert at index 0 to length
            for (let i = 0; i <= result.length; i++) {
                const prevIsSpicy = i > 0 && (result[i - 1] as any).isSpicy;
                const nextIsSpicy = i < result.length && (result[i] as any).isSpicy;

                if (!prevIsSpicy && !nextIsSpicy) {
                    validIndices.push(i);
                }
            }

            if (validIndices.length > 0) {
                // Pick random valid index
                const insertAt = validIndices[Math.floor(Math.random() * validIndices.length)];
                result.splice(insertAt, 0, spicyQ);
            } else {
                // Fallback: Just push to end if we painted ourselves into a corner
                const fallbackIndex = Math.floor(Math.random() * (result.length + 1));
                result.splice(fallbackIndex, 0, spicyQ);
            }
        }
        selectedQuestions = result;
    }

    return selectedQuestions.map(q => q.id);
};

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function GameSessionProvider({ children }: { children: ReactNode }) {
    const { couple, currentUser } = useCoupleData();
    const [activeSession, setActiveSession] = useState<GameSession | null>(null);
    const activeSessionRef = useRef<GameSession | null>(null);
    const ignoredSessionIds = useRef<Set<string>>(new Set());

    // Keep ref in sync
    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Derived state
    const isPlayerOne = activeSession?.player_one_id === currentUser?.id;
    const isPlayerTwo = activeSession?.player_two_id === currentUser?.id;
    const isInSession = isPlayerOne || isPlayerTwo;
    const partnerInSession = activeSession ?
        (isPlayerOne ? !!activeSession.player_two_id : !!activeSession.player_one_id) : false;

    // Fetch active session for the couple
    const fetchActiveSession = useCallback(async () => {
        if (!couple?.id) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('game_sessions')
                .select(GAME_SESSION_FIELDS)
                .eq('couple_id', couple.id)
                .in('status', ['waiting', 'active'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;
            setActiveSession(data as GameSession | null);
        } catch (err: any) {
            logger.error('GameSessionContext', 'Error fetching game session', err);
            setError(err?.message || 'Failed to fetch game session');
        } finally {
            setIsLoading(false);
        }
    }, [couple?.id]);

    // Initial fetch and realtime subscription
    useEffect(() => {
        fetchActiveSession();

        if (!couple?.id) return;

        // Subscribe to game session changes
        // Subscribe to game session changes
        const channel = supabase
            .channel(`game_session:${couple.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_sessions',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {


                    if (payload.eventType === 'DELETE') {

                        setActiveSession(null);
                    } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newSession = payload.new as GameSession;

                        // Check if we should ignore this session (because we manually ended/left it)
                        if (ignoredSessionIds.current.has(newSession.id)) {
                            // If this was our active session, clear it
                            if (activeSessionRef.current?.id === newSession.id) {
                                setActiveSession(null);
                            }
                            return;
                        }

                        // Check if I am still a player in this session
                        const amIPlayerOne = newSession.player_one_id === currentUser?.id;
                        const amIPlayerTwo = newSession.player_two_id === currentUser?.id;
                        const amIInSession = amIPlayerOne || amIPlayerTwo;

                        if (!amIInSession && payload.eventType === 'UPDATE') {
                            // If I *was* in it (activeSession matches), and now I'm not, clear it.
                            if (activeSessionRef.current?.id === newSession.id) {
                                setActiveSession(null);
                            }
                            return;
                        }

                        // Prevent overwriting with older data if we have a newer active session
                        // (Handles race condition where 'end old session' event checks in after 'create new session')
                        if (activeSessionRef.current && activeSessionRef.current.id !== newSession.id && new Date(activeSessionRef.current.created_at) > new Date(newSession.created_at)) {
                            return;
                        }

                        if (newSession.status === 'completed') {
                            // Do NOT clear state here. Let users see the results.
                            // Only update the session object so UI knows it's completed.
                            setActiveSession(newSession);
                        } else {
                            setActiveSession(newSession);
                        }
                    }
                }

            )
            .subscribe(() => {

            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [couple?.id, fetchActiveSession, currentUser?.id]);

    // Create a new game session
    const createSession = useCallback(async (gameType: GameType): Promise<GameSession | null> => {
        if (!couple?.id || !currentUser?.id) {
            setError('Must be logged in with a partner to create a session');
            return null;
        }

        try {
            setError(null);

            // First, end any existing active sessions
            // Note: We don't add these to ignore list necessarily because createSession creates a NEW one anyway,
            // which will supersede older ones by date check in realtime listener.
            await supabase
                .from('game_sessions')
                .update({ status: 'completed', ended_at: new Date().toISOString() })
                .eq('couple_id', couple.id)
                .in('status', ['waiting', 'active']);

            // Generate unique question IDs for this session
            const ROUNDS = 10; // Hardcoded total_rounds to 10
            const questionIds = await generateSessionQuestions(gameType, couple.id, ROUNDS, couple.spicy_mode ?? false);

            // Create new session
            const { data, error: createError } = await supabase
                .from('game_sessions')
                .insert({
                    couple_id: couple.id,
                    game_type: gameType,
                    status: 'waiting',
                    created_by: currentUser.id,
                    current_round: 1, // Start at round 1
                    total_rounds: ROUNDS,
                    player_one_id: currentUser.id,
                    player_one_joined_at: new Date().toISOString(),
                    game_state: {
                        question_ids: questionIds, // Store the generated questions
                        round_answers: {},
                        all_answers: [],
                        drawer_id: currentUser.id, // For draw and guess
                    }
                })
                .select()
                .single();

            if (createError) throw createError;


            setActiveSession(data as GameSession);
            return data as GameSession;
        } catch (err: any) {
            logger.error('GameSessionContext', 'Error creating game session', err);
            setError(err?.message || 'Failed to create game session');
            return null;
        }
    }, [couple?.id, currentUser?.id, generateSessionQuestions]); // Added generateSessionQuestions to dependencies

    // Join an existing session
    const joinSession = useCallback(async (sessionId: string): Promise<boolean> => {
        if (!currentUser?.id) {
            setError('Must be logged in to join a session');
            return false;
        }

        try {
            setError(null);

            const { data, error: joinError } = await supabase
                .from('game_sessions')
                .update({
                    player_two_id: currentUser.id,
                    player_two_joined_at: new Date().toISOString(),
                    status: 'active'
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (joinError) throw joinError;


            setActiveSession(data as GameSession);
            return true;
        } catch (err: any) {
            logger.error('GameSessionContext', 'Error joining game session', err);
            setError(err?.message || 'Failed to join game session');
            return false;
        }
    }, [currentUser?.id]);

    // Leave the current session
    const leaveSession = useCallback(async () => {
        if (!activeSession || !currentUser?.id) return;

        // Immediately ignore this session for realtime updates
        const sessionId = activeSession.id;
        ignoredSessionIds.current.add(sessionId);

        // Clear local state immediately for responsiveness
        setActiveSession(null);

        try {
            setError(null);

            // CRITICAL: Fetch latest session state from DB to avoid stale state issues
            const { data: latestSession, error: fetchError } = await supabase
                .from('game_sessions')
                .select(GAME_SESSION_FIELDS)
                .eq('id', sessionId)
                .single();

            if (fetchError || !latestSession) {
                return;
            }

            const session = latestSession as GameSession;
            const amPlayerOne = session.player_one_id === currentUser.id;
            const amPlayerTwo = session.player_two_id === currentUser.id;

            if (!amPlayerOne && !amPlayerTwo) {
                return;
            }

            // Check if other player is CURRENTLY present
            const otherPlayerPresent = amPlayerOne
                ? !!session.player_two_id
                : !!session.player_one_id;

            // Always remove myself from the session
            const updateData = amPlayerOne
                ? { player_one_id: null, player_one_joined_at: null }
                : { player_two_id: null, player_two_joined_at: null };

            // Determine status
            let newStatus = session.status;
            let endedAt = session.ended_at;

            if (!otherPlayerPresent) {
                // If I was the last one, end it
                newStatus = 'completed';
                endedAt = new Date().toISOString();
            } else {
                // If game was already effectively over (rounds done), keep it capable of being completed?
                // Current logic forces 'waiting' which allows partner to re-invite properly.
                // But if game was done, we shouldn't revert to waiting.
                // Simple logic for now: Reverting to waiting is safer for "partner left mid-game" UX.
                // If partner left post-game, they should just see "Partner left".
                // Let's stick to existing logic of reverting to waiting IF status was active.
                // If status was already completed, we just leave.
                if (session.status !== 'completed') {
                    newStatus = 'waiting';
                }
            }

            await supabase
                .from('game_sessions')
                .update({
                    ...updateData,
                    status: newStatus,
                    ended_at: endedAt
                })
                .eq('id', session.id);


        } catch (err: any) {
            logger.error('GameSessionContext', 'Error leaving game session', err);
            setError(err?.message || 'Failed to leave game session');
        }
    }, [activeSession, currentUser?.id]);

    // End the session completely
    const endSession = useCallback(async () => {
        if (!activeSession) return;

        const sessionId = activeSession.id;
        ignoredSessionIds.current.add(sessionId);
        setActiveSession(null);

        try {
            setError(null);

            await supabase
                .from('game_sessions')
                .update({
                    status: 'completed',
                    ended_at: new Date().toISOString()
                })
                .eq('id', sessionId);


        } catch (err: any) {
            logger.error('GameSessionContext', 'Error ending game session', err);
            setError(err?.message || 'Failed to end game session');
        }
    }, [activeSession]);

    // Update game state
    const updateGameState = useCallback(async (newState: Record<string, any>) => {
        if (!activeSession) return;

        try {
            setError(null);

            // Fetch the latest session state first to enforce consistency
            const { data: latestSession, error: fetchError } = await supabase
                .from('game_sessions')
                .select('game_state')
                .eq('id', activeSession.id)
                .single();

            if (fetchError) throw fetchError;

            // Merge the new state with the LATEST stored state
            const currentGameState = latestSession?.game_state || {};
            let finalState: Record<string, any> = { ...(currentGameState as object) };

            for (const key in newState) {
                if (key === 'round_answers' && typeof newState[key] === 'object' && currentGameState && typeof currentGameState === 'object' && (currentGameState as any)[key]) {
                    finalState[key] = {
                        ...(currentGameState as any)[key],
                        ...newState[key]
                    };
                } else {
                    finalState[key] = newState[key];
                }
            }

            const { error: updateError } = await supabase
                .from('game_sessions')
                .update({ game_state: finalState })
                .eq('id', activeSession.id);

            if (updateError) throw updateError;

            // Optimistic update
            // Note: We might rely purely on realtime for this, but optimistic is snappier
            // CAUTION: If realtime is slow, this might flick back and forth if we aren't careful.
            // But since we seek a SINGLE source of truth, maybe we should rely on realtime? 
            // Actually, optimistic update is fine as long as we know our update went through. 
            // But we already updated DB above.
            // Let's simpler: Set local state to what we just sent.

            setActiveSession(prev => prev ? { ...prev, game_state: finalState } : null);
        } catch (err: any) {
            logger.error('GameSessionContext', 'Error updating game state', err);
            setError(err?.message || 'Failed to update game state');
        }
    }, [activeSession]);


    // Go to next round
    const nextRound = useCallback(async () => {
        if (!activeSession) return;

        try {
            setError(null);

            // Fetch Latest State first to ensure we don't overwrite recent updates (like all_answers)
            const { data: latestData, error: fetchError } = await supabase
                .from('game_sessions')
                .select(GAME_SESSION_FIELDS)
                .eq('id', activeSession.id)
                .single();

            if (fetchError || !latestData) throw fetchError || new Error("Session not found");

            const currentSession = latestData as GameSession;
            const newRound = currentSession.current_round + 1;

            // Use the FRESH game_state from DB, only modifying what we need
            const nextGameState = {
                ...currentSession.game_state,
                current_question_index: newRound - 1,
                round_answers: {} // Reset round answers
            };

            await supabase
                .from('game_sessions')
                .update({
                    current_round: newRound,
                    game_state: nextGameState
                })
                .eq('id', activeSession.id);


            setActiveSession(prev => prev ? { ...prev, current_round: newRound, game_state: nextGameState } : null);
        } catch (err: any) {
            logger.error('GameSessionContext', 'Error advancing round', err);
            setError(err?.message || 'Failed to advance round');
        }
    }, [activeSession, endSession]);

    // Helper to get game type label
    const getGameLabel = useCallback((gameType: GameType): string => {
        return gameTypeLabels[gameType] || gameType;
    }, []);

    const joinOrStartSession = useCallback(async (gameType: GameType) => {
        // 1. Check if there's a waiting session for this couple created by partner
        if (!couple?.id || !currentUser?.id) return null;

        try {
            // Check for existing waiting session that is NOT created by me (so I can join it)
            const { data: existingSession } = await supabase
                .from('game_sessions')
                .select(GAME_SESSION_FIELDS)
                .eq('couple_id', couple.id)
                .eq('game_type', gameType)
                .eq('status', 'waiting')
                .neq('created_by', currentUser.id) // Important: Join partner's session
                .maybeSingle();

            if (existingSession) {
                await joinSession(existingSession.id);
                return existingSession as GameSession;
            }
            return await createSession(gameType);
        } catch (err) {
            logger.error('GameSessionContext', 'Error in joinOrStartSession', err);
            return null;
        }
    }, [couple?.id, currentUser?.id, joinSession, createSession]);

    const value = useMemo(() => ({
        activeSession,
        isLoading,
        error,
        isPlayerOne,
        isPlayerTwo,
        isInSession,
        partnerInSession,
        createSession,
        joinSession,
        leaveSession,
        endSession,
        updateGameState,
        nextRound,
        getGameLabel,
        joinOrStartSession,
    }), [
        activeSession,
        isLoading,
        error,
        isPlayerOne,
        isPlayerTwo,
        isInSession,
        partnerInSession,
        createSession,
        joinSession,
        leaveSession,
        endSession,
        updateGameState,
        nextRound,
        getGameLabel,
        joinOrStartSession,
    ]);

    return (
        <GameSessionContext.Provider value={value}>
            {children}
        </GameSessionContext.Provider>
    );
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useGameSession() {
    const context = useContext(GameSessionContext);
    if (context === undefined) {
        throw new Error('useGameSession must be used within a GameSessionProvider');
    }
    return context;
}
