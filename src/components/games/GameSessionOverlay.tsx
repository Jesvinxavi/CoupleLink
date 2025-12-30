import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

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
    session: GameSession | null;
    onFocusChange?: (isFocused: boolean) => void;
}

export function GameSessionOverlay({ isOpen, onClose, session, onFocusChange }: GameSessionOverlayProps) {
    const { leaveSession, endSession, getGameLabel, partnerInSession, joinOrStartSession } = useGameSession();
    const { partner } = useCoupleData();

    // Track when we're starting a new game to prevent flash of complete screen
    const [isStartingNewGame, setIsStartingNewGame] = useState(false);

    // Mobile Overlay Logic
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    // Generic Focus Handler (Measure-Lock-Animate)


    const handleOverlayFocus = (e: React.FocusEvent) => {
        // Filter out non-text inputs (like buttons in other games) which shouldn't trigger keyboard mode
        const target = e.target as HTMLElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        if (!isTextInput) return;

        // If already focused, just ensure viewport style is tracking
        if (isFocused) return;

        if (overlayRef.current && window.visualViewport) {
            // 1. Measure current 'sheet' position
            const rect = overlayRef.current.getBoundingClientRect();

            // 2. Lock it immediately
            setViewportStyle({
                height: rect.height,
                top: rect.top
            });

            // 3. Set focused state
            setIsFocused(true);
            if (onFocusChange) onFocusChange(true);

            // 4. Animate to target visual viewport in next frame
            requestAnimationFrame(() => {
                if (window.visualViewport) {
                    setViewportStyle({
                        height: window.visualViewport.height,
                        top: window.visualViewport.offsetTop
                    });
                }
            });
        }
    };

    const handleOverlayBlur = (e: React.FocusEvent) => {
        // Only blur if focus is leaving the overlay entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsFocused(false);
            if (onFocusChange) onFocusChange(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Robust Body Lock
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            // Handle Visual Viewport for mobile keyboard
            const handleResize = () => {
                if (window.visualViewport && isFocused) {
                    setViewportStyle({
                        height: window.visualViewport.height,
                        top: window.visualViewport.offsetTop
                    });
                }
            };

            window.visualViewport?.addEventListener('resize', handleResize);
            window.visualViewport?.addEventListener('scroll', handleResize);

            return () => {
                const scrollY = document.body.style.top;
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Restore scroll position
                window.scrollTo(0, parseInt(scrollY || '0') * -1);

                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }
    }, [isOpen, isFocused]);

    // Reset focus state when round changes (e.g. going from guessing to drawing) to prevents sticky header
    useEffect(() => {
        setIsFocused(false);
        if (onFocusChange) onFocusChange(false);
    }, [session?.current_round]);

    // Check if game is complete (current_round > total_rounds)
    const isGameComplete = session && session.current_round > session.total_rounds && !isStartingNewGame;

    const handleLeave = async () => {
        await leaveSession();
        onClose();
    };

    const handlePlayAgain = async () => {
        if (!session) return;
        setIsStartingNewGame(true);
        await endSession();
        // joinOrStartSession will create a new waiting session
        await joinOrStartSession(session.game_type);
        setIsStartingNewGame(false);
    };

    const renderGame = () => {
        if (!session) return null;
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

    return createPortal(
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={handleLeave}
                style={{ touchAction: 'none' }}
                onTouchMove={(e) => e.preventDefault()}
            />

            {/* Slide-up Panel */}
            <motion.div

                ref={overlayRef}
                initial={{ y: '100%' }}
                animate={{
                    y: 0,
                    height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                    top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 40, stiffness: 300 }}
                onFocus={handleOverlayFocus}
                onBlur={handleOverlayBlur}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col outline-none"
                style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                onTouchMove={(e) => e.preventDefault()}
            >
                {/* The Skirt - synced background extension matching footer (or sticky input) */}
                <div
                    className={`absolute top-full inset-x-0 h-[100vh] ${isFocused ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                    style={{ touchAction: 'none' }}
                    onTouchMove={(e) => e.preventDefault()}
                />

                {/* Inner Content Container */}
                <div
                    className={`flex flex-col w-full bg-white dark:bg-gray-900 ${isFocused ? 'h-full' : ''}`}
                    style={{
                        maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                    }}
                >
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${session ? getGameColor(session.game_type) : 'from-gray-500 to-gray-600'} px-6 py-3`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {session ? getGameLabel(session.game_type) : 'Preparing Game...'}
                                </h2>
                                <div className="flex items-center gap-4 mt-1 text-white/80 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {!session ? 'Starting session...' : partnerInSession ? `Playing with ${partner?.first_name || 'Partner'}` : 'Waiting for partner...'}
                                    </span>
                                    {session && (
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-4 h-4" />
                                            <span className="text-sm text-white/90">Round {Math.min(session.current_round, session.total_rounds)} of {session.total_rounds}</span>
                                        </span>
                                    )}
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
                    <div
                        className="flex-1 overflow-y-auto p-4 flex flex-col"
                        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        {!session ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 animate-pulse">
                                    Setting up your game session...
                                </p>
                            </div>
                        ) : isStartingNewGame || (!partnerInSession && session.status === 'waiting') ? (
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
                </div>
            </motion.div>
        </>,
        document.body
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

