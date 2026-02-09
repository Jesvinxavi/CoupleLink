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
export function ChallengeSummaryTile() {
    const navigate = useNavigate()
    const { couple } = useCoupleData()
    const { openDaily, openWeekly, openMonthly } = useChallengeModals()

    // Daily Question Status
    const { userAnswer, partnerAnswer } = useDailyChallenge(couple?.id ?? null)

    // Challenges Status

    // Timers
    const {
        dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft,
        dailyStatus, weeklyStatus, monthlyStatus,
        poolStatus,
        daily, weekly, monthly
    } = useChallenges()

    // Helper to determine status color and label
    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    const getStatusStyle = (type: "todays_question" | "daily" | "weekly" | "monthly") => {
        // Check for All Explored State first
        if (type !== "todays_question") {
            const isAllExplored = poolStatus?.[type]?.allShown
            const challenge = type === "daily" ? daily : type === "weekly" ? weekly : monthly

            // If all shown and NO active challenge, we are in the "All Explored" empty state
            if (isAllExplored && !challenge) {
                return "bg-purple-50 text-purple-700 border-purple-200"
            }
        }

        let status: "completed" | "waiting" | "skipped" | "incomplete" = "incomplete"

        if (type === "todays_question") {
            const hasUserAnswered = !!userAnswer
            const hasPartnerAnswered = !!partnerAnswer

            if (hasUserAnswered && hasPartnerAnswered) status = "completed"
            else if (hasUserAnswered && !hasPartnerAnswered) status = "waiting"
            // else incomplete
        } else {
            const challengeStatus = type === "daily" ? dailyStatus :
                type === "weekly" ? weeklyStatus : monthlyStatus

            if (challengeStatus === "completed") status = "completed"
            else if (challengeStatus === "skipped") status = "skipped"
            else if (challengeStatus === "waiting_for_partner" || challengeStatus === "pending_agreement") status = "waiting"
        }

        switch (status) {
            case "completed": return "bg-green-100 text-green-700 border-green-200"
            case "waiting": return "bg-amber-100 text-amber-700 border-amber-200"
            case "skipped": return "bg-gray-50 text-gray-400 border-gray-100"
            default: return "bg-red-50 text-red-700 border-red-200"
        }
    }

    const StatusBox = ({ title, type }: { title: string, type: "todays_question" | "daily" | "weekly" | "monthly" }) => {
        const handleClick = () => {
            if (type === "todays_question") {
                navigate(ROUTES.CHALLENGES)
            } else if (type === "daily") {
                openDaily()
            } else if (type === "weekly") {
                openWeekly()
            } else if (type === "monthly") {
                openMonthly()
            }
        }

        const style = getStatusStyle(type)
        const isCompletedOrSkipped = style.includes("bg-green") || style.includes("bg-gray")
        const isAllExplored = style.includes("bg-purple")

        let timer = null
        if (isAllExplored) {
            timer = "All Explored!"
        } else if (!isCompletedOrSkipped) {
            if (type === "todays_question" || type === "daily") timer = dailyTimeLeft
            else if (type === "weekly") timer = weeklyTimeLeft
            else if (type === "monthly") timer = monthlyTimeLeft
        }

        return (
            <div
                onClick={handleClick}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${style} w-full min-h-[60px] h-full transition-all cursor-pointer hover:opacity-80 relative`}
            >
                <div className="flex flex-col items-center justify-center h-full gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center leading-none">{title}</span>
                    {timer && (
                        <span className={`text-[10px] font-medium opacity-80 leading-none tabular-nums ${isAllExplored ? "mt-1" : ""}`}>
                            {timer}
                        </span>
                    )}
                </div>
            </div>
        )
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
                <StatusBox title="Today's Question" type="todays_question" />
                <StatusBox title="Daily" type="daily" />
                <StatusBox title="Weekly" type="weekly" />
                <StatusBox title="Monthly" type="monthly" />
            </div>
        </div>
    )
}
