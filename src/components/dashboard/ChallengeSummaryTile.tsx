// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useNavigate } from "react-router-dom"
import { useDailyChallenge } from "@/hooks/useDailyChallenge"
import { useChallenges } from "@/hooks/useChallenges"
import { useCoupleData } from "@/hooks/useCoupleData"
import { useChallengeModals } from "@/context/ChallengeModalContext"
import { ROUTES } from "@/lib/constants"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════
import { StatusBox } from "./StatusBox"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function ChallengeSummaryTile() {
    const navigate = useNavigate()
    const { couple } = useCoupleData()
    const { openDaily, openWeekly, openMonthly } = useChallengeModals()

    // Daily Question Status
    const { userAnswer, partnerAnswer } = useDailyChallenge(couple?.id ?? null)

    // Challenges Status & Timers
    const {
        dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft,
        dailyStatus, weeklyStatus, monthlyStatus,
        poolStatus,
        daily, weekly, monthly
    } = useChallenges()

    const commonProps = {
        navigate, openDaily, openWeekly, openMonthly,
        dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft,
        poolStatus, daily, weekly, monthly,
        userAnswer, partnerAnswer,
        dailyStatus, weeklyStatus, monthlyStatus
    }

    return (
        <div
            className="col-span-12 md:col-span-4 h-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100 transition-all relative overflow-hidden group flex flex-col"
        >
            <div
                onClick={() => navigate(ROUTES.CHALLENGES)}
                className="flex items-center justify-between mb-3 cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-xl">emoji_events</span>
                    <h3 className="text-lg font-bold text-heading-dark">Challenges</h3>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-rose-500 transition-colors">arrow_forward</span>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1">
                <StatusBox title="Today's Question" type="todays_question" {...commonProps} />
                <StatusBox title="Daily" type="daily" {...commonProps} />
                <StatusBox title="Weekly" type="weekly" {...commonProps} />
                <StatusBox title="Monthly" type="monthly" {...commonProps} />
            </div>
        </div>
    )
}
