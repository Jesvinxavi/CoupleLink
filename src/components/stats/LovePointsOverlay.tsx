import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface LovePointsBreakdown {
    dailyChallenges: number;
    weeklyChallenges: number;
    monthlyChallenges: number;
    dailyQuestions: number;
    positionsCompleted: number;
    fantasiesCompleted: number;
}

interface LovePointsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    totalPoints: number;
    breakdown: LovePointsBreakdown;
}

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
];

export const LovePointsOverlay: React.FC<LovePointsOverlayProps> = ({
    isOpen,
    onClose,
    totalPoints,
    breakdown
}) => {
    // Robust Body Lock
    React.useEffect(() => {
        if (!isOpen) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        return () => {
            const topStyle = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(topStyle || '0') * -1);
        };
    }, [isOpen]);

    // Calculate points for each category
    const categoriesWithPoints = CATEGORIES.map(cat => ({
        ...cat,
        count: breakdown[cat.key],
        points: breakdown[cat.key] * cat.pointsPerUnit
    })).filter(cat => cat.count > 0); // Only show categories with points

    // Calculate total from breakdown (to show any discrepancy)
    const calculatedTotal = categoriesWithPoints.reduce((sum, cat) => sum + cat.points, 0);

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
                            <div className="shrink-0 z-10 bg-white dark:bg-gray-900">
                                {/* Top section with gradient */}
                                <div className="relative py-4 px-6 bg-gradient-to-br from-purple-600 via-purple-500 to-violet-500 rounded-t-[32px]">
                                    {/* Close button */}
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-white" />
                                    </button>

                                    {/* Title */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-xl">stars</span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white">Love Points</h2>
                                            <p className="text-sm text-white/80">Your journey of love, quantified</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Points - Below header */}
                                <div className="text-center py-6 border-b border-gray-100 dark:border-gray-800">
                                    <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
                                        {totalPoints.toLocaleString()}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total Points Earned Together</div>
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
                                            className={`flex items-center gap-4 p-4 rounded-2xl ${cat.bgColor} border ${cat.borderColor}`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                                                <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {cat.label}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {cat.count} {cat.count === 1 ? cat.unit : cat.unit + 's'} × {cat.pointsPerUnit} pts
                                                </div>
                                            </div>

                                            {/* Points */}
                                            <div className={`text-2xl font-bold ${cat.textColor}`}>
                                                +{cat.points}
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                                            <span className="material-symbols-outlined text-3xl text-purple-500">stars</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">Start earning points!</p>
                                        <p className="text-sm text-gray-400 mt-1">Complete challenges and activities together</p>
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
    );
};
