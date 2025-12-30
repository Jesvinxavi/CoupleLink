import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useFantasyBucketList } from '../../hooks/useFantasyBucketList';
import { useSexplorationModals } from '@/context/SexplorationModalContext';

interface FantasyBucketListTileProps {
    initialOpenModal?: boolean;
}

export function FantasyBucketListTile({ initialOpenModal = false }: FantasyBucketListTileProps) {
    const {
        pendingCount,
        approvedCount,
        completedCount,
        loading,
    } = useFantasyBucketList();
    const { openFantasies } = useSexplorationModals();

    // Handle initial open if needed
    const mounted = useRef(false);
    if (!mounted.current && initialOpenModal) {
        openFantasies();
        mounted.current = true;
    }

    return (
        <motion.div
            onClick={openFantasies}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all h-full flex flex-col justify-between"
            whileHover={{ scale: 1.01 }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-lg text-pink-500 bg-pink-100 dark:bg-pink-900/30 w-8 h-8 flex items-center justify-center rounded-xl">
                    auto_awesome
                </span>
                <span className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Fantasy Bucket List
                </span>
            </div>

            {/* Stats with filled circle counters - compressed */}
            <div className="flex gap-3 items-center justify-center mb-2 px-2">
                <div className="flex items-center gap-1">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white text-[12px] font-bold flex items-center justify-center">
                        {loading ? '—' : approvedCount}
                    </span>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Approved
                    </span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-1">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-[12px] font-bold flex items-center justify-center">
                        {loading ? '—' : pendingCount}
                    </span>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Pending
                    </span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-1">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-[12px] font-bold flex items-center justify-center">
                        {loading ? '—' : completedCount}
                    </span>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                        Completed
                    </span>
                </div>
            </div>

            <p className="text-xs text-gray-400 text-right">Tap to explore →</p>
        </motion.div>
    );
}

