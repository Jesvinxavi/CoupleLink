// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Palette, Eraser, Undo, Clock, Eye, Check, Sparkles } from "lucide-react"
import CanvasDraw from "react-canvas-draw"
import { Button } from "@/components/ui/button"

console.log('DEBUG: DrawAndGuessGame module load');
try {
    console.log('DEBUG: React inside DrawAndGuessGame version:', React?.version);
    console.log('DEBUG: CanvasDraw inside DrawAndGuessGame:', typeof CanvasDraw);
} catch (e) {
    console.error('DEBUG: Error logging in DrawAndGuessGame:', e);
}
import { useGameSession, type GameSession } from "@/hooks/useGameSession"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import { drawPrompts } from "@/data/gameQuestions"
import { GameTimer } from "@/components/games/GameTimer"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface DrawAndGuessGameProps {
    session: GameSession
}

interface DrawRoundResult {
    round: number;
    word: string;
    drawerId: string;
    guesserId: string;
    correct: boolean;
    guess: string;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function DrawAndGuessGame({ session }: DrawAndGuessGameProps) {
    const { updateGameState, nextRound, isPlayerOne, isPlayerTwo, partnerInSession } = useGameSession();


    const { couple } = useCoupleData();



    const canvasRef = useRef<any>(null);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushRadius, setBrushRadius] = useState(4);
    const [showAnswer, setShowAnswer] = useState(false);

    const [guess, setGuess] = useState('');


    const [isCorrect, setIsCorrect] = useState(false);


    const [hasGuessed, setHasGuessed] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Get current prompt ID from session state
    const questionIds = session.game_state?.question_ids || [];
    const currentQuestionId = questionIds[session.current_round - 1];

    // Find the prompt object
    const currentPrompt = useMemo(() => {
        if (!currentQuestionId) return null;
        return drawPrompts.find(q => q.id === currentQuestionId);
    }, [currentQuestionId]);

    // Determine who is the drawer this round (alternates each round)
    const isDrawer = useMemo(() => {
        const drawerIsPlayerOne = session.current_round % 2 === 1;
        return (drawerIsPlayerOne && isPlayerOne) || (!drawerIsPlayerOne && isPlayerTwo);
    }, [session.current_round, isPlayerOne, isPlayerTwo]);

    const colors = ["#000000", "#FF0000", "#FF6B00", "#FFEB3B", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63"];

    const handleTimeUp = useCallback(() => {
        setShowAnswer(true);
    }, []);

    // Reset state when round changes
    useEffect(() => {
        setShowAnswer(false);
        setGuess('');
        setIsCorrect(false);
        setHasGuessed(false);
        setIsInputFocused(false);
        if (canvasRef.current) {
            canvasRef.current.clear();
        }
    }, [session.current_round]);

    // Real-time canvas sync
    useEffect(() => {
        if (!couple?.id) return;

        const channel = supabase.channel(`draw_game:${session.id}`)
            .on('broadcast', { event: 'draw' }, (payload) => {
                if (!isDrawer && canvasRef.current && payload.payload.data) {
                    canvasRef.current.loadSaveData(payload.payload.data, true);
                }
            })
            .on('broadcast', { event: 'clear' }, () => {
                if (!isDrawer && canvasRef.current) {
                    canvasRef.current.clear();
                }
            })
            .on('broadcast', { event: 'guess' }, (payload) => {
                if (isDrawer && payload.payload.correct) {
                    setIsCorrect(true);
                    setShowAnswer(true);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [couple?.id, session.id, isDrawer]);

    const handleDraw = useCallback(() => {
        if (!isDrawer || !canvasRef.current) return;

        const data = canvasRef.current.getSaveData();
        supabase.channel(`draw_game:${session.id}`).send({
            type: 'broadcast',
            event: 'draw',
            payload: { data }
        });
    }, [isDrawer, session.id]);

    const clearCanvas = () => {
        if (!isDrawer || !canvasRef.current) return;
        canvasRef.current.clear();
        supabase.channel(`draw_game:${session.id}`).send({
            type: 'broadcast',
            event: 'clear',
            payload: {}
        });
    };

    const undoLast = () => {
        if (!isDrawer || !canvasRef.current) return;
        canvasRef.current.undo();
        handleDraw();
    };

    const handleSubmitGuess = () => {
        if (!guess.trim()) return;

        const correct = !!(currentPrompt && guess.toLowerCase().trim() === currentPrompt.word.toLowerCase());
        setIsCorrect(correct);

        if (correct) {
            setShowAnswer(true);
        } else {
            // Show wrong guess feedback briefly
            setHasGuessed(true);
            setTimeout(() => {
                setHasGuessed(false);
                setGuess('');
            }, 1000);
        }

        // Broadcast the guess result
        supabase.channel(`draw_game:${session.id}`).send({
            type: 'broadcast',
            event: 'guess',
            payload: { guess: guess, correct }
        });
    };

    const [isAdvancing, setIsAdvancing] = useState(false);

    // Auto-advance after 3 seconds when answer is shown
    useEffect(() => {
        if (!showAnswer) return;


        const timer = setTimeout(() => {
            // Only Player One triggers the round advance to prevent race conditions (double increments)
            if (isPlayerOne && !isAdvancing) {
                handleNextRound();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [showAnswer, isPlayerOne, isAdvancing]);

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

            const latestGameState = (data?.game_state as { all_answers?: DrawRoundResult[] }) || {};
            const currentAllAnswers = latestGameState.all_answers || [];

            // Define the result for this round
            const roundResult = {
                round: session.current_round,
                word: currentPrompt ? currentPrompt.word : '',
                drawerId: (isDrawer ? (isPlayerOne ? session.player_one_id : session.player_two_id) : (isPlayerOne ? session.player_two_id : session.player_one_id)) || '',
                guesserId: (!isDrawer ? (isPlayerOne ? session.player_one_id : session.player_two_id) : (isPlayerOne ? session.player_two_id : session.player_one_id)) || '',
                correct: isCorrect,
                guess: guess
            };

            const alreadySaved = currentAllAnswers.some((a: DrawRoundResult) => a.round === session.current_round);
            let newAllAnswers = currentAllAnswers;

            if (!alreadySaved) {
                newAllAnswers = [...currentAllAnswers, roundResult];
            }

            if (session.current_round >= session.total_rounds) {
                await updateGameState({
                    round_answers: {},
                    all_answers: newAllAnswers
                });
                // Ensure we push the final round update so game completes for everyone
                await nextRound();
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

    if (!currentPrompt || session.current_round > session.total_rounds) {
        // Calculate Stats
        const allAnswers = (session.game_state?.all_answers || []) as DrawRoundResult[];
        const totalGames = allAnswers.length;
        const correctGames = allAnswers.filter(a => a.correct).length;
        const percentage = totalGames > 0 ? Math.round((correctGames / totalGames) * 100) : 0;

        // Calculate individual stats per user
        const playerOneId = session.player_one_id;
        const playerTwoId = session.player_two_id;

        // Count guesses by each player (guesser is the one who needs to guess correctly)
        const playerOneGuesses = allAnswers.filter(a => a.guesserId === playerOneId);
        const playerTwoGuesses = allAnswers.filter(a => a.guesserId === playerTwoId);

        const playerOneCorrect = playerOneGuesses.filter(a => a.correct).length;
        const playerTwoCorrect = playerTwoGuesses.filter(a => a.correct).length;

        const playerOnePercentage = playerOneGuesses.length > 0 ? Math.round((playerOneCorrect / playerOneGuesses.length) * 100) : 0;
        const playerTwoPercentage = playerTwoGuesses.length > 0 ? Math.round((playerTwoCorrect / playerTwoGuesses.length) * 100) : 0;

        return (
            <div className="text-center py-2">
                <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Game Complete! 🎉
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    You're both amazing artists!
                </p>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl max-w-xs mx-auto mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Couple Score</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{percentage}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ({correctGames} / {totalGames} correct)
                    </p>
                </div>

                {/* Individual User Stats */}
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Player 1</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{playerOnePercentage}%</p>
                        <p className="text-xs text-gray-400">({playerOneCorrect}/{playerOneGuesses.length} guesses)</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Player 2</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{playerTwoPercentage}%</p>
                        <p className="text-xs text-gray-400">({playerTwoCorrect}/{playerTwoGuesses.length} guesses)</p>
                    </div>
                </div>

                {/* Individual Breakdown (Simple) */}
                <div className="-mb-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Round History:</h4>
                    <div className="max-h-[16.25rem] overflow-y-auto pr-1">
                        <div className="space-y-2 text-sm text-gray-500">
                            {allAnswers.map((ans, i) => (
                                <div key={i} className="flex justify-between max-w-xs mx-auto border-b border-gray-100 dark:border-gray-800 py-2 last:border-0">
                                    <span>Round {ans.round} ({ans.word})</span>
                                    <span className={ans.correct ? "text-green-500" : "text-red-500"}>
                                        {ans.correct ? "Correct" : "Missed"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header with Timer and Role */}
            <div className="flex items-center justify-between mb-4">
                <div className={`px-4 py-2 rounded-full ${isDrawer ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {isDrawer ? (
                        <span className="flex items-center gap-2 font-medium">
                            <Palette className="w-4 h-4" />
                            You're Drawing
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 font-medium">
                            <Eye className="w-4 h-4" />
                            You're Guessing
                        </span>
                    )}
                </div>

                <GameTimer
                    key={`timer-${session.id}-${session.current_round}`}
                    duration={60}
                    onTimeUp={handleTimeUp}
                    currentRound={session.current_round}
                    showAnswer={showAnswer}
                    isPaused={!partnerInSession}
                />

            </div>

            {/* Word to Draw (only visible to drawer) */}
            {isDrawer && !showAnswer && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-500 text-white rounded-xl p-4 mb-4 text-center"
                >
                    <p className="text-sm opacity-80 mb-1">Draw this word:</p>
                    <p className="text-2xl font-bold">{currentPrompt.word}</p>
                    {currentPrompt.isSpicy && (
                        <span className="inline-block mt-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                            🔥 Spicy
                        </span>
                    )}
                </motion.div>
            )}

            {/* Canvas */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border-2 border-black dark:border-white">
                <CanvasDraw
                    ref={canvasRef}
                    brushColor={brushColor}
                    brushRadius={brushRadius}
                    lazyRadius={0}
                    canvasWidth={Math.max(200, Math.min(600, window.innerWidth - 48))}
                    canvasHeight={350}

                    onChange={isDrawer ? handleDraw : undefined}
                    disabled={!isDrawer}
                    hideGrid
                    className="touch-none mx-auto"
                />
            </div>

            {/* Drawing Tools (only for drawer) */}
            {isDrawer && !showAnswer && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Color Palette */}
                        <div className="flex gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform ${brushColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setBrushColor(c)}
                                />
                            ))}
                        </div>

                        {/* Brush Size */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setBrushRadius(Math.max(2, brushRadius - 2))}>-</Button>
                            <span className="text-sm w-6 text-center">{brushRadius}</span>
                            <Button variant="outline" size="icon" onClick={() => setBrushRadius(Math.min(20, brushRadius + 2))}>+</Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={undoLast}>
                                <Undo className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={clearCanvas}>
                                <Eraser className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guess Input (only for guesser) */}
            {!isDrawer && !showAnswer && (
                <div
                    className={` ${isInputFocused
                        ? 'fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.1)]'
                        : 'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4'
                        }`}
                >
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitGuess()}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Type your guess..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <Button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleSubmitGuess}
                            disabled={!guess.trim()}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 h-auto"
                        >
                            <Check className="w-5 h-5" />
                        </Button>
                    </div>
                    {hasGuessed && !isCorrect && (
                        <p className="text-red-500 text-sm mt-2">Not quite! Try again...</p>
                    )}
                </div>
            )}

            {/* Answer Reveal */}
            <AnimatePresence>
                {showAnswer && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <div className={`rounded-2xl p-6 mb-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                            {isCorrect ? (
                                <>
                                    <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <h4 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">
                                        Correct! 🎉
                                    </h4>
                                    <p className="text-green-600 dark:text-green-500">
                                        The word was: <span className="font-bold">{currentPrompt.word}</span>
                                    </p>
                                    <p className="text-sm mt-2 text-gray-500">Next round starting in 3s...</p>
                                </>
                            ) : (
                                <>
                                    <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                                    <h4 className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-1">
                                        Time's Up!
                                    </h4>
                                    <p className="text-orange-600 dark:text-orange-500">
                                        The word was: <span className="font-bold">{currentPrompt.word}</span>
                                    </p>
                                    <p className="text-sm mt-2 text-gray-500">Next round starting in 3s...</p>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Waiting for partner */}
            {!partnerInSession && (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                    Waiting for partner to join the game...
                </div>
            )}
        </div>
    );
}

