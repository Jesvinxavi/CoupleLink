import { createContext, useContext, useState, type ReactNode } from 'react';
import { ChallengeModal } from '../components/dashboard/ChallengeModal';
import { useChallenges } from '../hooks/useChallenges';
import { useStreak } from '../hooks/useStreak';
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
    const { addPoints, checkStreakUpdate } = useStreak({ enableTokenCheck: false });

    // Open modal directly (no navigation)
    const openDaily = () => setSelectedChallenge({ type: 'daily' });
    const openWeekly = () => setSelectedChallenge({ type: 'weekly' });
    const openMonthly = () => setSelectedChallenge({ type: 'monthly' });

    const handleClose = () => setSelectedChallenge(null);

    const handleComplete = async (file?: File | null, winnerSelection?: 'me' | 'partner' | 'tie') => {
        if (selectedChallenge) {
            await challenges.completeChallenge(selectedChallenge.type, file, winnerSelection);

            const partnerMem = selectedChallenge.type === 'daily' ? challenges.partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

            if (partnerMem) {
                // Check for agreement
                let isAgreed = true;
                const challenge = selectedChallenge.type === 'daily' ? challenges.daily :
                    selectedChallenge.type === 'weekly' ? challenges.weekly : challenges.monthly;

                if (challenge?.isCompetition) {
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
                const challenge = selectedChallenge.type === 'daily' ? challenges.daily :
                    selectedChallenge.type === 'weekly' ? challenges.weekly : challenges.monthly;

                if (!challenge?.isCompetition) {
                    await checkStreakUpdate();
                }
            }
        }
    };

    const handleUndo = async () => {
        if (selectedChallenge) {
            const partnerMem = selectedChallenge.type === 'daily' ? challenges.partnerDailyMemory :
                selectedChallenge.type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

            if (partnerMem) {
                if (selectedChallenge.type === 'daily') await addPoints(-1);
                else if (selectedChallenge.type === 'weekly') await addPoints(-3);
                else if (selectedChallenge.type === 'monthly') await addPoints(-5);
            }

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

        const challenge = selectedChallenge.type === 'daily' ? challenges.daily :
            selectedChallenge.type === 'weekly' ? challenges.weekly : challenges.monthly;

        const timeLeft = selectedChallenge.type === 'daily' ? challenges.dailyTimeLeft :
            selectedChallenge.type === 'weekly' ? challenges.weeklyTimeLeft : challenges.monthlyTimeLeft;

        const isUrgent = selectedChallenge.type === 'daily' ? challenges.dailyTimeUrgent :
            selectedChallenge.type === 'weekly' ? challenges.weeklyTimeUrgent : challenges.monthlyTimeUrgent;

        const status = selectedChallenge.type === 'daily' ? challenges.dailyStatus :
            selectedChallenge.type === 'weekly' ? challenges.weeklyStatus : challenges.monthlyStatus;

        const myMemory = selectedChallenge.type === 'daily' ? challenges.myDailyMemory :
            selectedChallenge.type === 'weekly' ? challenges.myWeeklyMemory : challenges.myMonthlyMemory;

        const partnerMemory = selectedChallenge.type === 'daily' ? challenges.partnerDailyMemory :
            selectedChallenge.type === 'weekly' ? challenges.partnerWeeklyMemory : challenges.partnerMonthlyMemory;

        const winnerAgreement = challenges.winnerAgreement[selectedChallenge.type];

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
            initialSelection
        };
    };

    const challengeData = getChallengeData();

    return (
        <ChallengeModalContext.Provider value={{ openDaily, openWeekly, openMonthly }}>
            {children}

            {/* Global Modal - persists across page navigation */}
            {selectedChallenge && challengeData?.challenge && (
                <ChallengeModal
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
                />
            )}
        </ChallengeModalContext.Provider>
    );
}

