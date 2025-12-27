import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSexploration } from '../../hooks/useSexploration';
import { useSexplorationModals } from '../../context/SexplorationModalContext';
import { positions, getPositionOfTheWeek } from '../../data/positionsData';
import { PositionSVG } from './PositionSVG';

interface PositionTrackerTileProps {
    initialOpenModal?: boolean;
}

export function PositionTrackerTile({ initialOpenModal = false }: PositionTrackerTileProps) {
    const { completedPositions, togglePositionComplete, isPositionCompleted, loading } = useSexploration();
    const { openPositions } = useSexplorationModals();

    const positionOfTheWeek = getPositionOfTheWeek();
    const isCompleted = isPositionCompleted(positionOfTheWeek.id);
    const totalPositions = positions.length;
    const completedCount = completedPositions.length;

    const handleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await togglePositionComplete(positionOfTheWeek.id);
    };

    // Handle initial open if needed (though usually handled by page now)
    const mounted = useRef(false);
    if (!mounted.current && initialOpenModal) {
        openPositions();
        mounted.current = true;
    }

    return (
        <motion.div
            onClick={openPositions}
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
            whileHover={{ scale: 1.01 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-pink-500 bg-pink-100 dark:bg-pink-900/30 w-10 h-10 flex items-center justify-center rounded-xl">
                        explore
                    </span>
                    <span className="font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-sm">
                        Position Tracker
                    </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full">
                    <span>{completedCount}</span>
                    <span className="text-gray-400">/</span>
                    <span>{totalPositions}</span>
                </div>
            </div>

            {/* Position of the Week */}
            <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Position of the Week</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PositionSVG position={positionOfTheWeek} size="md" />
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                {positionOfTheWeek.name}
                            </h3>
                            <span className="text-xs text-gray-400 capitalize">
                                {positionOfTheWeek.category}
                            </span>
                        </div>
                    </div>

                    {/* Complete Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleComplete}
                        disabled={loading}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isCompleted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
                            }`}
                    >
                        {isCompleted ? '✓ Completed' : 'Mark Complete'}
                    </motion.button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / totalPositions) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                />
            </div>
            <p className="text-xs text-gray-400 mt-2">Tap to explore all positions →</p>
        </motion.div>
    );
}
