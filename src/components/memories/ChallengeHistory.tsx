import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, User, Heart, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { SexplorationHistorySection } from './SexplorationHistory';


interface HistoryItem {
    id: string;
    title: string;
    date: string;
    type: 'daily' | 'weekly' | 'monthly' | 'question';
    myAnswer?: string | null;
    partnerAnswer?: string | null;
    category?: string;
    description?: string;
    photos?: string[];
    completedCount?: number;
}

interface GroupedHistory {
    [monthYear: string]: {
        monthly: HistoryItem[];
        weekly: HistoryItem[];
        daily: HistoryItem[];
    };
}

const ChallengeCarousel = ({ items, onOpenDetails }: { items: HistoryItem[], onOpenDetails: (item: HistoryItem) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (items.length === 0) return null;

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const currentItem = items[currentIndex];

    return (
        <div className="relative group w-full">
            <div className="overflow-hidden">
                <div className="transition-all duration-300 ease-in-out">
                    <HistoryCard
                        item={currentItem}
                        onNext={items.length > 1 ? next : undefined}
                        onPrev={items.length > 1 ? prev : undefined}
                        onClick={() => onOpenDetails(currentItem)}
                    />
                </div>
            </div>

            {/* Dots */}
            {items.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {items.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex
                                ? 'bg-rose-500'
                                : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Counter */}
            {items.length > 1 && (
                <div className="text-center text-xs text-gray-400 mt-1">
                    {currentIndex + 1} / {items.length}
                </div>
            )}
        </div>
    );
};

const HistoryCard = ({ item, onNext, onPrev, onClick }: { item: HistoryItem; onNext?: (e: React.MouseEvent) => void; onPrev?: (e: React.MouseEvent) => void; onClick?: () => void }) => {
    return (
        <Card
            onClick={onClick}
            className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow h-full w-full ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 pb-4">
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

                    {/* Navigation Arrows */}
                    {onNext && onPrev && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={onPrev}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onNext}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
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
    );
};

export function ChallengeHistory() {
    const { couple } = useCoupleData();
    const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                if (!user || !couple) return;

                // 1. Fetch Daily Questions (user_answers)
                let questionItems: HistoryItem[] = [];
                const { data: answers, error: answersError } = await supabase
                    .from('user_answers')
                    .select(`*, activities(*)`)
                    .eq('couple_id', couple.id)
                    .order('created_at', { ascending: false });

                if (!answersError && answers) {
                    const grouped = new Map<string, HistoryItem>();
                    answers.forEach((ans: any) => {
                        const activityId = ans.activity_id;
                        if (!activityId) return;

                        if (!grouped.has(activityId)) {
                            grouped.set(activityId, {
                                id: activityId,
                                title: ans.activities?.content?.question || 'Daily Question',
                                date: ans.created_at,
                                type: 'question',
                                category: ans.activities?.category || 'fun',
                                myAnswer: null,
                                partnerAnswer: null
                            });
                        }

                        const item = grouped.get(activityId)!;
                        if (ans.user_id === user.id) item.myAnswer = ans.answer_text;
                        else item.partnerAnswer = ans.answer_text;
                    });
                    questionItems = Array.from(grouped.values());
                }

                // 2. Fetch Completed Challenges (memories)
                let challengeItems: HistoryItem[] = [];
                const { data: memories, error: memoriesError } = await supabase
                    .from('memories')
                    .select('*')
                    .eq('couple_id', couple.id)
                    .eq('type', 'challenge')
                    .order('created_at', { ascending: false });

                if (!memoriesError && memories) {
                    // Group by title to combine partner entries if needed, 
                    // but usually challenges are individual completions. 
                    // However, we want to show photos from both if they did the same challenge around the same time.
                    // Given the requirement "photos associated (from both partners)", we should group by title + date(approx).

                    const groupedChallenges = new Map<string, HistoryItem>();
                    memories.forEach((mem: any) => {
                        const dateKey = mem.created_at.split('T')[0];
                        const key = `${mem.title}-${dateKey}`;

                        if (!groupedChallenges.has(key)) {
                            // Try to get type from metadata
                            let type = mem.metadata?.challenge_type;

                            // If not in metadata, default to daily or infer from other means if possible
                            if (!type) {
                                type = 'daily';
                            }

                            groupedChallenges.set(key, {
                                id: mem.id,
                                title: mem.title,
                                date: mem.created_at,
                                type: type as 'daily' | 'weekly' | 'monthly',
                                description: mem.caption,
                                photos: []
                            });
                        }

                        const item = groupedChallenges.get(key)!;
                        if (mem.media_url) {
                            item.photos?.push(mem.media_url);
                        }
                    });

                    challengeItems = Array.from(groupedChallenges.values());

                    // Count unique uploaders per challenge group
                    console.log('[DEBUG-HISTORY] Raw Memories:', memories.length);
                    memories.forEach((mem: any) => {
                        const dateKey = mem.created_at.split('T')[0];
                        const key = `${mem.title}-${dateKey}`;

                        if (groupedChallenges.has(key)) {
                            const item = groupedChallenges.get(key)!;
                            // We re-use 'completedCount' as a set of uploaders first, then convert to number
                            if (!item.completedCount) item.completedCount = 0; // Initialize
                        }
                    });

                    // Second pass to count unique uploaders
                    const uploaderSets = new Map<string, Set<string>>();
                    memories.forEach((mem: any) => {
                        const dateKey = mem.created_at.split('T')[0];
                        const key = `${mem.title}-${dateKey}`;
                        if (!uploaderSets.has(key)) uploaderSets.set(key, new Set());
                        if (mem.uploader_id) uploaderSets.get(key)?.add(mem.uploader_id);

                        // Debug log for photos
                        if (mem.media_url) console.log('[DEBUG-HISTORY] Found photo for:', key, mem.media_url);
                        else console.log('[DEBUG-HISTORY] No photo for:', key);
                    });

                    challengeItems.forEach(item => {
                        // We reconstruct 'key' or just map back... 
                        // Actually simpler to just filter memories for this item
                        // This is O(N*M) but N matches is small.
                        // Let's use the map we just built.
                        const dateKey = item.date.split('T')[0];
                        const key = `${item.title}-${dateKey}`;
                        item.completedCount = uploaderSets.get(key)?.size || 0;
                        console.log('[DEBUG-HISTORY] Item:', item.title, 'CompletedCount:', item.completedCount, 'Photos:', item.photos);
                    });
                }

                // 3. Merge and Group
                const merged = [...challengeItems, ...questionItems].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                const grouped: GroupedHistory = {};

                merged.forEach(item => {
                    const date = new Date(item.date);
                    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

                    if (!grouped[monthYear]) {
                        grouped[monthYear] = {
                            monthly: [],
                            weekly: [],
                            daily: []
                        };
                    }

                    if (item.type === 'monthly') {
                        grouped[monthYear].monthly.push(item);
                    } else if (item.type === 'weekly') {
                        grouped[monthYear].weekly.push(item);
                    } else {
                        grouped[monthYear].daily.push(item);
                    }
                });

                setGroupedHistory(grouped);

            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [couple]);

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
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

    return (
        <div className="space-y-6">
            {Object.entries(groupedHistory).map(([monthYear, categories]) => (
                <div key={monthYear} className="space-y-6 bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        {monthYear}
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-0 lg:gap-8">
                        {/* Challenges Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Challenges
                            </h3>

                            <Tabs defaultValue="daily" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="daily">Daily</TabsTrigger>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
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
                </div>
            ))}

            {/* Challenge Details Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="w-[90%] sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-left space-y-0">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Calendar className="w-4 h-4" />
                            {selectedItem && new Date(selectedItem.date).toLocaleDateString(undefined, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
