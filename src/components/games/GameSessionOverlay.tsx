import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import type { GameSession } from '../../hooks/useGameSession';
import { useGameSession } from '../../hooks/useGameSession';
import { useCoupleData } from '../../hooks/useCoupleData';
import { WouldYouRatherGame } from './WouldYouRatherGame';
import { NeverHaveIEverGame } from './NeverHaveIEverGame';
import { RapidFireGame } from './RapidFireGame';
import { DrawAndGuessGame } from './DrawAndGuessGame';
import type { GameType } from '../../data/gameQuestions';

interface GameSessionOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    session: GameSession;
}

export function GameSessionOverlay({ isOpen, onClose, session }: GameSessionOverlayProps) {
    const { leaveSession, endSession, getGameLabel, partnerInSession, joinOrStartSession } = useGameSession();
    const { partner } = useCoupleData();

    // Track when we're starting a new game to prevent flash of complete screen
    const [isStartingNewGame, setIsStartingNewGame] = useState(false);

    // Check if game is complete (current_round > total_rounds)
    const isGameComplete = session.current_round > session.total_rounds && !isStartingNewGame;

    const handleLeave = async () => {
        await leaveSession();
        onClose();
    };

    const handlePlayAgain = async () => {
        setIsStartingNewGame(true);
        await endSession();
        // joinOrStartSession will create a new waiting session
        await joinOrStartSession(session.game_type);
        setIsStartingNewGame(false);
    };

    const renderGame = () => {
        switch (session.game_type) {
            case 'would_you_rather':
                return <WouldYouRatherGame session={session} />;
            case 'never_have_i_ever':
                return <NeverHaveIEverGame session={session} />;
            case 'rapid_fire':
                return <RapidFireGame session={session} />;
            case 'draw_and_guess':
                return <DrawAndGuessGame session={session} />;
            default:
                return <div>Unknown game type</div>;
        }
    };

    const getGameColor = (gameType: GameType): string => {
        switch (gameType) {
            case 'draw_and_guess': return 'from-purple-500 to-purple-600';
            case 'would_you_rather': return 'from-rose-500 to-rose-600';
            case 'never_have_i_ever': return 'from-blue-500 to-blue-600';
            case 'rapid_fire': return 'from-amber-500 to-amber-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={handleLeave}
                    />

                    {/* Slide-up Panel */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[calc(100vh-4rem)] md:max-h-[95vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className={`bg-gradient-to-r ${getGameColor(session.game_type)} px-6 py-3`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {getGameLabel(session.game_type)}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-1 text-white/80 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {partnerInSession ? `Playing with ${partner?.first_name || 'Partner'}` : 'Waiting for partner...'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            <span className="text-sm text-white/90">Round {Math.min(session.current_round, session.total_rounds)} of {session.total_rounds}</span>
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLeave}
                                    className="text-white hover:bg-white/20 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Game Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isStartingNewGame || (!partnerInSession && session.status === 'waiting') ? (
                                <WaitingForPartner
                                    gameLabel={getGameLabel(session.game_type)}
                                    partnerName={partner?.first_name || 'Partner'}
                                />
                            ) : (
                                renderGame()
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                            {isGameComplete ? (
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleLeave}
                                        className="flex-1"
                                    >
                                        Leave Game
                                    </Button>
                                    <Button
                                        onClick={handlePlayAgain}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                                    >
                                        Play Again
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handleLeave}
                                    className="w-full"
                                >
                                    Leave Game
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Waiting state component
function WaitingForPartner({ gameLabel, partnerName }: { gameLabel: string; partnerName: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Users className="w-10 h-10 text-rose-500" />
                </div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                    <Clock className="w-3 h-3 text-white" />
                </motion.div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Waiting for {partnerName}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                You've started a game of <span className="font-medium text-rose-500">{gameLabel}</span>.
                When {partnerName} opens the Games Hub, they'll see an invite to join you!
            </p>

            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mt-8 flex items-center gap-2 text-sm text-gray-400"
            >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Game session active
            </motion.div>
        </div>
    );
}

// Join Session Banner (shown on Games Hub when partner has a session)
interface JoinSessionBannerProps {
    session: GameSession;
    partnerName: string;
    onJoin: () => void;
}

export function JoinSessionBanner({ session, partnerName, onJoin }: JoinSessionBannerProps) {
    const { getGameLabel } = useGameSession();

    const getGameColor = (gameType: GameType): string => {
        switch (gameType) {
            case 'draw_and_guess': return 'from-purple-500 to-purple-600';
            case 'would_you_rather': return 'from-rose-500 to-rose-600';
            case 'never_have_i_ever': return 'from-blue-500 to-blue-600';
            case 'rapid_fire': return 'from-amber-500 to-amber-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50"
        >
            <div className={`bg-gradient-to-r ${getGameColor(session.game_type)} rounded-2xl p-4 shadow-2xl`}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Users className="w-7 h-7 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white/80 text-sm">
                            {partnerName} is waiting for you!
                        </p>
                        <p className="text-white font-bold text-lg md:text-base">
                            {getGameLabel(session.game_type)}
                        </p>
                    </div>
                    <Button
                        onClick={onJoin}
                        className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-3 md:py-2 h-auto"
                    >
                        Join
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

