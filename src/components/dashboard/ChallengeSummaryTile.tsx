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
    const { dailyStatus, weeklyStatus, monthlyStatus } = useChallenges();

    // Helper to determine status color and label
    const getStatus = (type: 'todays_question' | 'daily' | 'weekly' | 'monthly') => {
        let isCompleted = false;
        let isWaiting = false;

        if (type === 'todays_question') {
            const hasUserAnswered = !!userAnswer;
            const hasPartnerAnswered = !!partnerAnswer;

            if (hasUserAnswered && hasPartnerAnswered) isCompleted = true;
            else if (hasUserAnswered && !hasPartnerAnswered) isWaiting = true;
            // else incomplete (red)
        } else {
            // mapping from useChallenges status
            const status = type === 'daily' ? dailyStatus :
                type === 'weekly' ? weeklyStatus : monthlyStatus;

            if (status === 'completed' || status === 'skipped') isCompleted = true; // Treating skipped as "done" for summary? User said "green for complete". Skipped usually implies done for now.
            else if (status === 'waiting_for_partner' || status === 'pending_agreement') isWaiting = true;
        }

        if (isCompleted) return 'bg-green-100 text-green-700 border-green-200';
        if (isWaiting) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-red-50 text-red-700 border-red-200'; // Default/Incomplete
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

        return (
            <div
                onClick={handleClick}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${getStatus(type)} w-full h-full transition-all cursor-pointer hover:opacity-80`}
            >
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center">{title}</span>
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
                    <span className="material-symbols-outlined text-rose-500">emoji_events</span>
                    <h3 className="font-bold text-heading-dark">Challenges</h3>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-rose-500 transition-colors">arrow_forward</span>
            </div>

            <div className="grid grid-cols-2 gap-2 h-[120px]">
                <StatusBox title="Today's Q" type="todays_question" />
                <StatusBox title="Daily" type="daily" />
                <StatusBox title="Weekly" type="weekly" />
                <StatusBox title="Monthly" type="monthly" />
            </div>
        </div>
    );
}
