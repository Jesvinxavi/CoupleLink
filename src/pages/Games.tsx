import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Palette, HelpCircle, MessageCircle, Zap, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameSession } from "../hooks/useGameSession";
import { useCoupleData } from "../hooks/useCoupleData";
import { GameSessionOverlay, JoinSessionBanner } from "../components/games/GameSessionOverlay";
import type { GameType } from "../data/gameQuestions";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function GamesPage() {
    const {
        activeSession,
        isLoading,
        createSession,
        joinSession,
        isInSession,
        partnerInSession,
        getGameLabel
    } = useGameSession();
    const { partner, currentUser } = useCoupleData();

    const [showGameOverlay, setShowGameOverlay] = useState(false);

    // Show overlay if user is in an active session
    useEffect(() => {
        console.log('[GamesPage] activeSession change:', {
            id: activeSession?.id,
            status: activeSession?.status,
            isInSession,
            showGameOverlay
        });
        if (activeSession && isInSession) {
            console.log('[GamesPage] Opening overlay (active & in session)');
            setShowGameOverlay(true);
        } else {
            // Close if no session OR not in session (e.g. partner created new one, we need to join)
            console.log('[GamesPage] Closing overlay (no active session or not in session)');
            setShowGameOverlay(false);
        }
    }, [activeSession, isInSession]);

    // Auto-open overlay when partner joins (for user 1)
    useEffect(() => {
        if (activeSession && isInSession && partnerInSession && !showGameOverlay) {
            setShowGameOverlay(true);
        }
    }, [activeSession, isInSession, partnerInSession, showGameOverlay]);

    // Check if partner started a session we can join
    const canJoinPartnerSession = activeSession &&
        !isInSession &&
        activeSession.status === 'waiting' &&
        activeSession.player_one_id !== currentUser?.id;

    const handlePlayGame = async (gameType: GameType) => {
        const session = await createSession(gameType);
        if (session) {
            // Wait for DB trigger/realtime? Or just start?
            // createSession sets it active/waiting.
            console.log('Session created:', session);
            setShowGameOverlay(true); // Keep original functionality
        }
    };

    const handleJoinPartner = async () => {
        if (!activeSession) return;
        const success = await joinSession(activeSession.id);
        if (success) {
            setShowGameOverlay(true);
        }
    };

    const handleCloseOverlay = () => {
        setShowGameOverlay(false);
    };

    if (isLoading) {
        return (
            <>
                <Sidebar />
                <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen dark:bg-gray-900 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Sidebar />
            <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen dark:bg-gray-900 pb-24 relative overflow-hidden">
                <main className="p-4 md:p-8 pb-32">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="max-w-7xl mx-auto"
                    >
                        {/* Header */}
                        <motion.header variants={item} className="pt-4 md:pt-8 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Gamepad2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Games Hub</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Play together, even when apart</p>
                                </div>
                            </div>
                        </motion.header>

                        {/* Active Session Indicator */}
                        {activeSession && isInSession && (
                            <motion.div
                                variants={item}
                                className="mb-4"
                            >
                                <button
                                    onClick={() => setShowGameOverlay(true)}
                                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl p-4 flex items-center justify-between hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Gamepad2 className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">{getGameLabel(activeSession.game_type)}</p>
                                            <p className="text-sm text-white/80">
                                                {partnerInSession
                                                    ? `Playing with ${partner?.first_name}`
                                                    : `Waiting for ${partner?.first_name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Resume</span>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            →
                                        </motion.div>
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {/* Games Grid */}
                        <motion.div variants={item}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePlayGame('draw_and_guess')}
                                    className="cursor-pointer"
                                >
                                    <GameCardEnhanced
                                        title="Draw & Guess"
                                        description="One draws, the other guesses! Take turns being the artist."
                                        icon={<Palette className="w-10 h-10" />}
                                        color="from-purple-500 to-violet-600"
                                        players="2 players"
                                        time="~10 min"
                                    />
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePlayGame('would_you_rather')}
                                    className="cursor-pointer"
                                >
                                    <GameCardEnhanced
                                        title="Would You Rather?"
                                        description="Tough choices to spark deep conversations and discover each other."
                                        icon={<HelpCircle className="w-10 h-10" />}
                                        color="from-rose-500 to-pink-600"
                                        players="2 players"
                                        time="~15 min"
                                    />
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePlayGame('never_have_i_ever')}
                                    className="cursor-pointer"
                                >
                                    <GameCardEnhanced
                                        title="Never Have I Ever"
                                        description="Discover secrets and experiences you never knew about each other."
                                        icon={<MessageCircle className="w-10 h-10" />}
                                        color="from-blue-500 to-cyan-600"
                                        players="2 players"
                                        time="~15 min"
                                    />
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePlayGame('rapid_fire')}
                                    className="cursor-pointer"
                                >
                                    <GameCardEnhanced
                                        title="Rapid Fire"
                                        description="Fast-paced Yes/No questions. 10 seconds to answer!"
                                        icon={<Zap className="w-10 h-10" />}
                                        color="from-amber-500 to-orange-600"
                                        players="2 players"
                                        time="~5 min"
                                    />
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </main>
            </div>

            {/* Join Partner Banner */}
            <AnimatePresence>
                {canJoinPartnerSession && (
                    <JoinSessionBanner
                        session={activeSession}
                        partnerName={partner?.first_name || 'Partner'}
                        onJoin={handleJoinPartner}
                    />
                )}
            </AnimatePresence>

            {/* Game Session Overlay */}
            {activeSession && (
                <GameSessionOverlay
                    isOpen={showGameOverlay}
                    onClose={handleCloseOverlay}
                    session={activeSession}
                />
            )}
        </>
    );
}

// Enhanced Game Card Component
interface GameCardEnhancedProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    players: string;
    time: string;
}

function GameCardEnhanced({ title, description, icon, color, players, time }: GameCardEnhancedProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700">
            <div className={`h-24 bg-gradient-to-br ${color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white rounded-full" />
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white rounded-full" />
                </div>
                <div className="text-white relative z-10">
                    {icon}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {description}
                </p>
                <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {players}
                    </span>
                    <span className="text-gray-400">
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
}
