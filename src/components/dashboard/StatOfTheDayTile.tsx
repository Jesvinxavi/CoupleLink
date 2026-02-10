// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Link } from "react-router-dom"
import { useMemo, memo } from "react"
import { useCoupleData } from "@/hooks/useCoupleData"
import { type RelationshipStats } from "@/hooks/useRelationshipStats"
import { ROUTES, URGENCY_THRESHOLDS } from "@/lib/constants"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface Stat {
    label: string
    value: string | number
    icon: string
    color: string
    bg?: string
}

interface StatOfTheDayTileProps {
    stats: RelationshipStats | null
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export const StatOfTheDayTile = memo(function StatOfTheDayTile({ stats: relationshipStats }: StatOfTheDayTileProps) {

    const { couple } = useCoupleData()

    // Calculate days together (memoized to avoid re-calculation on every render)
    const daysTogether = useMemo(() => {
        if (!couple?.anniversary_date) return 0
        // eslint-disable-next-line react-hooks/purity
        return Math.floor((Date.now() - new Date(couple.anniversary_date).getTime()) / URGENCY_THRESHOLDS.ONE_DAY)
    }, [couple?.anniversary_date])

    const stats: Stat[] = useMemo(() => {
        if (!couple || !relationshipStats) return []

        const nextMilestone = 365 - (daysTogether % 365)

        const baseStats: Stat[] = [
            {
                label: "Days Together",
                value: daysTogether.toLocaleString(),
                icon: "favorite",
                color: "text-rose-500",
                bg: "bg-rose-50"
            },
            {
                label: "Next Milestone",
                value: `${nextMilestone} days`,
                icon: "flag",
                color: "text-amber-500",
                bg: "bg-amber-50"
            },
            {
                label: "Current Streak",
                value: `${relationshipStats.currentStreak} days`,
                icon: "local_fire_department",
                color: "text-orange-500",
                bg: "bg-orange-50"
            },
            {
                label: "Challenges Completed",
                value: relationshipStats.activityBreakdown.find(i => i.name === 'Challenges')?.value?.toString() || "0",
                icon: "emoji_events",
                color: "text-yellow-600",
                bg: "bg-yellow-50"
            },
            {
                label: "Memories Shared",
                value: relationshipStats.totalMemories.toString(),
                icon: "photo_library",
                color: "text-blue-500",
                bg: "bg-blue-50"
            },
            {
                label: "Questions Answered",
                value: relationshipStats.activityBreakdown.find(i => i.name === 'Deep Questions')?.value?.toString() || "0",
                icon: "psychology",
                color: "text-green-500",
                bg: "bg-green-50"
            }
        ]

        return baseStats
    }, [couple, relationshipStats, daysTogether])

    // Rotate stat every week
    const currentStatIndex = useMemo(() => {
        if (stats.length === 0) return 0
        // eslint-disable-next-line react-hooks/purity
        const today = Date.now()
        const oneWeek = URGENCY_THRESHOLDS.ONE_DAY * 7
        return Math.floor(today / oneWeek) % stats.length
    }, [stats.length])

    const currentStat = stats[currentStatIndex]

    if (!currentStat) return null

    return (
        <Link
            to={ROUTES.STATS}
            className="group block relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer h-full"
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-xl">
                        lightbulb
                    </span>
                    <h3 className="text-lg font-bold text-heading-dark">
                        Stat of the Week
                    </h3>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-rose-500 transition-colors">
                    arrow_forward
                </span>
            </div>

            <div className="mt-1">
                <div className="flex items-center gap-3 mb-1">
                    <span className={`material-symbols-outlined text-2xl ${currentStat.color}`}>
                        {currentStat.icon}
                    </span>
                    <h3 className="text-sm font-medium text-body-soft">
                        {currentStat.label}
                    </h3>
                </div>
                <p className="text-3xl font-bold text-heading-dark pl-9">
                    {currentStat.value}
                </p>
            </div>

            {/* Decorative background element */}
            <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">
                    {currentStat.icon}
                </span>
            </div>
        </Link>
    )
})
