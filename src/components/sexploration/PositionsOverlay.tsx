import { useState, useEffect, useRef } from 'react';
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
    onFocusChange?: (isFocused: boolean) => void;
}

export function PositionsOverlay({ isOpen, onClose, isPositionCompleted, togglePositionComplete, onFocusChange }: PositionsOverlayProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Mobile Viewport Logic
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    // Combined body lock + viewport resize handler (matches FantasyBucketListOverlay)
    useEffect(() => {
        if (!isOpen) return;

        // Robust Body Lock (save scroll position)
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Handle Visual Viewport for mobile keyboard
        const handleVisualResize = () => {
            // Only update if focus is within this overlay
            const activeEl = document.activeElement;
            const isActiveInOverlay = overlayRef.current?.contains(activeEl);
            const isTextInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

            // Exclude input types that don't trigger keyboard
            const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'file'];
            const isNonKeyboardInput = activeEl?.tagName === 'INPUT' &&
                nonKeyboardInputTypes.includes((activeEl as HTMLInputElement).type);

            // Only update if a keyboard-triggering text input in our overlay is focused
            if (!isActiveInOverlay || !isTextInput || isNonKeyboardInput) {
                return;
            }

            if (window.visualViewport) {
                setViewportStyle({
                    height: window.visualViewport.height,
                    top: window.visualViewport.offsetTop
                });
            }
        };

        window.visualViewport?.addEventListener('resize', handleVisualResize);
        window.visualViewport?.addEventListener('scroll', handleVisualResize);
        handleVisualResize();

        return () => {
            const topStyle = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';

            // Restore scroll position
            window.scrollTo(0, parseInt(topStyle || '0') * -1);

            window.visualViewport?.removeEventListener('resize', handleVisualResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualResize);
        };
    }, [isOpen]); // Only depends on isOpen

    const handleClose = () => {
        setSearchQuery(''); // Reset search
        onClose();
    };

    const handleOverlayFocus = (e: React.FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const isTextInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

        // Exclude input types that don't trigger keyboard
        const nonKeyboardInputTypes = ['date', 'time', 'datetime-local', 'month', 'week', 'color', 'file'];
        const isNonKeyboardInput = target.tagName === 'INPUT' && nonKeyboardInputTypes.includes(target.type);

        // Skip if not a text input or if it's a non-keyboard input type
        if (!isTextInput || isNonKeyboardInput) {
            return;
        }

        if (overlayRef.current && window.visualViewport) {
            // Measure-Lock-Animate pattern
            const rect = overlayRef.current.getBoundingClientRect();
            setViewportStyle({ height: rect.height, top: rect.top });
            setIsSearchFocused(true);
            if (onFocusChange) onFocusChange(true);

            // Animate to target visual viewport in next frame
            requestAnimationFrame(() => {
                setViewportStyle({
                    height: window.visualViewport!.height,
                    top: window.visualViewport!.offsetTop
                });
            });
        } else {
            setIsSearchFocused(true);
            if (onFocusChange) onFocusChange(true);
        }

        // Smart scroll - only if not fully visible
        setTimeout(() => {
            const scrollContainer = overlayRef.current?.querySelector('.flex-1.overflow-y-auto');
            if (scrollContainer && target) {
                const targetRect = target.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();

                const isFullyVisible =
                    targetRect.top >= containerRect.top &&
                    targetRect.bottom <= containerRect.bottom;

                if (!isFullyVisible) {
                    const targetTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
                    scrollContainer.scrollTo({
                        top: Math.max(0, targetTop - 20), // 20px padding from top
                        behavior: 'smooth'
                    });
                }
            }
        }, 350);
    };

    const handleOverlayBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as Node | null;
        const isStillInOverlay = overlayRef.current?.contains(relatedTarget);

        if (isStillInOverlay) return;

        setIsSearchFocused(false);
        if (onFocusChange) onFocusChange(false);
        setViewportStyle(undefined);
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
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                            onClick={handleClose}
                            style={{ touchAction: 'none' }}
                        />

                        {/* Slide-up Overlay */}
                        <motion.div
                            ref={overlayRef}
                            onFocus={handleOverlayFocus}
                            onBlur={handleOverlayBlur}
                            initial={{ y: '100%' }}
                            animate={{
                                y: 0,
                                height: isSearchFocused && viewportStyle ? viewportStyle.height : 'auto',
                                top: isSearchFocused && viewportStyle ? viewportStyle.top : 'auto'
                            }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                            className="fixed inset-x-0 bottom-0 z-[61] outline-none"
                            style={{
                                maxHeight: isSearchFocused ? 'none' : 'calc(100dvh - 70px)'
                            }}
                        >
                            {/* The Skirt - synced background extension */}
                            <div className="absolute top-full inset-x-0 h-[100vh] bg-rose-50 dark:bg-gray-900" />

                            {/* Inner Card - Appearance & Clipping */}
                            <div
                                className={`flex flex-col w-full overflow-hidden bg-rose-50 dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] transition-all duration-300 ${isSearchFocused ? 'h-full' : ''}`}
                                style={{
                                    maxHeight: isSearchFocused ? 'none' : 'calc(100dvh - 70px)'
                                }}
                            >
                                {/* Header */}
                                <div className="shrink-0 z-10 overflow-hidden">
                                    {/* Title Section */}
                                    <div className="bg-rose-50 dark:bg-gray-900 px-6 py-4">
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

                                    {/* Search Section */}
                                    <div className="px-6 pt-6 pb-2 bg-rose-50 dark:bg-gray-900">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <Input
                                                placeholder="Search positions..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
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
                                <div className="flex-1 overflow-y-auto p-6 min-h-0 scroll-smooth overscroll-contain">
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
