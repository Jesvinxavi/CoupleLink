import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { POSITION_CATEGORIES } from '../../data/positionsData';
import type { Position } from '../../data/positionsData';
import { PositionSVG } from './PositionSVG';
import { ArrowLeft } from 'lucide-react';

interface PositionDetailModalProps {
    position: Position | null;
    isOpen: boolean;
    onClose: () => void;
    isCompleted: boolean;
    onToggleComplete: () => void;
}

export function PositionDetailModal({
    position,
    isOpen,
    onClose,
    isCompleted,
    onToggleComplete,
}: PositionDetailModalProps) {
    if (!position) return null;

    const category = POSITION_CATEGORIES[position.category];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-xl overflow-hidden bg-rose-50 dark:bg-gray-900 border-none [&>button]:hidden" hideClose={true}>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2 flex-1">
                            <DialogTitle className="text-lg">{position.name}</DialogTitle>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-medium">
                                <span className="material-symbols-outlined text-xs">{category?.icon}</span>
                                {category?.name}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Illustration */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex justify-center"
                    >
                        <PositionSVG position={position} size="lg" />
                    </motion.div>

                    {/* Description */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">How to</h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {position.description}
                        </p>
                    </div>

                    {/* Complete Button */}
                    <div className="space-y-2">
                        <Button
                            onClick={onToggleComplete}
                            className={`w-full py-6 text-lg font-semibold rounded-xl transition-all ${isCompleted
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
                                }`}
                        >
                            {isCompleted ? (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Completed!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined">add_task</span>
                                    Mark as Complete
                                </span>
                            )}
                        </Button>
                        {!isCompleted && (
                            <p className="text-center text-xs text-gray-400">
                                Completing earns +5 Love Points!
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
