// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Check, Clock, Trophy } from "lucide-react"
import { useGameSession, type GameSession } from "@/hooks/useGameSession"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import { wouldYouRatherQuestions } from "@/data/gameQuestions"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface WouldYouRatherGameProps {
    session: GameSession
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function WouldYouRatherGame({ session }: WouldYouRatherGameProps) {
    const { updateGameState, nextRound, isPlayerOne } = useGameSession()
    const { partner, currentUser } = useCoupleData()


    const [gameComplete, setGameComplete] = useState(false)


    // Determine player IDs from session
    const myId = currentUser?.id
    const partnerId = session.player_one_id === myId ? session.player_two_id : session.player_one_id

    // Get current question ID from session state
    const questionIds = session.game_state?.question_ids || []
    const currentQuestionId = questionIds[session.current_round - 1]

    // Find the question object
    const currentQuestion = useMemo(() => {
        if (!currentQuestionId) return null
        return wouldYouRatherQuestions.find((q) => q.id === currentQuestionId)
    }, [currentQuestionId])


    const gameState = session.game_state || {}
    const roundAnswers = gameState.round_answers || {}
    const allAnswers = gameState.all_answers || []

    const myAnswer = roundAnswers[myId || ""]
    const partnerAnswer = roundAnswers[partnerId || ""]
    const bothAnswered = myAnswer !== undefined && partnerAnswer !== undefined

    const [isAdvancing, setIsAdvancing] = useState(false)

    // Auto-advance when both answered
    useEffect(() => {
        if (bothAnswered && !gameComplete && isPlayerOne && !isAdvancing) {
            const timer = setTimeout(() => {
                handleNextRound()
            }, 1500) // 1.5s delay before moving to next round
            return () => clearTimeout(timer)
        }
    }, [bothAnswered, gameComplete, isPlayerOne, isAdvancing])

    // Check if game is complete
    useEffect(() => {
        if (session.current_round > session.total_rounds) {
            setGameComplete(true)
        }
    }, [session.current_round, session.total_rounds])

    const handleSelectOption = async (optionIndex: 0 | 1) => {
        if (myAnswer !== undefined || !myId) return

        await updateGameState({
            round_answers: {
                ...roundAnswers,
                [myId]: optionIndex
            }
        })
    }

    const handleNextRound = async () => {
        if (isAdvancing) return
        setIsAdvancing(true)

        try {
            // Fetch latest game state to ensure we don't lose history and have exact answers
            const { data } = await supabase
                .from("game_sessions")
                .select("game_state")
                .eq("id", session.id)
                .single()

            const latestGameState = data?.game_state as any || {}
            const currentAllAnswers = latestGameState.all_answers || []
            const latestRoundAnswers = latestGameState.round_answers || {}



            // Derive answers from the DB state, not local props (to be 100% safe)
            const dbMyAnswer = latestRoundAnswers[myId || ""]
            const dbPartnerAnswer = latestRoundAnswers[partnerId || ""]

            const isMatch = dbMyAnswer === dbPartnerAnswer && dbMyAnswer !== undefined

            const roundResult = {
                round: session.current_round,
                question: currentQuestion?.question,
                // Store explicit answers by ID to prevent "You/Partner" swap issues
                answers: {
                    [myId || ""]: dbMyAnswer,
                    [partnerId || ""]: dbPartnerAnswer
                },
                // Keep these for backward compatibility
                myAnswer: dbMyAnswer,
                partnerAnswer: dbPartnerAnswer,
                matched: isMatch
            };

            const newAllAnswers = [...currentAllAnswers, roundResult]

            if (session.current_round >= session.total_rounds) {
                await updateGameState({
                    round_answers: {},
                    all_answers: newAllAnswers
                })
                await nextRound() // Push to total+1 so partner sees game over
                setGameComplete(true)
            } else {
                await updateGameState({
                    round_answers: {},
                    all_answers: newAllAnswers
                })
                await nextRound()
            }
        } finally {
            setIsAdvancing(false)
        }
    }


    // Calculate results
    const matchCount = allAnswers.filter((a: any) => a.matched).length
    const matchPercentage = allAnswers.length > 0 ? Math.round((matchCount / allAnswers.length) * 100) : 0

    // Game Complete Results Screen
    if (gameComplete || !currentQuestion) {
        return (
            <div className="text-center py-2">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                >
                    <Trophy className="w-20 h-20 text-rose-500 mx-auto mb-4" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Game Complete! 🎉
                </h3>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 my-6">
                    <p className="text-4xl font-bold text-rose-500 mb-2">{matchPercentage}%</p>
                    <p className="text-gray-600 dark:text-gray-400">Match Rate</p>
                    <p className="text-sm text-gray-500 mt-2">
                        You matched on {matchCount} out of {allAnswers.length} questions
                    </p>
                </div>

                {/* Answer History */}
                <div className="text-left -mb-4">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Answers:</h4>
                    <div className="max-h-[16.25rem] overflow-y-auto pr-1">
                        <div className="space-y-2">
                            {allAnswers.map((answer: any, idx: number) => (
                                <div
                                    key={idx}
                                className={`p-3 rounded-lg text-sm ${answer.matched
                                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                                        : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                                        }`}
                                >
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        Q{answer.round}: {answer.question?.substring(0, 50)}...
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {answer.matched ? "✅ Both chose the same!" : `❌ Different choices`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Question {Math.min(session.current_round, session.total_rounds)} of {session.total_rounds}</span>
                <span>{matchCount} matches so far</span>
            </div>

            {/* Question Card */}
            <motion.div
                key={session.current_round}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6"
            >
                <div className="flex items-center gap-2 text-rose-500 text-sm font-medium mb-3">
                    <Heart className="w-4 h-4" />
                    Would You Rather
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

            {/* Options */}
            <div className="space-y-4 mb-8">
                {currentQuestion.options?.map((option, index) => {
                    const optionIndex = index as 0 | 1;
                    const isSelected = myAnswer === optionIndex;
                    const isLocked = myAnswer !== undefined;

                    return (
                        <motion.button
                            key={index}
                            whileHover={!isLocked ? { scale: 1.02 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}
                            onClick={() => handleSelectOption(optionIndex)}
                            disabled={isLocked}
                            className={`w-full p-5 rounded-xl text-left transition-all relative overflow-hidden ${isSelected
                                ? 'bg-rose-500 text-white border-2 border-rose-500'
                                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 md:hover:border-rose-300 active:bg-gray-50 dark:active:bg-gray-700/50'
                                } ${isLocked && !isSelected ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-lg">{option}</span>
                                {isSelected && (
                                    <div className="flex items-center gap-1 text-sm">
                                        <Check className="w-5 h-5" />
                                        You
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Waiting Status */}
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

        </div>
    );
}
