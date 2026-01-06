import { createContext, useContext, useState, type ReactNode } from 'react';
import { ChallengeOverlay } from '../components/dashboard/ChallengeOverlay';
import { useChallenges } from '../hooks/useChallenges';
import { useChallengePoints } from '../hooks/useChallengePoints';
import { useCoupleData } from '../hooks/useCoupleData';

interface ChallengeModalContextType {
    openDaily: () => void;
    openWeekly: () => void;
    openMonthly: () => void;
}

const ChallengeModalContext = createContext<ChallengeModalContextType | null>(null);

export function useChallengeModals() {
    const context = useContext(ChallengeModalContext);
    if (!context) {
        throw new Error('useChallengeModals must be used within ChallengeModalProvider');
    }
    return context;
}

interface ChallengeModalProviderProps {
    children: ReactNode;
}

export function ChallengeModalProvider({ children }: ChallengeModalProviderProps) {
    const { couple } = useCoupleData();

    // Modal states
    const [selectedChallenge, setSelectedChallenge] = useState<{ type: 'daily' | 'weekly' | 'monthly' } | null>(null);

    // Get challenge data
    const challenges = useChallenges();
    const { awardChallengePoints, deductChallengePointsLegacy, checkStreakUpdate } = useChallengePoints();

    // Open modal directly (no navigation)
    const openDaily = () => setSelectedChallenge({ type: 'daily' });
    const openWeekly = () => setSelectedChallenge({ type: 'weekly' });
    const openMonthly = () => setSelectedChallenge({ type: 'monthly' });

    const handleClose = () => setSelectedChallenge(null);

    const handleComplete = async (file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => {
        if (selectedChallenge) {
            await challenges.completeChallenge(selectedChallenge.type, file, winnerSelection);

            // Use shared hook for points logic
            const partnerMem = selectedChallenge.type === 'daily' ? challenges.partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

            const challenge = selectedChallenge.type === 'daily' ? challenges.daily :
                selectedChallenge.type === 'weekly' ? challenges.weekly : challenges.monthly;

            await awardChallengePoints(
                selectedChallenge.type,
                challenge,
                partnerMem,
                winnerSelection
            );
        }
    };

    const handleUndo = async () => {
        if (selectedChallenge) {
            // Use shared hook for undo logic (legacy version checks partner memory)
            const partnerMem = selectedChallenge.type === 'daily' ? challenges.partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

            await deductChallengePointsLegacy(selectedChallenge.type, partnerMem);
            challenges.undoChallenge(selectedChallenge.type);
        }
    };

    const handleSkip = async () => {
        if (selectedChallenge) {
            await challenges.skipChallenge(selectedChallenge.type);
            await checkStreakUpdate();
        }
    };

    // Get challenge data based on selected type
    const getChallengeData = () => {
        if (!selectedChallenge) return null;

        const type = selectedChallenge.type;

        // Check for All Explored State
        const isAllExplored = challenges.poolStatus?.[type]?.allShown && !challenges[type];

        const challenge = type === 'daily' ? challenges.daily :
            type === 'weekly' ? challenges.weekly : challenges.monthly;

        // Allow opening if challenge exists OR if it's "All Explored"
        if (!challenge && !isAllExplored) return null;

        const timeLeft = type === 'daily' ? challenges.dailyTimeLeft :
            type === 'weekly' ? challenges.weeklyTimeLeft : challenges.monthlyTimeLeft;

        const isUrgent = type === 'daily' ? challenges.dailyTimeUrgent :
            type === 'weekly' ? challenges.weeklyTimeUrgent : challenges.monthlyTimeUrgent;

        const status = type === 'daily' ? challenges.dailyStatus :
            type === 'weekly' ? challenges.weeklyStatus : challenges.monthlyStatus;

        const myMemory = type === 'daily' ? challenges.myDailyMemory :
            type === 'weekly' ? challenges.myWeeklyMemory : challenges.myMonthlyMemory;

        const partnerMemory = type === 'daily' ? challenges.partnerDailyMemory :
            type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

        const winnerAgreement = challenges.winnerAgreement[type];

        const isSkipped = status === 'skipped';

        const initialSelection = myMemory?.metadata?.winner_selection;

        return {
            challenge,
            timeLeft,
            isUrgent,
            isCompleted: !!myMemory,
            isPartnerCompleted: !!partnerMemory,
            winnerAgreement,
            isSkipped,
            initialSelection,
            isAllExplored
        };
    };

    const challengeData = getChallengeData();

    return (
        <ChallengeModalContext.Provider value={{ openDaily, openWeekly, openMonthly }}>
            {children}

            {/* Global Modal - persists across page navigation */}
            {selectedChallenge && challengeData && (
                <ChallengeOverlay
                    isOpen={!!selectedChallenge}
                    onClose={handleClose}
                    challenge={challengeData.challenge}
                    timeLeft={challengeData.timeLeft}
                    isUrgent={challengeData.isUrgent}
                    isCompleted={challengeData.isCompleted}
                    isPartnerCompleted={challengeData.isPartnerCompleted}
                    onComplete={handleComplete}
                    onUndo={handleUndo}
                    onSkip={handleSkip}
                    rainCheckTokens={couple?.rain_check_tokens || 0}
                    type={selectedChallenge.type}
                    winnerAgreement={challengeData.winnerAgreement}
                    isSkipped={challengeData.isSkipped}
                    initialSelection={challengeData.initialSelection}

                    // All Explored Props
                    isAllExplored={challengeData.isAllExplored}
                    onReset={() => {
                        challenges.resetCycle(selectedChallenge.type);
                        handleClose(); // Optional: close after reset or keep open to see new challenge? 
                        // Usually better to keep open or re-open, but reset refreshes data.
                        // Let's just trigger reset. The Overlay usually closes or shows new data.
                        // Actually, logic in ChallengeContext refreshes data. 
                        // If we close, user sees new dashboard. That's fine.
                    }}
                />
            )}
        </ChallengeModalContext.Provider>
    );
}

