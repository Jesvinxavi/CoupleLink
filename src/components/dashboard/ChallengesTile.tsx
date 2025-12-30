
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { type ChallengeStatus } from '../../hooks/useChallenges';
import { useStreak } from '../../hooks/useStreak';
import { ChallengeModal } from './ChallengeModal';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

type ChallengeFrequency = 'daily' | 'weekly' | 'monthly';

interface ChallengesTileProps {
    daily: any; weekly: any; monthly: any;
    dailyTimeLeft: string; weeklyTimeLeft: string; monthlyTimeLeft: string;
    dailyTimeUrgent: boolean; weeklyTimeUrgent: boolean; monthlyTimeUrgent: boolean;
    dailyStatus: ChallengeStatus; weeklyStatus: ChallengeStatus; monthlyStatus: ChallengeStatus;
    completeChallenge: any; undoChallenge: any; skipChallenge: any;
    loadingPartner: boolean; winnerAgreement: any;
    myDailyMemory: any; myWeeklyMemory: any; myMonthlyMemory: any;
    partnerDailyMemory: any; partnerWeeklyMemory: any; partnerMonthlyMemory: any;
    markChallengeConfettiSeen: any;
    couple: any;
    userProfile: any;
    /**
     * When true, the internal grid will run its "hidden -> show" stagger animation.
     * When false, the grid will stay in "hidden" state (useful when the page is still behind a spinner).
     */
    animateIn?: boolean;
}

function ChallengeFrequencyCard({
    type,
    title,
    challenge,
    timeLeft,
    isUrgent,
    status,
    myMemory,
    partnerMemory,
    agreement,
    onOpen
}: {
    type: ChallengeFrequency;
    title: string;
    challenge: any;
    timeLeft: string;
    isUrgent: boolean;
    status: ChallengeStatus;
    myMemory: any;
    partnerMemory: any;
    agreement: 'agreed' | 'disagreed' | 'pending' | 'none';
    onOpen: (t: ChallengeFrequency) => void;
}) {
    const isPlaceholder = !challenge;

    // Status-based rendering logic
    const isDisagreed = !isPlaceholder && status === 'pending_agreement' && agreement === 'disagreed';
    const isPendingAgreement = !isPlaceholder && status === 'pending_agreement' && agreement === 'pending';
    const isSkipped = !isPlaceholder && status === 'skipped';
    const isCompleted = !isPlaceholder && status === 'completed';
    const isWaiting = !isPlaceholder && status === 'waiting_for_partner';

    // Determine specific skip message
    let skipText = '';
    if (isSkipped) {
        if (myMemory?.metadata?.skipped) skipText = 'Skipped by You';
        else if (partnerMemory?.metadata?.skipped) skipText = 'Skipped by Partner';
        else skipText = 'Skipped'; // Fallback
    }

    const baseClassName =
        "flex flex-col p-4 rounded-xl transition-all duration-200 border relative overflow-hidden h-[8.75rem]";
    const stateClassName = isPlaceholder
        ? "bg-gray-50 border-gray-200 cursor-default"
        : `cursor-pointer ${isDisagreed
            ? "bg-red-50 border-red-200 hover:bg-red-100"
            : isPendingAgreement
                ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                : isCompleted
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : isSkipped
                        ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        : isWaiting
                            ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
        }`;

    return (
        <motion.div
            variants={item}
            // Prevent a late-mount from briefly painting "visible" before Framer applies initial styles.
            // Still animates normally when parent transitions hidden -> show.
            initial={false}
            onClick={() => {
                if (isPlaceholder) return;
                onOpen(type);
            }}
            className={`${baseClassName} ${stateClassName}`}
        >
            {isPlaceholder ? (
                <div className="flex flex-col h-full items-center justify-center text-center">
                    <span className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">{title}</span>
                    <p className="text-xs text-gray-400">Loading...</p>
                </div>
            ) : (
                <>
                    {/* Header & Timer */}
                    <div className="flex flex-col mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                            {title}
                        </span>
                        {challenge?.isCompetition && !isCompleted && !isSkipped && !isDisagreed && (
                            <span className="absolute top-4 right-4 text-lg" title="Competitive Challenge">🏆</span>
                        )}
                        {!isCompleted && !isSkipped && !isDisagreed && !isPendingAgreement && (
                            <span className={`text-xs font-medium ${isUrgent ? 'text-[#EA2831]' : 'text-heading-dark'}`}>
                                {timeLeft}
                            </span>
                        )}
                    </div>

                    {/* Content */}
                    {isDisagreed ? (
                        <div className="flex flex-col items-center justify-center py-2 h-full text-center">
                            <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-700 text-lg">warning</span>
                            </div>
                            <span className="text-xs font-medium text-red-700">Disagreement! Tap to resolve.</span>
                        </div>
                    ) : isPendingAgreement ? (
                        <div className="flex flex-col items-center justify-center py-2 h-full text-center">
                            <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center mb-1">
                                <span className="material-symbols-outlined text-blue-700 text-lg">handshake</span>
                            </div>
                            <span className="text-xs font-medium text-blue-700">Confirm Winner</span>
                        </div>
                    ) : isCompleted ? (
                        <div className="flex flex-col items-center justify-center py-2 h-full text-center">
                            <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-700 text-lg">check</span>
                            </div>
                            <span className="text-xs font-medium text-green-700">Completed</span>
                        </div>
                    ) : isSkipped ? (
                        <div className="flex flex-col items-center justify-center py-2 h-full text-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-600 text-lg">remove_done</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{skipText}</span>
                        </div>
                    ) : isWaiting ? (
                        <div className="flex flex-col h-full justify-center items-center text-center">
                            <span className="material-symbols-outlined text-amber-500 text-2xl">hourglass_empty</span>
                            <p className="text-xs font-medium text-amber-700">Waiting for partner...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-heading-dark line-clamp-1">
                                    {challenge.title}
                                </h3>
                                <p className="text-xs text-body-soft line-clamp-2">
                                    {challenge.description}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div >
    );
}

export function ChallengesTile({
    daily, weekly, monthly,
    dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft,
    dailyTimeUrgent, weeklyTimeUrgent, monthlyTimeUrgent,
    dailyStatus, weeklyStatus, monthlyStatus,
    completeChallenge, undoChallenge, skipChallenge, loadingPartner, winnerAgreement,
    myDailyMemory, myWeeklyMemory, myMonthlyMemory,
    partnerDailyMemory, partnerWeeklyMemory, partnerMonthlyMemory,
    markChallengeConfettiSeen,
    couple,
    userProfile,
    animateIn = true
}: ChallengesTileProps) {

    // Animation driver:
    // Using AnimationControls lets us keep the grid in the initial "hidden" state without
    // triggering an explicit animate="hidden" pass (which can race with the later "show"
    // on slower mobile devices and look like a flash).
    const controls = useAnimation();

    useEffect(() => {
        // Always ensure we're in the hidden state until we explicitly animate in.
        if (!animateIn) {
            controls.set("hidden");
            return;
        }

        let cancelled = false;
        const raf = requestAnimationFrame(() => {
            if (cancelled) return;
            controls.start("show");
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            controls.stop();
        };
    }, [controls, animateIn]);





    const { addPoints, checkStreakUpdate } = useStreak({ enableTokenCheck: false });

    // Confetti Trigger for Partner Completion (Realtime)
    const prevDailyBoth = useRef(false);
    const prevWeeklyBoth = useRef(false);
    const prevMonthlyBoth = useRef(false);

    useEffect(() => {
        if (loadingPartner) return;

        const dailyBoth = dailyStatus === 'completed';
        const weeklyBoth = weeklyStatus === 'completed';
        const monthlyBoth = monthlyStatus === 'completed';

        const checkAndTriggerConfetti = (
            isBoth: boolean,
            prevBoth: boolean,
            type: string
        ) => {
            if (isBoth && !prevBoth) {
                // Check persistent history
                const stats = (couple?.challenge_stats as any) || {};
                const celebrated = stats.celebrated_history || {};
                const id = type === 'daily' ? daily?.id : type === 'weekly' ? weekly?.id : monthly?.id;

                if (!id || !userProfile?.id) return;

                const alreadyCelebrated = Boolean(celebrated[id]?.includes(userProfile.id));
                if (!alreadyCelebrated) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#FF69B4', '#FFD700', '#00BFFF', '#32CD32'] });
                    markChallengeConfettiSeen(id);
                }

            }
        };

        checkAndTriggerConfetti(dailyBoth, prevDailyBoth.current, 'daily');
        checkAndTriggerConfetti(weeklyBoth, prevWeeklyBoth.current, 'weekly');
        checkAndTriggerConfetti(monthlyBoth, prevMonthlyBoth.current, 'monthly');

        prevDailyBoth.current = dailyBoth;
        prevWeeklyBoth.current = weeklyBoth;
        prevMonthlyBoth.current = monthlyBoth;
    }, [dailyStatus, weeklyStatus, monthlyStatus, loadingPartner, myDailyMemory, myWeeklyMemory, myMonthlyMemory]);

    const [selectedChallenge, setSelectedChallenge] = useState<{ type: 'daily' | 'weekly' | 'monthly', data: any } | null>(null);

    const handleOpen = (type: ChallengeFrequency) => {
        if (type === 'daily') setSelectedChallenge({ type, data: daily });
        else if (type === 'weekly') setSelectedChallenge({ type, data: weekly });
        else setSelectedChallenge({ type, data: monthly });
    };

    const handleClose = () => {
        setSelectedChallenge(null);
    };

    const handleComplete = async (file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => {
        if (selectedChallenge) {

            await completeChallenge(selectedChallenge.type, file, winnerSelection);

            // Points logic
            const partnerMem = selectedChallenge.type === 'daily' ? partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? partnerWeeklyMemory : partnerMonthlyMemory;

            if (partnerMem) {
                // Check for agreement
                let isAgreed = true;
                if (selectedChallenge.data.isCompetition) {
                    const partnerSelection = partnerMem.metadata?.winner_selection;
                    if (!winnerSelection || !partnerSelection) isAgreed = false;
                    else if (winnerSelection === 'tie' && partnerSelection !== 'tie') isAgreed = false;
                    else if (winnerSelection === 'me' && partnerSelection !== 'partner') isAgreed = false;
                    else if (winnerSelection === 'partner' && partnerSelection !== 'me') isAgreed = false;
                }

                if (isAgreed) {
                    if (selectedChallenge.type === 'daily') await addPoints(1);
                    else if (selectedChallenge.type === 'weekly') await addPoints(3);
                    else if (selectedChallenge.type === 'monthly') await addPoints(5);

                    await checkStreakUpdate();
                }
            } else {
                // If partner hasn't completed, we can update streak if it's NOT a competition (or handled elsewhere)
                // But for now, let's keep it simple: only update streak if both done OR non-competitive might be different.
                // Actually, streak usually updates on YOUR completion. But for competitive, maybe wait?
                // Let's stick to: Update streak only if AGREED or NOT COMPETITIVE.
                if (!selectedChallenge.data.isCompetition) {
                    await checkStreakUpdate();
                }
            }
        }
    };

    const handleUndo = async () => {
        if (selectedChallenge) {
            const partnerMem = selectedChallenge.type === 'daily' ? partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? partnerWeeklyMemory : partnerMonthlyMemory;

            if (partnerMem) {
                if (selectedChallenge.type === 'daily') await addPoints(-1);
                else if (selectedChallenge.type === 'weekly') await addPoints(-3);
                else if (selectedChallenge.type === 'monthly') await addPoints(-5);
            }

            undoChallenge(selectedChallenge.type);
        }
    };

    const handleSkip = async () => {
        if (selectedChallenge) {
            await skipChallenge(selectedChallenge.type);
            await checkStreakUpdate();
        }
    };

    return (
        <>
            <motion.div
                variants={container}
                initial="hidden"
                animate={controls}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
            >
                <ChallengeFrequencyCard
                    type="daily"
                    title="Daily"
                    challenge={daily}
                    timeLeft={dailyTimeLeft}
                    isUrgent={dailyTimeUrgent}
                    status={dailyStatus}
                    myMemory={myDailyMemory}
                    partnerMemory={partnerDailyMemory}
                    agreement={winnerAgreement.daily}
                    onOpen={handleOpen}
                />
                <ChallengeFrequencyCard
                    type="weekly"
                    title="Weekly"
                    challenge={weekly}
                    timeLeft={weeklyTimeLeft}
                    isUrgent={weeklyTimeUrgent}
                    status={weeklyStatus}
                    myMemory={myWeeklyMemory}
                    partnerMemory={partnerWeeklyMemory}
                    agreement={winnerAgreement.weekly}
                    onOpen={handleOpen}
                />
                <ChallengeFrequencyCard
                    type="monthly"
                    title="Monthly"
                    challenge={monthly}
                    timeLeft={monthlyTimeLeft}
                    isUrgent={monthlyTimeUrgent}
                    status={monthlyStatus}
                    myMemory={myMonthlyMemory}
                    partnerMemory={partnerMonthlyMemory}
                    agreement={winnerAgreement.monthly}
                    onOpen={handleOpen}
                />
            </motion.div>

            {selectedChallenge && (
                <ChallengeModal
                    isOpen={!!selectedChallenge}
                    onClose={handleClose}
                    challenge={selectedChallenge.data}
                    timeLeft={
                        selectedChallenge.type === 'daily' ? dailyTimeLeft :
                            selectedChallenge.type === 'weekly' ? weeklyTimeLeft : monthlyTimeLeft
                    }
                    isUrgent={
                        selectedChallenge.type === 'daily' ? dailyTimeUrgent :
                            selectedChallenge.type === 'weekly' ? weeklyTimeUrgent : monthlyTimeUrgent
                    }
                    isCompleted={
                        selectedChallenge.type === 'daily' ? !!myDailyMemory :
                            selectedChallenge.type === 'weekly' ? !!myWeeklyMemory : !!myMonthlyMemory
                    }
                    isPartnerCompleted={
                        selectedChallenge.type === 'daily' ? !!partnerDailyMemory :
                            selectedChallenge.type === 'weekly' ? !!partnerWeeklyMemory : !!partnerMonthlyMemory
                    }
                    onComplete={handleComplete}
                    onUndo={handleUndo}
                    onSkip={handleSkip}
                    rainCheckTokens={couple?.rain_check_tokens || 0}
                    type={selectedChallenge.type}
                    winnerAgreement={winnerAgreement[selectedChallenge.type]}
                    isSkipped={
                        selectedChallenge.type === 'daily' ? dailyStatus === 'skipped' :
                            selectedChallenge.type === 'weekly' ? weeklyStatus === 'skipped' : monthlyStatus === 'skipped'
                    }
                    initialSelection={
                        selectedChallenge.type === 'daily' ? myDailyMemory?.metadata?.winner_selection :
                            selectedChallenge.type === 'weekly' ? myWeeklyMemory?.metadata?.winner_selection : myMonthlyMemory?.metadata?.winner_selection
                    }
                />
            )}
        </>
    );
}
