// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Check, X, Clock, Timer, Trophy } from "lucide-react"
import { useGameSession, type GameSession } from "@/hooks/useGameSession"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import { rapidFireQuestions } from "@/data/gameQuestions"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface RapidFireGameProps {
    session: GameSession
}

interface RapidFireRoundResult {
    round: number;
    question?: string;
    answers: Record<string, 'yes' | 'no' | 'skip'>;
    myAnswer?: 'yes' | 'no' | 'skip';
    partnerAnswer?: 'yes' | 'no' | 'skip';
    matched: boolean;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function RapidFireGame({ session }: RapidFireGameProps) {
    const { updateGameState, nextRound, isPlayerOne } = useGameSession();
    const { partner, currentUser } = useCoupleData();

    const [timeLeft, setTimeLeft] = useState(10);
    const [gameComplete, setGameComplete] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);



    // Determine player IDs from session
    const myId = currentUser?.id;
    const partnerId = session.player_one_id === myId ? session.player_two_id : session.player_one_id;
    const partnerInSession = !!session.player_two_id && session.status === 'active';

    // Get current question ID from session state
    const questionIds = session.game_state?.question_ids || [];
    const currentQuestionId = questionIds[session.current_round - 1];

    // Find the question object
    const currentQuestion = useMemo(() => {
        if (!currentQuestionId) return null;
        return rapidFireQuestions.find(q => q.id === currentQuestionId);
    }, [currentQuestionId]);
    const gameState = session.game_state || {};
    const roundAnswers = gameState.round_answers || {};
    const allAnswers = gameState.all_answers || [];

    const myAnswer = roundAnswers[myId || ''];
    const partnerAnswer = roundAnswers[partnerId || ''];
    const bothAnswered = myAnswer !== undefined && partnerAnswer !== undefined;

    // Handle auto-submit when timer runs out
    const handleAutoSubmit = useCallback(async () => {
        if (myAnswer === undefined && myId) {
            await updateGameState({
                round_answers: {
                    ...roundAnswers,
                    [myId]: 'skip'
                }
            });
        }
    }, [myAnswer, myId, roundAnswers, updateGameState]);

    // Timer countdown
    useEffect(() => {
        if (myAnswer !== undefined || !partnerInSession || gameComplete) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [myAnswer, partnerInSession, gameComplete]);

    const hasFiredAutoSubmit = useRef(false);

    useEffect(() => {
        if (timeLeft === 0 && !hasFiredAutoSubmit.current && myAnswer === undefined && !gameComplete) {
            hasFiredAutoSubmit.current = true;
            handleAutoSubmit();
        }
    }, [timeLeft, handleAutoSubmit, myAnswer, gameComplete]);

    // Reset fired flag on round change
    useEffect(() => {
        hasFiredAutoSubmit.current = false;
    }, [session.current_round]);


    const [isAdvancing, setIsAdvancing] = useState(false);

    // Auto-advance
    useEffect(() => {
        if (bothAnswered && !gameComplete && isPlayerOne && !isAdvancing) {
            const timer = setTimeout(() => {
                handleNextRound();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [bothAnswered, gameComplete, isPlayerOne, isAdvancing]);

    // Reset state when round changes
    useEffect(() => {
        setTimeLeft(10);
    }, [session.current_round]);

    // Check if game is complete
    useEffect(() => {
        if (session.current_round > session.total_rounds) {
            setGameComplete(true);
        }
    }, [session.current_round, session.total_rounds]);

    const handleSelectAnswer = async (answer: 'yes' | 'no') => {
        if (myAnswer !== undefined || !myId) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        await updateGameState({
            round_answers: {
                ...roundAnswers,
                [myId]: answer
            }
        });
    };

    const handleNextRound = async () => {
        if (isAdvancing) return;
        setIsAdvancing(true);

        try {
            // Fetch latest game state to ensure we don't lose history
            const { data } = await supabase
                .from('game_sessions')
                .select('game_state')
                .eq('id', session.id)
                .single();

            const latestGameState = (data?.game_state as { all_answers?: RapidFireRoundResult[]; round_answers?: Record<string, 'yes' | 'no' | 'skip'> }) || {};
            const currentAllAnswers = latestGameState.all_answers || [];
            const latestRoundAnswers = latestGameState.round_answers || {};

            // Derive answers from the DB state
            const dbMyAnswer = latestRoundAnswers[myId || ''];
            const dbPartnerAnswer = latestRoundAnswers[partnerId || ''];

            // In Rapid Fire, we also check for 'skip'
            const isMatch = dbMyAnswer === dbPartnerAnswer &&
                dbMyAnswer !== 'skip' &&
                dbPartnerAnswer !== 'skip' &&
                dbMyAnswer !== undefined;

            const roundResult = {
                round: session.current_round,
                question: currentQuestion?.question,
                // Store explicit answers by ID to prevent "You/Partner" swap issues
                answers: {
                    [myId || '']: dbMyAnswer,
                    [partnerId || '']: dbPartnerAnswer
                },
                // Keep these for backward compatibility
                myAnswer: dbMyAnswer,
                partnerAnswer: dbPartnerAnswer,
                matched: isMatch
            };

            const newAllAnswers = [...currentAllAnswers, roundResult];

            if (session.current_round >= session.total_rounds) {
                await updateGameState({
                    round_answers: {},
                    all_answers: newAllAnswers
                });
                await nextRound();
                setGameComplete(true);
            } else {
                await updateGameState({
                    round_answers: {},
                    all_answers: newAllAnswers
                });
                await nextRound();
            }
        } finally {
            setIsAdvancing(false);
        }
    };



    // Calculate results
    const matchCount = allAnswers.filter((a: RapidFireRoundResult) => a.matched).length;
    const matchPercentage = allAnswers.length > 0 ? Math.round((matchCount / allAnswers.length) * 100) : 0;

    const getAnswerEmoji = (answer: string | undefined) => {
        if (answer === 'yes') return '✅';
        if (answer === 'no') return '❌';
        if (answer === 'skip') return '⏭️';
        return '❓';
    };

    // Game Complete Results Screen
    if (gameComplete || !currentQuestion) {
        return (
            <div className="text-center py-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                >
                    <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Game Complete! ⚡
                </h3>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 my-6">
                    <p className="text-4xl font-bold text-amber-500 mb-2">{matchPercentage}%</p>
                    <p className="text-gray-600 dark:text-gray-400">Sync Rate</p>
                    <p className="text-sm text-gray-500 mt-2">
                        You synced on {matchCount} out of {allAnswers.length} questions
                    </p>
                </div>

                {/* Answer History */}
                <div className="text-left -mb-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Answers:</h4>
                    <div className="max-h-[16.25rem] overflow-y-auto pr-1">
                        <div className="space-y-2">
                            {allAnswers.map((answer: RapidFireRoundResult, idx: number) => {
                                // Resolve answers based on IDs for correctness
                                // For new data: use answer.answers[id]
                                // For legacy data: fallback to myAnswer/partnerAnswer, BUT context depends on who is viewing
                                // Legacy data 'myAnswer' is ALWAYS Player 1's answer. 'partnerAnswer' is ALWAYS Player 2's answer.

                                const isPlayerOne = currentUser?.id === session.player_one_id;

                                let myCorrectAnswer: 'yes' | 'no' | 'skip' | undefined = answer.answers?.[currentUser?.id || ''];
                                let partnerCorrectAnswer: 'yes' | 'no' | 'skip' | undefined = answer.answers?.[partner?.id || ''];

                                if (myCorrectAnswer === undefined) {
                                    // Fallback for legacy data
                                    if (isPlayerOne) {
                                        myCorrectAnswer = answer.myAnswer;
                                    } else {
                                        myCorrectAnswer = answer.partnerAnswer;
                                    }
                                }

                                if (partnerCorrectAnswer === undefined) {
                                    // Fallback for legacy data
                                    if (isPlayerOne) {
                                        partnerCorrectAnswer = answer.partnerAnswer;
                                    } else {
                                        // If I am Player 2, my partner is Player 1
                                        partnerCorrectAnswer = answer.myAnswer;
                                    }
                                }

                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg text-sm ${answer.matched
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                            : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                            Q{answer.round}: {answer.question?.substring(0, 40)}...
                                        </p>
                                        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                                            <span>You: {getAnswerEmoji(myCorrectAnswer)} {(myCorrectAnswer || '').charAt(0).toUpperCase() + (myCorrectAnswer || '').slice(1)}</span>
                                            <span>{partner?.first_name}: {getAnswerEmoji(partnerCorrectAnswer)} {(partnerCorrectAnswer || '').charAt(0).toUpperCase() + (partnerCorrectAnswer || '').slice(1)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Question {Math.min(session.current_round, session.total_rounds)} of {session.total_rounds}</span>
                <span>{matchCount} syncs so far</span>
            </div>

            {/* Timer Bar */}
            {myAnswer === undefined && partnerInSession && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                            <Timer className="w-4 h-4" />
                            Time remaining
                        </span>
                        <span className={`font-bold text-lg tabular-nums ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={false}
                            animate={{ width: `${(timeLeft / 10) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                            className={`h-full rounded-full transition-colors duration-300 ${timeLeft <= 3 ? 'bg-red-500' : 'bg-amber-500'}`}
                        />
                    </div>
                </div>
            )}

            {/* Question Card */}
            <motion.div
                key={session.current_round}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 mb-6"
            >
                <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-3">
                    <Zap className="w-4 h-4" />
                    Rapid Fire
                    {currentQuestion.isSpicy && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                            🔥 Spicy
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentQuestion.question}
                </h3>
            </motion.div>

            {/* Answer Buttons */}
            {myAnswer === undefined ? (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectAnswer('yes')}
                        className="p-6 rounded-xl text-center bg-green-500 md:hover:bg-green-600 active:bg-green-600 text-white transition-all"
                    >
                        <Check className="w-10 h-10 mx-auto mb-2" />
                        <span className="font-bold text-lg">Yes</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectAnswer('no')}
                        className="p-6 rounded-xl text-center bg-red-500 md:hover:bg-red-600 active:bg-red-600 text-white transition-all"
                    >
                        <X className="w-10 h-10 mx-auto mb-2" />
                        <span className="font-bold text-lg">No</span>
                    </motion.button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-6 rounded-xl text-center ${myAnswer === 'yes' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 opacity-50'}`}>
                        <Check className={`w-10 h-10 mx-auto mb-2 ${myAnswer === 'yes' ? 'text-white' : 'text-green-500'}`} />
                        <span className="font-bold text-lg">Yes</span>
                        {myAnswer === 'yes' && <div className="text-sm mt-1 text-white/80">Your answer</div>}
                    </div>

                    <div className={`p-6 rounded-xl text-center ${myAnswer === 'no' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 opacity-50'}`}>
                        <X className={`w-10 h-10 mx-auto mb-2 ${myAnswer === 'no' ? 'text-white' : 'text-red-500'}`} />
                        <span className="font-bold text-lg">No</span>
                        {myAnswer === 'no' && <div className="text-sm mt-1 text-white/80">Your answer</div>}
                    </div>
                </div>
            )}

            {/* Result / Status */}
            <AnimatePresence mode="wait">
                {myAnswer !== undefined && !bothAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center py-6"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-12 h-12 mx-auto mb-3"
                        >
                            <Clock className="w-12 h-12 text-gray-400" />
                        </motion.div>
                        <p className="text-gray-500 dark:text-gray-400">
                            Waiting for {partner?.first_name || 'partner'}...
                        </p>
                    </motion.div>
                )}
                {bothAnswered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <p className="text-gray-500 font-medium">Next question coming up...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!partnerInSession && myAnswer === undefined && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    Waiting for partner to join the game...
                </div>
            )}
        </div>
    );
}
