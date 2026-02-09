// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { useFantasyBucketList } from "@/hooks/useFantasyBucketList"
import { useSexplorationModals } from "@/context/SexplorationModalContext"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface FantasyBucketListTileProps {
    initialOpenModal?: boolean
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function FantasyBucketListTile({ initialOpenModal = false }: FantasyBucketListTileProps) {
    const {
        pendingCount,
        approvedCount,
        completedCount,
        fantasies,
        loading,
    } = useFantasyBucketList()
    const { openFantasies, lastSeenFantasyPending, lastSeenFantasyApproved, lastSeenFantasyCompleted } = useSexplorationModals()

    // ═══════════════════════════════════════
    // DERIVED DATA
    // ═══════════════════════════════════════
    const hasUnseenPending = useMemo(() => {
        return fantasies.some(f => f.status === "pending" && new Date(f.created_at || 0).getTime() > lastSeenFantasyPending)
    }, [fantasies, lastSeenFantasyPending])

    const hasUnseenApproved = useMemo(() => {
        return fantasies.some(f => f.status === "approved" && new Date(f.responded_at || f.created_at || 0).getTime() > lastSeenFantasyApproved)
    }, [fantasies, lastSeenFantasyApproved])

    const hasUnseenCompleted = useMemo(() => {
        return fantasies.some(f => f.status === "completed" && new Date(f.completed_at || 0).getTime() > lastSeenFantasyCompleted)
    }, [fantasies, lastSeenFantasyCompleted])

    // Handle initial open if needed
    const mounted = useRef(false)

    useEffect(() => {
        if (!mounted.current && initialOpenModal) {
            openFantasies()
            mounted.current = true
        }
    }, [initialOpenModal, openFantasies])

    return (
        <motion.div
            onClick={openFantasies}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all h-full flex flex-col justify-between"
            whileHover={{ scale: 1.01 }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-xl text-pink-500 bg-pink-100 dark:bg-pink-900/30 w-10 h-10 flex items-center justify-center rounded-xl">
                    auto_awesome
                </span>
                <span className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-sm">
                    Fantasy Bucket List
                </span>
            </div>

            {/* Stats with filled circle counters - Triangle Layout */}
            <div className="flex flex-col items-center justify-center mb-3 px-2 gap-3">
                {/* Top Row: Approved and Pending */}
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-green-500 text-white text-[12px] font-bold flex items-center justify-center">
                            {loading ? "—" : approvedCount}
                        </span>
                        <div className="relative">
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                                Approved
                            </span>
                            {hasUnseenApproved && (
                                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-[12px] font-bold flex items-center justify-center">
                            {loading ? "—" : pendingCount}
                        </span>
                        <div className="relative">
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                                Pending
                            </span>
                            {hasUnseenPending && (
                                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Completed */}
                <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-[12px] font-bold flex items-center justify-center">
                        {loading ? "—" : completedCount}
                    </span>
                    <div className="relative">
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                            Completed
                        </span>
                        {hasUnseenCompleted && (
                            <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 text-right">Tap to explore →</p>
        </motion.div>
    )
}

