import { useRef, useState, useEffect } from 'react';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Book, MapPin, Pencil, Search } from 'lucide-react';
import { DateBadge } from '../ui/DateBadge';
import { ImageCarousel } from '../ui/ImageCarousel';
import { AnimatePresence, motion } from 'framer-motion';
import { UserAvatar } from '../ui/UserAvatar';
import { useJournalModals } from '../../context/JournalModalContext';
import { useJournalContext, type JournalEntry } from '../../context/JournalContext';

// Export imported type for compatibility if needed elsewhere, or rely on Context export
// export type { JournalEntry };

const logMetrics = (context: string) => {
    console.log(`[Journal] ${context} - Time: ${new Date().toISOString()}`);
    console.log(`[Journal] ${context} - window.innerHeight:`, window.innerHeight);
    if (window.visualViewport) {
        console.log(`[Journal] ${context} - visualViewport.height:`, window.visualViewport.height);
        console.log(`[Journal] ${context} - visualViewport.offsetTop:`, window.visualViewport.offsetTop);
        console.log(`[Journal] ${context} - visualViewport.pageTop:`, window.visualViewport.pageTop);
    }
    console.log(`[Journal] ${context} - document.documentElement.clientHeight:`, document.documentElement.clientHeight);
    console.log(`[Journal] ${context} - window.scrollY:`, window.scrollY);
    console.log(`[Journal] ${context} - body.style.overflow:`, document.body.style.overflow);
    console.log(`[Journal] ${context} - body.style.position:`, document.body.style.position);
    console.log(`[Journal] ${context} - body.style.height:`, document.body.style.height);
};

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '👏'];

export function JournalFeed() {
    const { currentUser } = useCoupleData();
    const { openNewPost, openEditPost } = useJournalModals();
    const { entries, loading, toggleReaction } = useJournalContext();

    const [searchQuery, setSearchQuery] = useState('');

    // Reaction State
    const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null); // Entry ID
    const [showAllEmojis, setShowAllEmojis] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(null);
                setShowAllEmojis(false);
            }
        };

        const handleResize = () => logMetrics('Window Resize');
        const handleVisualResize = () => logMetrics('VisualViewport Resize');

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('resize', handleVisualResize);
        window.visualViewport?.addEventListener('scroll', handleVisualResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('resize', handleVisualResize);
            window.visualViewport?.removeEventListener('scroll', handleVisualResize);
        };
    }, []);

    const handleEdit = (entry: JournalEntry) => {
        openEditPost(entry);
        setShowReactionPicker(null);
        setShowAllEmojis(false);
    };

    const handleTouchStart = (entryId: string) => {
        if (navigator.vibrate) navigator.vibrate(50);
        const timer = setTimeout(() => {
            setShowReactionPicker(entryId);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 500); // 500ms long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    const handleReaction = async (entryId: string, emoji: string) => {
        setShowReactionPicker(null);
        setShowAllEmojis(false);
        await toggleReaction(entryId, emoji);
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        logMetrics('Search Input Focus - Start');
        // Wait for keyboard to slide up to prevent layout jumps/overscroll
        setTimeout(() => {
            logMetrics('Search Input Focus - 300ms Delay');
            e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    };

    return (
        <div className="space-y-8">
            {/* Focus Mode Overlay */}
            <AnimatePresence>
                {showReactionPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => {
                            setShowReactionPicker(null);
                            setShowAllEmojis(false);
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Search and Create Post */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search Your Feed..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleInputFocus}
                        className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                </div>
                <Button
                    className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
                    onClick={() => {
                        openNewPost();
                    }}
                >
                    <Plus className="w-4 h-4" />
                    New Post
                </Button>
            </div>

            {/* Feed */}
            {
                loading ? (
                    <div className="space-y-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-16 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                                </div>
                                <div className="flex-1 h-40 bg-gray-200 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Book className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No journal entries yet</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                Be the first to write something special for your partner.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {(() => {
                            const filteredEntries = entries.filter(entry =>
                                !searchQuery || (entry.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                            );

                            let lastMonthYear = '';

                            return filteredEntries.map((entry) => {
                                const date = new Date(entry.created_at);
                                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                                const showSeparator = monthYear !== lastMonthYear;
                                if (showSeparator) {
                                    lastMonthYear = monthYear;
                                }

                                return (
                                    <div key={entry.id} className="space-y-2">
                                        {showSeparator && (
                                            <div className="flex items-center gap-4 pt-4 first:pt-0">
                                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {monthYear}
                                                </h2>
                                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                                            </div>
                                        )}

                                        <div className={`relative group transition-all duration-300 ${showReactionPicker === entry.id ? 'z-50 scale-105' : ''}`}>
                                            {/* Reactions Display */}
                                            {entry.reactions && entry.reactions.length > 0 && (
                                                <div className="absolute -top-3 -right-3 z-30 pointer-events-none drop-shadow-lg">
                                                    {Array.from(new Set(entry.reactions.map(r => r.emoji))).map((emoji, idx) => (
                                                        <div key={idx} className="text-5xl transform rotate-12">
                                                            {emoji}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div
                                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative"
                                                onTouchStart={() => handleTouchStart(entry.id)}
                                                onTouchEnd={handleTouchEnd}
                                                onMouseDown={() => handleTouchStart(entry.id)}
                                                onMouseUp={handleTouchEnd}
                                                onMouseLeave={handleTouchEnd}
                                            >


                                                <div className="p-5 space-y-2">
                                                    {/* Header: Date | Avatar | Title */}
                                                    {/* Header: Date | Avatar Row -> Title Row */}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <DateBadge
                                                                date={new Date(entry.created_at)}
                                                                className="w-10 h-11 shrink-0 scale-90 origin-left"
                                                            />

                                                            <UserAvatar
                                                                user={entry.profiles}
                                                                className="h-10 w-10 shadow-sm border border-gray-100 dark:border-gray-700"
                                                            />
                                                            {entry.location && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate max-w-[150px]">{entry.location}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 w-full">
                                                            {entry.title ? (
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight break-words">
                                                                    {entry.title}
                                                                </h3>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Untitled Memory</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Caption */}
                                                    {entry.caption && (
                                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                            {entry.caption}
                                                        </p>
                                                    )}

                                                    {/* Image Carousel - Moved Below Text */}
                                                    {entry.media_urls && entry.media_urls.length > 0 && (
                                                        <div className="w-full mt-4">
                                                            <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                                                                <ImageCarousel
                                                                    images={entry.media_urls}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reaction Picker Popover */}
                                            <AnimatePresence>
                                                {showReactionPicker === entry.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-100%" }}
                                                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-120%" }}
                                                        exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-100%" }}
                                                        className="absolute top-0 left-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
                                                        ref={pickerRef}
                                                    >
                                                        {!showAllEmojis ? (
                                                            <div className="flex gap-2 items-center">
                                                                {EMOJI_OPTIONS.map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReaction(entry.id, emoji);
                                                                        }}
                                                                        className={`w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-110 ${entry.reactions?.some(r => r.emoji === emoji && r.user_id === currentUser?.id)
                                                                            ? 'bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-500'
                                                                            : ''
                                                                            }`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShowAllEmojis(true);
                                                                    }}
                                                                >
                                                                    <Plus className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        handleEdit(entry);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-5 gap-2 p-1 max-h-48 overflow-y-auto w-64 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                                                {[...EMOJI_OPTIONS, '🥰', '😍', '😘', '🤗', '🤩', '🥳', '😎', '🥺', '😭', '😤', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleReaction(entry.id, emoji);
                                                                        }}
                                                                        className={`w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-110 ${entry.reactions?.some(r => r.emoji === emoji && r.user_id === currentUser?.id)
                                                                            ? 'bg-rose-100 dark:bg-rose-900/50 ring-2 ring-rose-500'
                                                                            : ''
                                                                            }`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )
            }
        </div >
    );
}

