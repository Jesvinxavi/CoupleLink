import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { positions, POSITION_CATEGORIES } from '../../data/positionsData';
import type { Position } from '../../data/positionsData';
import { PositionSVG } from './PositionSVG';
import { PositionDetailModal } from './PositionDetailModal';

interface PositionsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    isPositionCompleted: (id: string) => boolean;
    togglePositionComplete: (id: string) => Promise<void>;
}

export function PositionsOverlay({ isOpen, onClose, isPositionCompleted, togglePositionComplete }: PositionsOverlayProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

    // Mobile Viewport Logic
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';

            // Handle Visual Viewport for mobile keyboard
            const handleResize = () => {
                if (window.visualViewport) {
                    setViewportStyle({
                        height: window.visualViewport.height,
                        top: window.visualViewport.offsetTop
                    });
                }
            };

            window.visualViewport?.addEventListener('resize', handleResize);
            window.visualViewport?.addEventListener('scroll', handleResize);

            // Initial set
            handleResize();

            return () => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }
    }, [isOpen]);

    const handleClose = () => {
        setSearchQuery(''); // Reset search
        onClose();
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsSearchFocused(true);
        // Wait for keyboard to slide up
        setTimeout(() => {
            e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    };

    const handleInputBlur = () => {
        setIsSearchFocused(false);
    };

    const filteredPositions = positions.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedPositions = Object.entries(POSITION_CATEGORIES).map(([key, category]) => ({
        key,
        ...category,
        positions: filteredPositions.filter(p => p.category === key),
    })).filter(group => group.positions.length > 0);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={handleClose}
                        />

                        {/* Slide-up Panel */}
                        <motion.div
                            layout
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                            // Force height/top to match viewport to snap to visible area
                            // ONLY when search is focused (keyboard likely open)
                            style={isSearchFocused && viewportStyle ? {
                                height: `${viewportStyle.height}px`,
                                top: `${viewportStyle.top}px`
                            } : { height: 'auto', maxHeight: 'calc(100dvh - 70px)' }}
                            className={`fixed inset-x-0 z-50 bg-rose-50 dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col ${isSearchFocused && viewportStyle ? '' : 'bottom-0'}`}
                        >
                            {/* Header */}
                            <div className="shrink-0 z-10">
                                {/* Title Section - White */}
                                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-t-3xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                                <span className="material-symbols-outlined text-white">explore</span>
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Position Explorer</h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Discover new positions</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleClose}
                                            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Search Section - Pink (matches body) */}
                                <div className="px-6 pt-6 pb-2 bg-rose-50 dark:bg-gray-900">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                        <Input
                                            placeholder="Search positions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={handleInputFocus}
                                            onBlur={handleInputBlur}
                                            className="pl-9 pr-9 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 transition-colors"
                                        />
                                        {searchQuery && (
                                            <button
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur so click registers
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                <AnimatePresence mode="wait">
                                    {groupedPositions.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-12 text-center"
                                        >
                                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
                                                search_off
                                            </span>
                                            <p className="text-gray-500">No positions found</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-6"
                                        >
                                            {groupedPositions.map(group => (
                                                <div key={group.key}>
                                                    {/* Category Header */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="material-symbols-outlined text-pink-500 text-lg">
                                                            {group.icon}
                                                        </span>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                                                            {group.name}
                                                        </h3>
                                                        <span className="text-xs text-gray-400">
                                                            ({group.positions.filter(p => isPositionCompleted(p.id)).length}/{group.positions.length})
                                                        </span>
                                                    </div>

                                                    {/* Position Grid */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {group.positions.map(position => {
                                                            const completed = isPositionCompleted(position.id);
                                                            return (
                                                                <motion.button
                                                                    key={position.id}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur so click registers
                                                                    onClick={() => setSelectedPosition(position)}
                                                                    className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${completed
                                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                                                                        }`}
                                                                >
                                                                    {completed && (
                                                                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                            <span className="text-white text-xs">✓</span>
                                                                        </div>
                                                                    )}
                                                                    <PositionSVG position={position} size="sm" />
                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 text-center line-clamp-2">
                                                                        {position.name}
                                                                    </span>
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Detail Modal */}
            <PositionDetailModal
                position={selectedPosition}
                isOpen={!!selectedPosition}
                onClose={() => setSelectedPosition(null)}
                isCompleted={selectedPosition ? isPositionCompleted(selectedPosition.id) : false}
                onToggleComplete={() => selectedPosition && togglePositionComplete(selectedPosition.id)}
            />
        </>
    );
}
