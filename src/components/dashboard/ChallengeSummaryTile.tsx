import { useNavigate } from "react-router-dom";
import { useDailyChallenge } from "../../hooks/useDailyChallenge";
import { useChallenges } from "../../hooks/useChallenges";
import { useCoupleData } from "../../hooks/useCoupleData";
import { useChallengeModals } from "../../context/ChallengeModalContext";

export function ChallengeSummaryTile() {
    const navigate = useNavigate();
    const { couple } = useCoupleData();
    const { openDaily, openWeekly, openMonthly } = useChallengeModals();

    // Daily Question Status
    const { userAnswer, partnerAnswer } = useDailyChallenge(couple?.id ?? null);

    // Challenges Status

    // Timers
    const { dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft, dailyStatus, weeklyStatus, monthlyStatus } = useChallenges();

    // Local timer for Today's Q (same as daily deadline - Midnight UTC)
    // We can just reuse dailyTimeLeft since they share the same deadline (Midnight)
    // But for completeness/independence involving formats, let's just use dailyTimeLeft for now as they are synced.

    // Helper to determine status color and label
    const getStatusStyle = (type: 'todays_question' | 'daily' | 'weekly' | 'monthly') => {
        let status: 'completed' | 'waiting' | 'skipped' | 'incomplete' = 'incomplete';

        if (type === 'todays_question') {
            const hasUserAnswered = !!userAnswer;
            const hasPartnerAnswered = !!partnerAnswer;

            if (hasUserAnswered && hasPartnerAnswered) status = 'completed';
            else if (hasUserAnswered && !hasPartnerAnswered) status = 'waiting';
            // else incomplete
        } else {
            const challengeStatus = type === 'daily' ? dailyStatus :
                type === 'weekly' ? weeklyStatus : monthlyStatus;

            if (challengeStatus === 'completed') status = 'completed';
            else if (challengeStatus === 'skipped') status = 'skipped';
            else if (challengeStatus === 'waiting_for_partner' || challengeStatus === 'pending_agreement') status = 'waiting';
        }

        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'waiting': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'skipped': return 'bg-gray-50 text-gray-400 border-gray-100';
            default: return 'bg-red-50 text-red-700 border-red-200';
        }
    };

    const StatusBox = ({ title, type }: { title: string, type: 'todays_question' | 'daily' | 'weekly' | 'monthly' }) => {
        const handleClick = () => {
            if (type === 'todays_question') {
                navigate('/challenges');
            } else if (type === 'daily') {
                openDaily();
            } else if (type === 'weekly') {
                openWeekly();
            } else if (type === 'monthly') {
                openMonthly();
            }
        };

        const style = getStatusStyle(type);
        const isCompletedOrSkipped = style.includes('bg-green') || style.includes('bg-gray');

        let timer = null;
        if (!isCompletedOrSkipped) {
            if (type === 'todays_question' || type === 'daily') timer = dailyTimeLeft;
            else if (type === 'weekly') timer = weeklyTimeLeft;
            else if (type === 'monthly') timer = monthlyTimeLeft;
        }

        return (
            <div
                onClick={handleClick}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${style} w-full h-full transition-all cursor-pointer hover:opacity-80 relative`}
            >
                <div className="flex flex-col items-center justify-center h-full gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center leading-none">{title}</span>
                    {timer && (
                        <span className="text-[10px] font-medium opacity-80 leading-none tabular-nums">
                            {timer}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className="col-span-12 md:col-span-4 h-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100 transition-all relative overflow-hidden group"
        >
            <div
                onClick={() => navigate('/challenges')}
                className="flex items-center justify-between mb-3 cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-xl">emoji_events</span>
                    <h3 className="text-lg font-bold text-heading-dark">Challenges</h3>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-rose-500 transition-colors">arrow_forward</span>
            </div>

            <div className="grid grid-cols-2 gap-2 h-[120px]">
                <StatusBox title="Today's Question" type="todays_question" />
                <StatusBox title="Daily" type="daily" />
                <StatusBox title="Weekly" type="weekly" />
                <StatusBox title="Monthly" type="monthly" />
            </div>
        </div>
    );
}
