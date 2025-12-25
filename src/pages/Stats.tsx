import Sidebar from "@/components/Sidebar"
import { useRelationshipStats } from "@/hooks/useRelationshipStats"
import { motion } from "framer-motion"
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { LeaderboardTile } from "@/components/dashboard/LeaderboardTile"

const COLORS = ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

// import { Calendar, MapPin, Heart, Trophy, Clock, Globe } from 'lucide-react';
import { useState, useEffect } from "react"
import { UserAvatar } from "@/components/ui/UserAvatar"

import { TravelOverlay } from "@/components/stats/TravelOverlay"

export default function StatsPage() {
    const { stats, loading } = useRelationshipStats()
    const [forceLoading, setForceLoading] = useState(true)
    const [isTravelOverlayOpen, setIsTravelOverlayOpen] = useState(false)
    const [challengeTimeframe, setChallengeTimeframe] = useState<'all' | '90'>('90')

    const activeChallengeStats = challengeTimeframe === 'all' ? stats?.challengeCompletion : stats?.challengeCompletion90

    useEffect(() => {
        const timer = setTimeout(() => {
            setForceLoading(false)
        }, 250)
        return () => clearTimeout(timer)
    }, [])

    return (
        <>
            <Sidebar />
            <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen dark:bg-gray-900">
                <main className="p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 pt-4 md:pt-8"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">insights</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    Insights
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Discover the patterns of your life together
                                </p>
                            </div>
                        </motion.div>

                        {loading || forceLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                            </div>
                        ) : (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                            >
                                {/* Key Stats Row */}
                                <motion.div variants={item} className="md:col-span-1 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-500/20 relative overflow-hidden flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-2xl bg-white/20 p-1.5 rounded-lg">favorite</span>
                                            <span className="font-medium text-rose-100 text-sm">Days</span>
                                        </div>
                                        <div className="text-4xl font-bold mb-1">{stats?.daysTogether}</div>
                                        <div className="text-rose-100 text-xs">Days of love</div>
                                    </div>
                                    <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-white/10 rotate-12">favorite</span>
                                </motion.div>

                                <motion.div variants={item} className="md:col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-orange-500">
                                            <span className="material-symbols-outlined">local_fire_department</span>
                                            <span className="font-medium text-sm uppercase tracking-wider">Streak</span>
                                        </div>
                                        <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.currentStreak}</div>
                                        <div className="text-gray-400 text-sm mt-2">Keep the flame alive!</div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-100 dark:bg-gray-700">
                                        <div className="h-full bg-orange-500" style={{ width: '100%' }}></div>
                                    </div>
                                </motion.div>

                                <motion.div variants={item} className="md:col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 text-purple-500">
                                            <span className="material-symbols-outlined">stars</span>
                                            <span className="font-medium text-sm uppercase tracking-wider">Love Points</span>
                                        </div>
                                        <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.totalLovePoints}</div>
                                        <div className="text-gray-400 text-sm mt-2">Total Accumulated Love</div>
                                    </div>
                                    <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-purple-500/5 rotate-12">stars</span>
                                </motion.div>

                                <motion.div
                                    variants={item}
                                    onClick={() => setIsTravelOverlayOpen(true)}
                                    className="md:col-span-1 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer active:scale-95"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <span className="material-symbols-outlined">flight_takeoff</span>
                                                <span className="font-medium text-sm uppercase tracking-wider">Travel</span>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500 transition-colors">arrow_forward</span>
                                        </div>
                                        <div className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.travelStats.countriesVisited}</div>
                                        <div className="text-gray-400 text-sm mt-2">Countries visited together</div>
                                    </div>
                                    <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-blue-500/5 rotate-12">public</span>
                                </motion.div>

                                {/* Challenge Mastery - 2x2 Grid of Rings */}
                                <motion.div variants={item} className="col-span-2 md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500">trophy</span>
                                            Challenge Mastery
                                        </h3>
                                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                            <button
                                                onClick={() => setChallengeTimeframe('90')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${challengeTimeframe === '90'
                                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                Last 90 Days
                                            </button>
                                            <button
                                                onClick={() => setChallengeTimeframe('all')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${challengeTimeframe === 'all'
                                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                All Time
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                                        <CircularProgress
                                            label="Questions"
                                            percentage={activeChallengeStats?.questions?.percentage || 0}
                                            completed={activeChallengeStats?.questions?.completed || 0}
                                            total={activeChallengeStats?.questions?.possible || 0}
                                        />
                                        <CircularProgress
                                            label="Daily"
                                            percentage={activeChallengeStats?.daily.percentage || 0}
                                            completed={activeChallengeStats?.daily.completed || 0}
                                            total={activeChallengeStats?.daily.possible || 0}
                                        />
                                        <CircularProgress
                                            label="Weekly"
                                            percentage={activeChallengeStats?.weekly.percentage || 0}
                                            completed={activeChallengeStats?.weekly.completed || 0}
                                            total={activeChallengeStats?.weekly.possible || 0}
                                        />
                                        <CircularProgress
                                            label="Monthly"
                                            percentage={activeChallengeStats?.monthly.percentage || 0}
                                            completed={activeChallengeStats?.monthly.completed || 0}
                                            total={activeChallengeStats?.monthly.possible || 0}
                                        />
                                    </div>
                                </motion.div>

                                {/* Leaderboard Tile */}
                                <motion.div variants={item} className="col-span-2 md:col-span-2">
                                    <LeaderboardTile stats={stats?.leaderboard} loading={loading} />
                                </motion.div>

                                {/* Row 3: Journal & Activity Mix */}
                                <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Journal Stats */}
                                    <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-rose-500">menu_book</span>
                                            Journal Contributions
                                        </h3>
                                        <div className="flex flex-col justify-center h-full pb-2 pl-4 pr-2 relative min-h-[140px]">
                                            {/* Y-Axis Line */}
                                            <div className="absolute left-4 top-2 bottom-10 w-1.5 bg-black dark:bg-white rounded-full" />

                                            <div className="space-y-6 relative z-10 -mt-9">
                                                {stats?.journalByPerson.map((person, idx) => (
                                                    <div key={idx} className="flex items-center">
                                                        {/* Bar Container */}
                                                        <div className="flex-1 relative h-12 flex items-center pl-2">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.max(2, (person.value / (stats.totalJournalEntries || 1)) * 100)}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className="h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-2xl relative shadow-sm"
                                                            />

                                                            {/* Avatar outside the bar */}
                                                            <div className="flex items-center gap-3 ml-3">
                                                                <UserAvatar
                                                                    user={{ first_name: person.name, avatar_url: person.avatar_url }}
                                                                    className="w-10 h-10 border border-gray-100 dark:border-gray-700"
                                                                />

                                                                {/* Count Label */}
                                                                <span className="font-bold text-xl text-gray-900 dark:text-white">
                                                                    {person.value}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Activity Mix */}
                                    <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-teal-500">pie_chart</span>
                                            Activity Mix
                                        </h3>
                                        {stats?.activityBreakdown && stats.activityBreakdown.length > 0 ? (
                                            <div className="flex flex-col gap-3 items-center">
                                                <div className="h-[150px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={stats.activityBreakdown}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={50}
                                                                outerRadius={70}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {stats.activityBreakdown.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex flex-wrap gap-2 w-full justify-center">
                                                    {stats.activityBreakdown.map((entry, index) => (
                                                        <div key={index} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                                                            <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                                                {entry.value}
                                                            </div>
                                                            <p className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">{entry.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                                                    <span className="material-symbols-outlined text-gray-400 text-3xl">data_usage</span>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No activities completed yet</p>
                                                <p className="text-sm text-gray-400 mt-1">Complete some challenges to see your mix!</p>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
            {/* Travel Overlay */}
            <TravelOverlay
                isOpen={isTravelOverlayOpen}
                onClose={() => setIsTravelOverlayOpen(false)}
                countries={stats?.travelStats.visitedCountries || []}
            />
        </>
    )
}

function CircularProgress({ label, percentage, completed, total }: { label: string, percentage: number, completed: number, total: number }) {
    // Color logic: 0-33 Red, 34-66 Amber, 67-100 Green
    let color = "#10B981" // Green
    if (percentage <= 33) color = "#EF4444" // Red
    else if (percentage <= 66) color = "#F59E0B" // Amber

    const radius = 32 // Slightly smaller to fit side-by-side text
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div className="flex items-center gap-2">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-gray-100 dark:text-gray-700"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={color}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{percentage}%</span>
                </div>
            </div>
            <div className="flex flex-col">
                <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{completed}/{total}</p>
            </div>
        </div>
    )
}


