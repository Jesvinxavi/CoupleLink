import type { NavigateFunction } from "react-router-dom"
import { ROUTES } from "@/lib/constants"
import type { Challenge, UserAnswer } from "@/types/challenge"

// ═══════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════
export type StatusType = "todays_question" | "daily" | "weekly" | "monthly"

const getStatusStyle = (
    type: StatusType,
    poolStatus: Record<string, { allShown: boolean }> | null,
    daily: Challenge | null,
    weekly: Challenge | null,
    monthly: Challenge | null,
    userAnswer: UserAnswer | null,
    partnerAnswer: UserAnswer | null,
    dailyStatus: string,
    weeklyStatus: string,
    monthlyStatus: string
) => {
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

interface StatusBoxProps {
    title: string
    type: StatusType
    navigate: NavigateFunction
    openDaily: () => void
    openWeekly: () => void
    openMonthly: () => void
    dailyTimeLeft: string
    weeklyTimeLeft: string
    monthlyTimeLeft: string
    poolStatus: Record<string, { allShown: boolean }> | null
    daily: Challenge | null
    weekly: Challenge | null
    monthly: Challenge | null
    userAnswer: UserAnswer | null
    partnerAnswer: UserAnswer | null
    dailyStatus: string
    weeklyStatus: string
    monthlyStatus: string
}

export const StatusBox = ({
    title, type, navigate, openDaily, openWeekly, openMonthly,
    dailyTimeLeft, weeklyTimeLeft, monthlyTimeLeft,
    poolStatus, daily, weekly, monthly, userAnswer, partnerAnswer,
    dailyStatus, weeklyStatus, monthlyStatus
}: StatusBoxProps) => {
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

    const style = getStatusStyle(type, poolStatus, daily, weekly, monthly, userAnswer, partnerAnswer, dailyStatus, weeklyStatus, monthlyStatus)
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
