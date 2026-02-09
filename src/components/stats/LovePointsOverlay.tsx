// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface LovePointsBreakdown {
    dailyChallenges: number
    weeklyChallenges: number
    monthlyChallenges: number
    dailyQuestions: number
    positionsCompleted: number
    fantasiesCompleted: number
}

interface LovePointsOverlayProps {
    isOpen: boolean
    onClose: () => void
    totalPoints: number
    breakdown: LovePointsBreakdown
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const CATEGORIES = [
    {
        key: 'dailyChallenges' as const,
        label: 'Daily Challenges',
        icon: 'trophy',
        color: 'from-orange-400 to-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-500',
        borderColor: 'border-orange-200 dark:border-orange-800',
        pointsPerUnit: 1,
        unit: 'challenge',
    },
    {
        key: 'weeklyChallenges' as const,
        label: 'Weekly Challenges',
        icon: 'trophy',
        color: 'from-blue-400 to-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-500',
        borderColor: 'border-blue-200 dark:border-blue-800',
        pointsPerUnit: 3,
        unit: 'challenge',
    },
    {
        key: 'monthlyChallenges' as const,
        label: 'Monthly Challenges',
        icon: 'trophy',
        color: 'from-purple-400 to-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        textColor: 'text-purple-500',
        borderColor: 'border-purple-200 dark:border-purple-800',
        pointsPerUnit: 5,
        unit: 'challenge',
    },
    {
        key: 'dailyQuestions' as const,
        label: 'Daily Questions',
        icon: 'help_outline',
        color: 'from-green-400 to-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-500',
        borderColor: 'border-green-200 dark:border-green-800',
        pointsPerUnit: 1,
        unit: 'question',
    },
    {
        key: 'positionsCompleted' as const,
        label: 'Positions Unlocked',
        icon: 'favorite',
        color: 'from-pink-400 to-rose-500',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        textColor: 'text-pink-500',
        borderColor: 'border-pink-200 dark:border-pink-800',
        pointsPerUnit: 5,
        unit: 'position',
    },
    {
        key: 'fantasiesCompleted' as const,
        label: 'Fantasies Achieved',
        icon: 'auto_awesome',
        color: 'from-indigo-400 to-violet-500',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        textColor: 'text-indigo-500',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        pointsPerUnit: 5,
        unit: 'fantasy',
    },
]

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function LovePointsOverlay({
    isOpen,
    onClose,
    totalPoints,
    breakdown
}: LovePointsOverlayProps) {
    useLockBodyScroll(isOpen)

    // Calculate points for each category
    const categoriesWithPoints = useMemo(() => {
        return CATEGORIES.map(cat => ({
            ...cat,
            count: breakdown[cat.key],
            points: breakdown[cat.key] * cat.pointsPerUnit
        })).filter(cat => cat.count > 0) // Only show categories with points
    }, [breakdown])

    // Calculate total from breakdown (to show any discrepancy)
    const calculatedTotal = useMemo(() => {
        return categoriesWithPoints.reduce((sum, cat) => sum + cat.points, 0)
    }, [categoriesWithPoints])

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Overlay */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none overflow-hidden"
                        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-white dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container */}
                        <div className="flex flex-col w-full bg-white dark:bg-gray-900 max-h-[85vh] shadow-2xl ring-1 ring-black/5 rounded-t-[32px] overflow-hidden">
                            {/* Header */}
                            <div className="shrink-0 z-10 bg-white dark:bg-gray-900 relative overflow-hidden">
                                {/* Decorative Blur Background */}
                                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-purple-50 via-white to-white dark:from-purple-900/10 dark:via-gray-900 dark:to-gray-900 z-0"></div>
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl z-0 pointer-events-none"></div>
                                <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl z-0 pointer-events-none"></div>

                                <div className="relative z-10 px-6 pt-4 pb-4">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                Love Points
                                                <span className="text-2xl">✨</span>
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Your journey of love, quantified</p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Total Points Display - Big & Premium */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full"></div>
                                            <div className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 drop-shadow-sm tracking-tighter">
                                                {totalPoints.toLocaleString()}
                                            </div>
                                        </div>
                                        <span className="mt-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-800/50">
                                            Total Earned Together
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div
                                className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scroll-smooth bg-gray-50 dark:bg-gray-900"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                onTouchMove={(e) => e.stopPropagation()}
                            >
                                {categoriesWithPoints.length > 0 ? (
                                    categoriesWithPoints.map((cat, idx) => (
                                        <motion.div
                                            key={cat.key}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`flex items-center gap-4 p-4 rounded-3xl ${cat.bgColor} border ${cat.borderColor} shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                                <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {cat.label}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {cat.count} {cat.count === 1 ? cat.unit : `${cat.unit}s`} × {cat.pointsPerUnit} pts
                                                </div>
                                            </div>

                                            {/* Points */}
                                            <div className={`text-2xl font-bold ${cat.textColor}`}>
                                                +{cat.points}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl"></div>
                                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 flex items-center justify-center shadow-lg ring-1 ring-black/5 dark:ring-white/10 rotate-3">
                                                <span className="material-symbols-outlined text-4xl text-purple-500">stars</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Start earning points!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px]">Complete challenges, questions, and explore together to grow your score.</p>
                                    </div>
                                )}

                                {/* Discrepancy note (if calculated doesn't match total) */}
                                {totalPoints !== calculatedTotal && calculatedTotal > 0 && (
                                    <div className="text-center text-xs text-gray-400 pt-2">
                                        {totalPoints > calculatedTotal
                                            ? `+${totalPoints - calculatedTotal} points from legacy activities`
                                            : null}
                                    </div>
                                )}

                                {/* Bottom padding for safety */}
                                <div className="h-8" />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
