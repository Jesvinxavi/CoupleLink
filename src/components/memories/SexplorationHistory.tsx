import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar, ChevronLeft, ChevronRight, Ticket, Sparkles, Heart, Flame } from 'lucide-react';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { positions } from '../../data/positionsData';
import { PositionSVG } from '../sexploration/PositionSVG';

interface SexplorationHistoryItem {
    id: string;
    title: string;
    description?: string;
    date: string;
    type: 'voucher' | 'fantasy' | 'position';
    category?: string;
}

interface GroupedSexplorationHistory {
    [monthYear: string]: {
        vouchers: SexplorationHistoryItem[];
        fantasies: SexplorationHistoryItem[];
        positions: SexplorationHistoryItem[];
    };
}

const SexplorationCarousel = ({
    items,
    onOpenDetails,
    type
}: {
    items: SexplorationHistoryItem[],
    onOpenDetails: (item: SexplorationHistoryItem) => void,
    type: 'voucher' | 'fantasy' | 'position'
}) => {
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
                    <SexplorationCard
                        item={currentItem}
                        onClick={() => onOpenDetails(currentItem)}
                        type={type}
                    />
                </div>
            </div>

            {/* Navigation & Dots */}
            {items.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                        onClick={prev}
                        className="p-1 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex justify-center gap-1.5">
                        {items.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex
                                    ? 'bg-pink-500'
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
            {items.length > 1 && (
                <div className="text-center text-xs text-gray-400 mt-1">
                    {currentIndex + 1} / {items.length}
                </div>
            )}
        </div>
    );
};

const SexplorationCard = ({
    item,
    onClick,
    type
}: {
    item: SexplorationHistoryItem;
    onClick?: () => void;
    type: 'voucher' | 'fantasy' | 'position';
}) => {
    const getIcon = () => {
        switch (type) {
            case 'voucher': return <Ticket className="w-4 h-4 text-pink-500" />;
            case 'fantasy': return <Sparkles className="w-4 h-4 text-amber-500" />;
            case 'position':
                if (position) return <PositionSVG position={position} size="xs" className="!bg-transparent" />; // Use xs size and transparent bg for icon usage
                return <Heart className="w-4 h-4 text-rose-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'voucher': return 'bg-pink-100 text-pink-600';
            case 'fantasy': return 'bg-amber-100 text-amber-600';
            case 'position': return 'bg-rose-100 text-rose-600';
        }
    };

    const position = type === 'position' ? positions.find(p => p.id === item.id) : null;

    return (
        <Card
            onClick={onClick}
            className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow h-full w-full ${onClick ? 'cursor-pointer' : ''}`}
        >
            <CardHeader className={`bg-white dark:bg-gray-800 p-4 ${type !== 'position' ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getBgColor()}`}>
                            {type}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {getIcon()}
                    {item.title}
                </CardTitle>
            </CardHeader>
            {type !== 'position' && (
                <CardContent className="p-4 bg-white dark:bg-gray-800">
                    {item.description ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {item.description}
                        </p>
                    ) : (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                            <Heart className="w-3 h-3" />
                            <span className="text-xs font-medium">Completed</span>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
};

interface SexplorationHistoryProps {
    monthYear: string;
}

export function SexplorationHistorySection({ monthYear }: SexplorationHistoryProps) {
    const { couple } = useCoupleData();
    const [history, setHistory] = useState<GroupedSexplorationHistory[string] | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<SexplorationHistoryItem | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!couple?.id) return;

            try {
                setLoading(true);

                // Parse the month/year to filter data
                const [monthName, year] = monthYear.split(' ');
                const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
                const startDate = new Date(parseInt(year), monthIndex, 1);
                const endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59);

                // 1. Fetch redeemed vouchers/coupons
                const { data: couponsData } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('couple_id', couple.id)
                    .not('redeemed_at', 'is', null)
                    .gte('redeemed_at', startDate.toISOString())
                    .lte('redeemed_at', endDate.toISOString())
                    .order('redeemed_at', { ascending: false });

                const vouchers: SexplorationHistoryItem[] = (couponsData || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description,
                    date: c.redeemed_at,
                    type: 'voucher' as const
                }));

                // 2. Fetch completed fantasies
                const { data: fantasiesData } = await (supabase as any)
                    .from('fantasy_bucket_list')
                    .select('*')
                    .eq('couple_id', couple.id)
                    .eq('status', 'completed')
                    .not('completed_at', 'is', null)
                    .gte('completed_at', startDate.toISOString())
                    .lte('completed_at', endDate.toISOString())
                    .order('completed_at', { ascending: false });

                const fantasies: SexplorationHistoryItem[] = (fantasiesData || []).map((f: any) => ({
                    id: f.id,
                    title: f.fantasy_text,
                    date: f.completed_at,
                    type: 'fantasy' as const
                }));

                // 3. Fetch completed positions
                const { data: positionsData } = await (supabase as any)
                    .from('completed_positions')
                    .select('*')
                    .eq('couple_id', couple.id)
                    .gte('completed_at', startDate.toISOString())
                    .lte('completed_at', endDate.toISOString())
                    .order('completed_at', { ascending: false });

                const positionItems: SexplorationHistoryItem[] = (positionsData || []).map((p: any) => {
                    const positionInfo = positions.find(pos => pos.id === p.position_id);
                    return {
                        id: p.position_id,
                        title: positionInfo?.name || p.position_id,
                        description: positionInfo?.description,
                        date: p.completed_at,
                        type: 'position' as const,
                        category: positionInfo?.category
                    };
                });

                setHistory({
                    vouchers,
                    fantasies,
                    positions: positionItems
                });

            } catch (err) {
                console.error('Error fetching sexploration history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [couple?.id, monthYear]);

    if (loading) {
        return (
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        );
    }

    if (!history || (history.vouchers.length === 0 && history.fantasies.length === 0 && history.positions.length === 0)) {
        return null; // Don't show section if no sexploration history
    }

    const position = selectedItem?.type === 'position' ? positions.find(p => p.id === selectedItem.id) : null;

    return (
        <>
            <div className="mt-0 pt-4 border-t border-gray-200 dark:border-gray-700 lg:mt-0 lg:pt-0 lg:border-t-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-pink-500" />
                    Sexploration
                </h3>

                <Tabs defaultValue="positions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="positions" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">
                            Positions
                        </TabsTrigger>
                        <TabsTrigger value="fantasies" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">
                            Fantasies
                        </TabsTrigger>
                        <TabsTrigger value="vouchers" className="text-xs sm:text-sm data-[state=active]:text-rose-500 dark:data-[state=active]:text-rose-400">
                            Vouchers
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="positions" className="space-y-4">
                        {history.positions.length > 0 ? (
                            <SexplorationCarousel items={history.positions} onOpenDetails={setSelectedItem} type="position" />
                        ) : (
                            <p className="text-center text-gray-500 py-8">No positions completed this month.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="fantasies" className="space-y-4">
                        {history.fantasies.length > 0 ? (
                            <SexplorationCarousel items={history.fantasies} onOpenDetails={setSelectedItem} type="fantasy" />
                        ) : (
                            <p className="text-center text-gray-500 py-8">No fantasies completed this month.</p>
                        )}
                    </TabsContent>

                    <TabsContent value="vouchers" className="space-y-4">
                        {history.vouchers.length > 0 ? (
                            <SexplorationCarousel items={history.vouchers} onOpenDetails={setSelectedItem} type="voucher" />
                        ) : (
                            <p className="text-center text-gray-500 py-8">No vouchers redeemed this month.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Details Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="w-[90%] sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto p-4 gap-0">
                    <DialogHeader className="text-left space-y-0">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0
                                ${selectedItem?.type === 'voucher' ? 'bg-pink-100 text-pink-600' :
                                    selectedItem?.type === 'fantasy' ? 'bg-amber-100 text-amber-600' :
                                        'bg-rose-100 text-rose-600'}
                            `}>
                                {selectedItem?.type}
                            </span>
                            <Calendar className="w-3.5 h-3.5" />
                            {selectedItem && new Date(selectedItem.date).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            {selectedItem?.title}
                            {selectedItem?.type === 'position' && position?.category && (
                                <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-medium capitalize shrink-0">
                                    {position.category}
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {selectedItem?.type === 'position' && position && (
                            <div className="flex flex-col items-center gap-4">
                                <PositionSVG position={position} size="lg" />
                                <div className="text-center">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        {position.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedItem?.type === 'fantasy' && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <span className="font-medium text-amber-700 dark:text-amber-300">Fantasy Completed</span>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200">
                                    {selectedItem.title}
                                </p>
                            </div>
                        )}

                        {selectedItem?.type === 'voucher' && (
                            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Ticket className="w-5 h-5 text-pink-500" />
                                    <span className="font-medium text-pink-700 dark:text-pink-300">Voucher Redeemed</span>
                                </div>
                                {selectedItem.description && (
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        {selectedItem.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}








