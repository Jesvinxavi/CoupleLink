// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useRef, useState, useEffect, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Plus, Book, MapPin, Pencil, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateBadge } from "@/components/ui/DateBadge"
import { ImageCarousel } from "@/components/ui/ImageCarousel"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { useCoupleData } from "@/hooks/useCoupleData"
import { useJournalModals } from "@/context/JournalModalContext"
import { useJournalContext, type JournalEntry } from "@/context/JournalContext"
import { logger } from "@/lib/logger"

// Export imported type for compatibility if needed elsewhere, or rely on Context export
// export type { JournalEntry };



// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const EMOJI_OPTIONS = ["❤️", "😂", "😮", "😢", "👏"]
const PAGE_SIZE = 12

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function JournalFeed() {
    const { currentUser } = useCoupleData()
    const { openNewPost, openEditPost } = useJournalModals()
    const { entries, loading, toggleReaction } = useJournalContext()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    // Reaction State
    const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null) // Entry ID
    const [showAllEmojis, setShowAllEmojis] = useState(false)
    const pickerRef = useRef<HTMLDivElement>(null)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowReactionPicker(null)
                setShowAllEmojis(false)
            }
        }

        // Temporarily disabled verbose logging to allow debugging


        document.addEventListener("mousedown", handleClickOutside)
        // window.addEventListener('resize', handleResize);
        // window.visualViewport?.addEventListener('resize', handleVisualResize);
        // window.visualViewport?.addEventListener('scroll', handleVisualResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            // window.removeEventListener('resize', handleResize);
            // window.visualViewport?.removeEventListener('resize', handleVisualResize);
            // window.visualViewport?.removeEventListener('scroll', handleVisualResize);
        }
    }, [])

    useEffect(() => {
        return () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer)
            }
        }
    }, [longPressTimer])

    // ═══════════════════════════════════════
    // DERIVED DATA
    // ═══════════════════════════════════════
    const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])
    const filteredEntries = useMemo(() => {
        if (!normalizedQuery) return entries
        return entries.filter((entry) =>
            entry.title?.toLowerCase().includes(normalizedQuery)
        )
    }, [entries, normalizedQuery])

    const visibleEntries = useMemo(() => {
        return filteredEntries.slice(0, visibleCount)
    }, [filteredEntries, visibleCount])

    const canLoadMore = filteredEntries.length > visibleCount

    useEffect(() => {
        setVisibleCount(PAGE_SIZE)
    }, [normalizedQuery, entries.length])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════

    const handleEdit = (entry: JournalEntry) => {
        openEditPost(entry)
        setShowReactionPicker(null)
        setShowAllEmojis(false)
    }

    const handleTouchStart = (entryId: string) => {
        if (navigator.vibrate) navigator.vibrate(50)
        const timer = setTimeout(() => {
            setShowReactionPicker(entryId)
            if (navigator.vibrate) navigator.vibrate(50)
        }, 500) // 500ms long press
        setLongPressTimer(timer)
    }

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer)
            setLongPressTimer(null)
        }
    }

    const handleReaction = async (entryId: string, emoji: string) => {
        setShowReactionPicker(null)
        setShowAllEmojis(false)
        try {
            await toggleReaction(entryId, emoji)
        } catch (error) {
            logger.error("JournalFeed", "Failed to toggle reaction", error, { entryId, emoji })
        }
    }

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Wait for keyboard to slide up to prevent layout jumps/overscroll
        setTimeout(() => {
            e.target.scrollIntoView({ block: "center", behavior: "smooth" })
        }, 300)
    }

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredEntries.length))
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
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
                ) : filteredEntries.length === 0 ? (
                    <Card className="border-dashed border-2 border-gray-200 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <Book className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {entries.length === 0 ? "No journal entries yet" : "No matches found"}
                            </h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                {entries.length === 0
                                    ? "Be the first to write something special for your partner."
                                    : "Try a different search term to find older entries."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {(() => {
                            let lastMonthYear = ""

                            return visibleEntries.map((entry) => {
                                const date = new Date(entry.created_at)
                                const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" })
                                const showSeparator = monthYear !== lastMonthYear
                                if (showSeparator) {
                                    lastMonthYear = monthYear
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
                                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative ${showReactionPicker === entry.id ? 'select-text' : 'select-none'}`}
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
                        {canLoadMore && (
                            <div className="flex justify-center pt-4">
                                <Button variant="outline" onClick={handleLoadMore}>
                                    Load more ({visibleEntries.length} of {filteredEntries.length})
                                </Button>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}

