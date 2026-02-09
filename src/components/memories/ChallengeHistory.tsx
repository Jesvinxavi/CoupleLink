// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, User, Heart, Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCoupleData } from "@/hooks/useCoupleData"
import { SexplorationHistorySection } from "@/components/memories/SexplorationHistory"


// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface HistoryItem {
    id: string
    title: string
    date: string
    type: "daily" | "weekly" | "monthly" | "question"
    myAnswer?: string | null
    partnerAnswer?: string | null
    category?: string
    description?: string
    photos?: string[]
    completedCount?: number
}

interface GroupedHistory {
    [monthYear: string]: {
        monthly: HistoryItem[]
        weekly: HistoryItem[]
        daily: HistoryItem[]
    }
}

const CHALLENGE_PAGE_SIZE = 8

// ═══════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════
const ChallengeCarousel = ({ items, onOpenDetails }: { items: HistoryItem[]; onOpenDetails: (item: HistoryItem) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [visibleCount, setVisibleCount] = useState(CHALLENGE_PAGE_SIZE)

    if (items.length === 0) return null

    useEffect(() => {
        setVisibleCount(CHALLENGE_PAGE_SIZE)
        setCurrentIndex(0)
    }, [items])

    const visibleItems = useMemo(() => {
        return items.slice(0, visibleCount)
    }, [items, visibleCount])

    const canLoadMore = items.length > visibleCount

    useEffect(() => {
        if (currentIndex >= visibleItems.length) {
            setCurrentIndex(0)
        }
    }, [currentIndex, visibleItems.length])

    const next = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % visibleItems.length)
    }

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length)
    }

    const currentItem = visibleItems[currentIndex]

    return (
        <div className="relative group w-full">
            <div className="overflow-hidden">
                <div className="transition-all duration-300 ease-in-out">
                    <HistoryCard
                        item={currentItem}
                        onClick={() => onOpenDetails(currentItem)}
                    />
                </div>
            </div>

            {/* Navigation & Dots */}
            {visibleItems.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                        onClick={prev}
                        className="p-1 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex justify-center gap-1.5">
                        {visibleItems.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex
                                    ? 'bg-rose-500'
                                    : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={next}
                        className="p-1 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Counter */}
            {visibleItems.length > 1 && (
                <div className="text-center text-xs text-gray-400 mt-1">
                    {currentIndex + 1} / {visibleItems.length}
                </div>
            )}

            {canLoadMore && (
                <div className="mt-3 flex justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setVisibleCount((prev) => Math.min(prev + CHALLENGE_PAGE_SIZE, items.length))
                        }}
                    >
                        Load more ({visibleItems.length} of {items.length})
                    </Button>
                </div>
            )}
        </div>
    )
}

const HistoryCard = ({ item, onClick }: { item: HistoryItem; onClick?: () => void }) => {
    return (
        <Card
            onClick={onClick}
            className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow h-full w-full ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize
                            ${item.type === 'question' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}
                        `}>
                            {item.type}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
                    {item.title}
                </CardTitle>

                {/* Green Bar for Completed Challenges */}
                {item.type !== 'question' && (
                    <div className={`mt-2 flex items-center gap-2 px-2 py-1 rounded-md w-fit ${item.completedCount && item.completedCount < 2
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-green-600 bg-green-50'
                        }`}>
                        <Trophy className="w-3 h-3" />
                        <span className="text-xs font-medium">
                            {item.completedCount && item.completedCount < 2 ? 'Partially Completed' : 'Challenge Completed'}
                        </span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0">
                {item.type === 'question' ? (
                    <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
                        <div className="p-4 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                                    <User className="w-3 h-3 text-rose-500" />
                                </div>
                                <span className="text-xs font-medium text-gray-500">You</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm">
                                {item.myAnswer || <span className="text-gray-400 italic">No answer</span>}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Heart className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-xs font-medium text-gray-500">Partner</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm">
                                {item.partnerAnswer || <span className="text-gray-400 italic">Waiting...</span>}
                            </p>
                        </div>
                    </div>
                ) : (
                    // Empty content for challenges as info is now in header
                    null
                )}
            </CardContent>
        </Card>
    )
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function ChallengeHistory() {
    const { couple } = useCoupleData()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({})
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [expandedYears, setExpandedYears] = useState<string[]>([])

    const sortedMonths = useMemo(() => Object.keys(groupedHistory).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    ), [groupedHistory])

    // Group months by year
    const monthsByYear = useMemo(() => sortedMonths.reduce((acc, monthYear) => {
        const year = monthYear.split(" ")[1]
        if (!acc[year]) acc[year] = []
        acc[year].push(monthYear)
        return acc
    }, {} as Record<string, string[]>), [sortedMonths])

    const sortedYears = useMemo(() => Object.keys(monthsByYear).sort((a, b) => Number(b) - Number(a)), [monthsByYear])

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        if (sortedYears.length > 0) {
            // Default to expanding the current year (first one)
            setExpandedYears((prev) => (prev.length ? prev : [sortedYears[0]]))
        }
    }, [sortedYears])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const toggleYear = (year: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedYears((prev) =>
            prev.includes(year) ? [] : [year]
        )
    }

    const fetchHistory = useCallback(async () => {
        if (!couple) return
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const [
                { data: answers, error: answersError },
                { data: memories, error: memoriesError }
            ] = await Promise.all([
                supabase
                    .from("user_answers")
                    .select("activity_id, created_at, user_id, answer_text, activities(content, category)")
                    .eq("couple_id", couple.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("memories")
                    .select("id, caption, created_at, metadata, media_urls")
                    .eq("couple_id", couple.id)
                    .eq("type", "challenge")
                    .order("created_at", { ascending: false })
            ])

            // 1. Fetch Daily Questions (user_answers)
            let questionItems: HistoryItem[] = []
            if (!answersError && answers) {
                const grouped = new Map<string, HistoryItem>()
                answers.forEach((ans: any) => {
                    const activityId = ans.activity_id
                    if (!activityId) return

                    if (!grouped.has(activityId)) {
                        grouped.set(activityId, {
                            id: activityId,
                            title: ans.activities?.content?.question || "Daily Question",
                            date: ans.created_at,
                            type: "question",
                            category: ans.activities?.category || "fun",
                            myAnswer: null,
                            partnerAnswer: null
                        })
                    }

                    const item = grouped.get(activityId)!
                    if (ans.user_id === user.id) item.myAnswer = ans.answer_text
                    else item.partnerAnswer = ans.answer_text
                })
                questionItems = Array.from(grouped.values())
            }

            // 2. Fetch Completed Challenges (memories)
            let challengeItems: HistoryItem[] = []
            if (!memoriesError && memories) {
                challengeItems = memories.map((mem: any) => ({
                    id: mem.id,
                    title: mem.caption || "Challenge",
                    date: mem.created_at,
                    type: mem.metadata?.frequency || "daily",
                    description: mem.caption,
                    photos: mem.media_urls || [],
                    completedCount: mem.metadata?.completed_count ?? 2
                }))
            }

            // Combine all history items
            const allItems = [...questionItems, ...challengeItems]

            // Group by month-year and type
            const grouped = allItems.reduce((acc, item) => {
                const monthYear = new Date(item.date).toLocaleString("default", { month: "long", year: "numeric" })
                if (!acc[monthYear]) {
                    acc[monthYear] = { monthly: [], weekly: [], daily: [] }
                }

                if (item.type === "question") {
                    acc[monthYear].daily.push(item)
                } else {
                    acc[monthYear][item.type].push(item)
                }
                return acc
            }, {} as GroupedHistory)

            setGroupedHistory(grouped)
            setCurrentMonthIndex(0)
        } catch (err) {
            logger.error("ChallengeHistory", "Error fetching history", err)
        } finally {
            setLoading(false)
        }
    }, [couple])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent shadow-sm"></div>
                <p className="mt-4 text-gray-400 font-medium">Gathering your memories...</p>
            </div>
        );
    }

    if (Object.keys(groupedHistory).length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                <Heart className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No memories yet</h3>
                <p className="text-gray-500 mt-1">Complete daily challenges to build your history!</p>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* Month Navigation & Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 min-h-[600px]">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                    <div className="relative">
                        <h2
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 cursor-pointer transition-colors select-none"
                        >
                            {sortedMonths[currentMonthIndex]}
                            <motion.div
                                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-6 h-6 text-gray-400" />
                            </motion.div>
                        </h2>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <>
                                    {/* Backdrop for clicking outside */}
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="absolute top-full left-0 mt-2 z-40 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-100 dark:border-gray-600 overflow-hidden min-w-[180px]"
                                    >
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {sortedYears.map((year) => {
                                                const isExpanded = expandedYears.includes(year);
                                                return (
                                                    <div key={year}>
                                                        <div
                                                            onClick={(e) => toggleYear(year, e)}
                                                            className={`px-4 py-2 flex items-center justify-between cursor-pointer transition-colors
                                                                ${isExpanded
                                                                    ? 'bg-rose-500 text-white'
                                                                    : 'text-gray-900 dark:text-white active:bg-gray-50 dark:active:bg-gray-600/50 md:hover:bg-gray-50 md:dark:hover:bg-gray-600/50'
                                                                }
                                                            `}
                                                        >
                                                            <span className="text-sm font-bold">{year}</span>
                                                            {isExpanded ?
                                                                <ChevronUp className="w-4 h-4 text-white" /> :
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            }
                                                        </div>

                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden bg-gray-50 dark:bg-gray-800/50"
                                                                >
                                                                    {monthsByYear[year].map((month) => {
                                                                        const globalIdx = sortedMonths.indexOf(month);
                                                                        const isSelected = currentMonthIndex === globalIdx;

                                                                        return (
                                                                            <button
                                                                                key={month}
                                                                                onClick={() => {
                                                                                    setCurrentMonthIndex(globalIdx);
                                                                                    setIsDropdownOpen(false);
                                                                                }}
                                                                                className={`w-full text-left px-4 py-2 text-sm transition-colors pl-6
                                                                                    ${isSelected
                                                                                        ? 'font-bold text-gray-900 dark:text-white bg-rose-50 dark:bg-rose-900/20'
                                                                                        : 'text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700/50 md:hover:bg-gray-100 md:dark:hover:bg-gray-700/50'
                                                                                    }
                                                                                `}
                                                                            >
                                                                                {month.split(' ')[0]} {/* Show only month name inside year group */}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                        <button
                            onClick={() => setCurrentMonthIndex(prev => Math.min(prev + 1, sortedMonths.length - 1))}
                            disabled={currentMonthIndex >= sortedMonths.length - 1}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
                        <button
                            onClick={() => setCurrentMonthIndex(prev => Math.max(prev - 1, 0))}
                            disabled={currentMonthIndex <= 0}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {(() => {
                    const monthYear = sortedMonths[currentMonthIndex];
                    const categories = groupedHistory[monthYear];

                    if (!categories) return null;

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 lg:gap-8">
                            {/* Challenges Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" />
                                    Challenges
                                </h3>

                                <Tabs defaultValue="daily" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="daily" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">Daily</TabsTrigger>
                                        <TabsTrigger value="weekly" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">Weekly</TabsTrigger>
                                        <TabsTrigger value="monthly" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">Monthly</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="daily" className="space-y-4">
                                        {categories.daily.length > 0 ? (
                                            <ChallengeCarousel items={categories.daily} onOpenDetails={setSelectedItem} />
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No daily challenges completed this month.</p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="weekly" className="space-y-4">
                                        {categories.weekly.length > 0 ? (
                                            <ChallengeCarousel items={categories.weekly} onOpenDetails={setSelectedItem} />
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No weekly challenges completed this month.</p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="monthly" className="space-y-4">
                                        {categories.monthly.length > 0 ? (
                                            <div className="grid gap-4">
                                                {categories.monthly.map(item => (
                                                    <HistoryCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No monthly challenges completed this month.</p>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Sexploration History Section */}
                            <div className="h-full">
                                <SexplorationHistorySection monthYear={monthYear} />
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Challenge Details Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="w-[90%] sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto p-4 gap-0">
                    <DialogHeader className="text-left space-y-0">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0
                                ${selectedItem?.type === 'question' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}
                            `}>
                                {selectedItem?.type}
                            </span>
                            <Calendar className="w-3.5 h-3.5" />
                            {selectedItem && new Date(selectedItem.date).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {selectedItem?.title}
                        </DialogTitle>
                        {selectedItem?.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {selectedItem.description}
                            </p>
                        )}
                    </DialogHeader>

                    <div className="space-y-6 mt-6">
                        {/* Photos */}
                        {selectedItem?.photos && selectedItem.photos.length > 0 ? (
                            <div>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedItem.photos.map((photo, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            <img
                                                src={photo}
                                                alt={`Challenge photo ${idx + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : selectedItem?.type !== 'question' && (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 text-sm">No photos added for this challenge.</p>
                            </div>
                        )}

                        {/* Question Answers (if applicable) */}
                        {selectedItem?.type === 'question' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-rose-500" />
                                        <span className="font-medium text-rose-700 dark:text-rose-300">You</span>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 text-sm">
                                        {selectedItem.myAnswer || "No answer"}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Heart className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-blue-700 dark:text-blue-300">Partner</span>
                                    </div>
                                    <p className="text-gray-800 dark:text-gray-200 text-sm">
                                        {selectedItem.partnerAnswer || "Waiting..."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
