import { Link } from "react-router-dom"
import { useCoupleData } from "@/hooks/useCoupleData"
import { type RelationshipStats } from "@/hooks/useRelationshipStats"
import { useMemo, memo } from "react"

interface Stat {
    label: string
    value: string | number
    icon: string
    color: string
}

interface StatOfTheDayTileProps {
    stats: RelationshipStats | null
}

export const StatOfTheDayTile = memo(function StatOfTheDayTile({ stats: relationshipStats }: StatOfTheDayTileProps) {

    const { couple } = useCoupleData()

    const stats: Stat[] = useMemo(() => {
        if (!couple || !relationshipStats) return []

        const daysTogether = couple.anniversary_date
            ? Math.floor((new Date().getTime() - new Date(couple.anniversary_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0

        const nextMilestone = 365 - (daysTogether % 365)

        return [
            {
                label: "Days Together",
                value: daysTogether,
                icon: "favorite",
                color: "text-rose-500"
            },
            {
                label: "Current Streak",
                value: `${couple.current_streak} Days`,
                icon: "local_fire_department",
                color: "text-orange-500"
            },
            {
                label: "Longest Streak",
                value: `${couple.longest_streak} Days`,
                icon: "emoji_events",
                color: "text-yellow-500"
            },
            {
                label: "Next Anniversary",
                value: `In ${nextMilestone} Days`,
                icon: "event",
                color: "text-purple-500"
            },
            {
                label: "Rain Checks",
                value: couple.rain_check_tokens || 0,
                icon: "umbrella",
                color: "text-blue-500"
            },
            {
                label: "Places Visited",
                value: `${relationshipStats.travelStats.placesVisited} Places`,
                icon: "flight_takeoff",
                color: "text-green-500"
            },
            {
                label: "Most Active Day",
                value: relationshipStats.funStats.mostActiveDay,
                icon: "calendar_month",
                color: "text-indigo-500"
            }
        ]
    }, [couple, relationshipStats])

    // Rotate stat every week
    const currentStatIndex = useMemo(() => {
        if (stats.length === 0) return 0
        const today = new Date().getTime()
        const oneWeek = 1000 * 60 * 60 * 24 * 7
        return Math.floor(today / oneWeek) % stats.length
    }, [stats.length])

    const currentStat = stats[currentStatIndex]

    if (!currentStat) return null

    return (
        <Link
            to="/stats"
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
