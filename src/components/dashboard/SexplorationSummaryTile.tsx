import { motion } from 'framer-motion';
import { useFantasyBucketList } from '../../hooks/useFantasyBucketList';
import { useCoupons } from '../../hooks/useCoupons';
import { getPositionOfTheWeek } from '../../data/positionsData';
import { PositionSVG } from '../sexploration/PositionSVG';
import { Ticket } from 'lucide-react';
import { useSexplorationModals } from '@/context/SexplorationModalContext';

export function SexplorationSummaryTile() {
    const { approvedCount, pendingCount, completedCount } = useFantasyBucketList();
    const { coupons } = useCoupons();
    const { openWallet, openPositions, openFantasies } = useSexplorationModals();
    const positionOfTheWeek = getPositionOfTheWeek();

    // Count active (available) coupons
    const availableVouchers = coupons.filter(c =>
        (c.status === 'active' || !c.status) && !c.redeemed_at
    ).length;

    return (
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 h-full hover:shadow-md transition-all relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
        >
            <div className="flex h-full">
                {/* Vouchers Section - 1/3 */}
                <button
                    onClick={openWallet}
                    className="flex-1 px-2 flex flex-col items-center border-r border-gray-100 dark:border-gray-700 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 rounded-l-2xl transition-colors cursor-pointer text-center"
                >
                    <div className="flex items-center justify-center gap-1.5 w-full pt-1 mb-2">
                        <span className="text-pink-500 bg-pink-100 dark:bg-pink-900/30 p-1.5 rounded-lg">
                            <Ticket className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Vouchers
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full pb-1">
                        {availableVouchers > 0 ? (
                            <>
                                <div className="relative">
                                    <span className="text-2xl font-bold text-pink-500 dark:text-pink-400">
                                        {availableVouchers}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                                    Available
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                                    0
                                </span>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                                    Available
                                </p>
                            </>
                        )}
                    </div>
                </button>

                {/* Fantasy Count - 1/3 */}
                <button
                    onClick={openFantasies}
                    className="flex-1 px-2 flex flex-col items-center border-r border-gray-100 dark:border-gray-700 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors cursor-pointer text-center"
                >
                    <div className="flex items-center justify-center gap-1.5 w-full pt-1 mb-2">
                        <span className="material-symbols-outlined text-pink-500 bg-pink-100 dark:bg-pink-900/30 p-1.5 rounded-lg text-xs">
                            auto_awesome
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fantasies
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full pb-1">
                        {pendingCount > 0 ? (
                            <>
                                <div className="relative">
                                    <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                                        {pendingCount}
                                    </span>
                                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                                    Pending
                                </p>
                            </>
                        ) : approvedCount > 0 ? (
                            <>
                                <div className="relative">
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {approvedCount}
                                    </span>
                                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                                    Approved
                                </p>
                            </>
                        ) : completedCount > 0 ? (
                            <>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {completedCount}
                                </span>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                                    Completed
                                </p>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-2xl text-gray-300 mb-0.5">
                                    add_circle
                                </span>
                                <p className="text-[10px] text-gray-400 mt-2 text-center leading-tight">
                                    Add
                                </p>
                            </>
                        )}
                    </div>
                </button>

                {/* Position of the Week - 1/3 */}
                <button
                    onClick={openPositions}
                    className="flex-1 px-2 flex flex-col items-center hover:bg-pink-50/50 dark:hover:bg-pink-900/10 rounded-r-2xl transition-colors cursor-pointer text-center"
                >
                    <div className="flex items-center justify-center gap-1.5 w-full pt-1 mb-2">
                        <span className="material-symbols-outlined text-pink-500 bg-pink-100 dark:bg-pink-900/30 p-1.5 rounded-lg text-xs">
                            explore
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Position
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full pb-1">
                        <PositionSVG position={positionOfTheWeek} size="xs" className="mt-1" />
                        <p className="font-bold text-gray-900 dark:text-white text-[10px] mt-2 text-center line-clamp-1">
                            {positionOfTheWeek.name}
                        </p>
                    </div>
                </button>
            </div>
        </motion.div>
    );
}
