import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCoupleData } from '@/hooks/useCoupleData';
import { Loader2, Calendar, CalendarDays, Quote, Image as ImageIcon, HelpCircle, X, MapPin, Heart, Sparkles, Ticket, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { positions } from '@/data/positionsData';
import { PositionSVG } from '../sexploration/PositionSVG';

interface MemoryItem {
    id: string;
    type: 'journal' | 'photo' | 'challenge' | 'position' | 'fantasy' | 'voucher' | 'sticky_note' | 'event';
    content: string | null;
    title?: string | null;
    media_urls?: string[] | null;
    location?: string | null;
    created_at: string;
    activity_question?: string;
    category?: string;
    // Attribution fields
    uploader_id?: string | null;      // For journals, photos, sticky_notes
    requester_id?: string | null;     // For fantasies
    assigned_to?: string | null;      // For vouchers (redeemer)
    // Challenge answers stored by user position (not viewer-relative)
    user_one_id?: string | null;
    user_one_answer?: string | null;
    user_two_id?: string | null;
    user_two_answer?: string | null;
    // Event color from calendar
    event_color?: string | null;
}

export function OnThisDayTile() {
    const { couple, currentUser, partner } = useCoupleData();
    const [item, setItem] = useState<MemoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isThrowback, setIsThrowback] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchOnThisDay = async () => {
            if (!couple || !currentUser) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const today = new Date();
                const month = today.getMonth() + 1; // 1-12
                const day = today.getDate(); // 1-31

                // 1. Fetch Memories (Journal & Photos)
                const { data: memories, error: memError } = await supabase
                    .from('memories')
                    .select('*')
                    .eq('couple_id', couple.id);

                if (memError) console.error('Error fetching memories:', memError);

                // 2. Fetch User Answers (Challenges)
                const { data: answers, error: ansError } = await supabase
                    .from('user_answers')
                    .select(`
                        *,
                        activity:activities(content)
                    `)
                    .eq('couple_id', couple.id);

                if (ansError) console.error('Error fetching answers:', ansError);

                // Process answers to group by activity/date - user-agnostic storage
                const processedAnswers: MemoryItem[] = [];
                const processedActivityIds = new Set<string>();

                (answers || []).forEach((a: any) => {
                    if (processedActivityIds.has(a.activity_id)) return;
                    processedActivityIds.add(a.activity_id);

                    // Store answers by couple position, not viewer-relative
                    const userOneAnswer = answers?.find((ans: any) =>
                        ans.activity_id === a.activity_id && ans.user_id === couple?.user_one_id
                    );
                    const userTwoAnswer = answers?.find((ans: any) =>
                        ans.activity_id === a.activity_id && ans.user_id === couple?.user_two_id
                    );

                    processedAnswers.push({
                        id: a.id,
                        type: 'challenge',
                        content: null,
                        created_at: a.created_at,
                        activity_question: a.activity?.content?.question || 'Daily Challenge',
                        user_one_id: couple?.user_one_id,
                        user_one_answer: userOneAnswer?.answer_text || null,
                        user_two_id: couple?.user_two_id,
                        user_two_answer: userTwoAnswer?.answer_text || null,
                    });
                });

                // 3. Fetch completed positions (with error handling)
                let positionItems: MemoryItem[] = [];
                try {
                    const { data: positionsData, error: posError } = await (supabase as any)
                        .from('completed_positions')
                        .select('*')
                        .eq('couple_id', couple.id);

                    if (posError) console.error('Error fetching positions:', posError);

                    positionItems = (positionsData || [])
                        .filter((p: any) => p.completed_at) // Only include items with a date
                        .map((p: any) => {
                            const positionInfo = positions.find(pos => pos.id === p.position_id);
                            return {
                                id: p.id || p.position_id,
                                type: 'position' as const,
                                content: positionInfo?.description || null,
                                title: positionInfo?.name || p.position_id,
                                created_at: p.completed_at,
                                category: positionInfo?.category
                            };
                        });
                } catch (e) {
                    console.error('Error processing positions:', e);
                }

                // 4. Fetch completed fantasies (with error handling)
                let fantasyItems: MemoryItem[] = [];
                try {
                    const { data: fantasiesData, error: fantError } = await (supabase as any)
                        .from('fantasy_bucket_list')
                        .select('*')
                        .eq('couple_id', couple.id)
                        .eq('status', 'completed');

                    if (fantError) console.error('Error fetching fantasies:', fantError);

                    fantasyItems = (fantasiesData || [])
                        .filter((f: any) => f.completed_at)
                        .map((f: any) => ({
                            id: f.id,
                            type: 'fantasy' as const,
                            content: null,
                            title: f.fantasy_text,
                            created_at: f.completed_at,
                            requester_id: f.requester_id, // For attribution
                        }));
                } catch (e) {
                    console.error('Error processing fantasies:', e);
                }

                // 5. Fetch redeemed vouchers (with error handling)
                let voucherItems: MemoryItem[] = [];
                try {
                    const { data: vouchersData, error: vouchError } = await supabase
                        .from('coupons')
                        .select('*')
                        .eq('couple_id', couple.id)
                        .not('redeemed_at', 'is', null);

                    if (vouchError) console.error('Error fetching vouchers:', vouchError);

                    voucherItems = (vouchersData || [])
                        .filter((v: any) => v.redeemed_at)
                        .map((v: any) => ({
                            id: v.id,
                            type: 'voucher' as const,
                            content: v.description,
                            title: v.title,
                            created_at: v.redeemed_at,
                            assigned_to: v.assigned_to, // For attribution
                        }));
                } catch (e) {
                    console.error('Error processing vouchers:', e);
                }

                // 6. Fetch past calendar events
                let eventItems: MemoryItem[] = [];
                try {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const { data: eventsData, error: eventError } = await supabase
                        .from('calendar_events')
                        .select('*')
                        .eq('couple_id', couple.id)
                        .lt('event_date', todayStr);

                    if (eventError) console.error('Error fetching events:', eventError);

                    eventItems = (eventsData || [])
                        .filter((e: any) => e.event_date)
                        .map((e: any) => ({
                            id: e.id,
                            type: 'event' as const,
                            content: e.description,
                            title: e.title,
                            location: e.location,
                            created_at: e.event_date,
                            category: e.category,
                            event_color: e.color || '#e11d48', // Calendar event color
                        }));
                } catch (e) {
                    console.error('Error processing events:', e);
                }

                // Normalize data - filter out items without valid dates
                const allItems: MemoryItem[] = [
                    ...(memories || []).map((m: any) => {
                        // Handle different memory types
                        if (m.type === 'challenge') {
                            return {
                                id: m.id,
                                type: 'challenge' as const,
                                content: m.caption,
                                title: m.title,
                                activity_question: m.caption || m.title,
                                media_urls: m.media_urls || (m.media_url ? [m.media_url] : []),
                                created_at: m.created_at,
                                uploader_id: m.uploader_id,
                            };
                        }
                        return {
                            id: m.id,
                            type: (['journal', 'photo', 'sticky_note'].includes(m.type) ? m.type : 'photo') as 'journal' | 'photo' | 'sticky_note',
                            content: m.caption,
                            title: m.title,
                            media_urls: m.media_urls || (m.media_url ? [m.media_url] : []),
                            location: m.location,
                            created_at: m.created_at,
                            uploader_id: m.uploader_id, // For attribution
                        };
                    }),
                    ...processedAnswers,
                    ...positionItems,
                    ...fantasyItems,
                    ...voucherItems,
                    ...eventItems,
                ].filter(item => item.created_at); // Only include items with valid dates

                // Filter for "On This Day" (same month/day, different year)
                const onThisDayItems = allItems.filter(item => {
                    const itemDate = new Date(item.created_at);
                    return (
                        itemDate.getMonth() + 1 === month &&
                        itemDate.getDate() === day &&
                        itemDate.getFullYear() !== today.getFullYear()
                    );
                });

                if (onThisDayItems.length > 0) {
                    // Pick random item from "On This Day"
                    // Use date-based seed to keep it consistent for the day
                    const seed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
                    const index = seed % onThisDayItems.length;
                    setItem(onThisDayItems[index]);
                    setIsThrowback(false);
                } else if (allItems.length > 0) {
                    // Fallback: Pick random "Throwback" from all past items
                    // Filter out items from today
                    const pastItems = allItems.filter(item => {
                        const itemDate = new Date(item.created_at);
                        return itemDate.toDateString() !== today.toDateString();
                    });

                    if (pastItems.length > 0) {
                        // Rotate every 2 days
                        const twoDaySeed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24 * 2));
                        const index = twoDaySeed % pastItems.length;
                        setItem(pastItems[index]);
                        setIsThrowback(true);
                    } else {
                        setItem(null);
                    }
                } else {
                    setItem(null);
                }

            } catch (err) {
                console.error('Error fetching On This Day:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOnThisDay();
    }, [couple?.id, currentUser?.id]);

    if (loading) {
        return (
            <div className="h-full min-h-[180px] rounded-2xl bg-white p-6 shadow-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!item) {
        // Empty state - maybe encourage them to create memories?
        // Or just return null to hide tile? 
        // Let's show a placeholder encouraging action.
        return (
            <div
                className="group relative h-full min-h-[180px] overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm flex flex-col justify-center items-center text-center"
            >
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                    <Calendar className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-semibold text-heading-dark">Start Your Journey</h3>
                <p className="text-sm text-body-soft mt-1">Create memories today to see them here next year!</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getIcon = () => {
        switch (item.type) {
            case 'photo': return <ImageIcon className="w-5 h-5 text-blue-500" />;
            case 'journal': return <Quote className="w-5 h-5 text-amber-500" />;
            case 'challenge': return <HelpCircle className="w-5 h-5 text-purple-500" />;
            case 'position': return <Heart className="w-5 h-5 text-rose-500" />;
            case 'fantasy': return <Sparkles className="w-5 h-5 text-amber-500" />;
            case 'voucher': return <Ticket className="w-5 h-5 text-pink-500" />;
            case 'sticky_note': return <StickyNote className="w-5 h-5 text-yellow-600" />;
            case 'event': return <CalendarDays className="w-5 h-5 text-indigo-500" />;
            default: return <Calendar className="w-5 h-5 text-rose-500" />;
        }
    };

    const getCategoryBadge = () => {
        const baseClasses = "ml-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase";

        switch (item.type) {
            case 'photo':
                return <span className={`${baseClasses} bg-blue-100 text-blue-600`}>Photo Memory</span>;
            case 'journal':
                return <span className={`${baseClasses} bg-amber-100 text-amber-600`}>Journal</span>;
            case 'challenge':
                return <span className={`${baseClasses} bg-purple-100 text-purple-600`}>Challenge</span>;
            case 'sticky_note':
                return <span className={`${baseClasses} bg-yellow-100 text-yellow-600`}>Note</span>;
            case 'event':
                return <span className={`${baseClasses} bg-indigo-100 text-indigo-600`}>Past Event</span>;
            case 'position':
            case 'fantasy':
            case 'voucher':
                return null;
            default:
                return <span className={`${baseClasses} bg-gray-100 text-gray-600`}>Memory</span>;
        }
    };


    const position = item.type === 'position' ? positions.find(p => p.name === item.title || p.id === item.id) : null;

    const getLabel = () => {
        if (isThrowback) return "Throwback";
        return "On This Day";
    };

    // Helper for dynamic attribution labels
    const getAuthorLabel = (userId: string | null | undefined) =>
        userId === currentUser?.id ? 'You' : (partner?.first_name || 'Partner');

    // Compute challenge answers based on viewer
    const myAnswer = item.user_one_id === currentUser?.id ? item.user_one_answer : item.user_two_answer;
    const partnerAnswerText = item.user_one_id === currentUser?.id ? item.user_two_answer : item.user_one_answer;
    const hasAnswers = myAnswer || partnerAnswerText;

    const hasMedia = item.media_urls && item.media_urls.length > 0;
    const coverImage = hasMedia ? item.media_urls![0] : null;

    return (
        <>
            <motion.div
                onClick={() => setIsExpanded(true)}
                className="group relative h-full min-h-[180px] overflow-hidden rounded-2xl bg-white shadow-sm cursor-pointer flex flex-col"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Background Image for Photos */}
                {item.type === 'photo' && coverImage && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={coverImage}
                            alt="Memory"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className={`flex items-center gap-1 ${item.type === 'photo' ? 'text-white' : ''}`}>
                            <div className={`rounded-full p-1.5 ${item.type === 'photo' ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}>
                                {getIcon()}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${item.type === 'photo' ? 'text-white/90' : 'text-body-soft'}`}>
                                {getLabel()}
                            </span>
                            {getCategoryBadge()}
                        </div>
                        <span className={`text-xs font-medium ${item.type === 'photo' ? 'text-white/80' : 'text-body-soft'}`}>
                            {formatDate(item.created_at)}
                        </span>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 flex flex-col justify-center">
                        {item.type === 'photo' ? (
                            <div className="mt-auto space-y-2">
                                {/* Show type badge if no cover image */}
                                {item.title && !coverImage && (
                                    <h4 className="font-bold text-heading-dark text-base line-clamp-1">
                                        {item.title}
                                    </h4>
                                )}
                                {item.content && (
                                    <p className={`font-medium line-clamp-2 leading-snug ${coverImage ? 'text-white text-lg' : 'text-body-soft text-sm'}`}>
                                        {coverImage ? `"${item.content}"` : item.content}
                                    </p>
                                )}
                                {!item.content && !item.title && !coverImage && (
                                    <p className="text-xs text-gray-400">Photo memory</p>
                                )}
                            </div>
                        ) : item.type === 'journal' ? (
                            <div className="space-y-2">
                                {item.title && (
                                    <h4 className="font-bold text-heading-dark text-base line-clamp-1">
                                        {item.title}
                                    </h4>
                                )}
                                {item.content && (
                                    <p className="text-body-soft text-sm line-clamp-2">
                                        {item.content}
                                    </p>
                                )}
                            </div>
                        ) : item.type === 'challenge' ? (
                            <div className="space-y-2">
                                {/* Challenge Title */}
                                <h4 className="font-bold text-heading-dark text-base line-clamp-2">
                                    {item.title || item.activity_question || 'Challenge'}
                                </h4>

                                {/* Answers using new user-agnostic fields */}
                                {hasAnswers ? (
                                    <div className="space-y-1">
                                        {myAnswer && (
                                            <p className="text-body-soft text-sm line-clamp-1 italic">
                                                You: "{myAnswer}"
                                            </p>
                                        )}
                                        {partnerAnswerText && (
                                            <p className="text-body-soft text-sm line-clamp-1 italic">
                                                {partner?.first_name || 'Partner'}: "{partnerAnswerText}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-green-600 font-medium">Challenge Completed ✓</p>
                                )}
                            </div>
                        ) : item.type === 'position' ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    {position && <PositionSVG position={position} size="sm" />}
                                    <div>
                                        <h4 className="font-bold text-heading-dark text-lg line-clamp-1">
                                            {item.title}
                                        </h4>
                                        {item.category && (
                                            <span className="text-xs text-rose-500 capitalize">{item.category}</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-green-600 font-medium">Position Completed</p>
                            </div>
                        ) : item.type === 'fantasy' ? (
                            // Completed fantasy style - amber to match fantasy pill
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                <p className="text-gray-800 dark:text-gray-200 line-clamp-2 font-medium">
                                    {item.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Suggested by {getAuthorLabel(item.requester_id)}
                                </p>
                            </div>
                        ) : item.type === 'voucher' ? (
                            // Pleasure coupon style from Coupon.tsx
                            <div className="relative w-full h-[90px] bg-pink-200 rounded-sm overflow-hidden">
                                {/* Header Banner */}
                                <div className="absolute top-1 left-4 right-4 h-[18px] bg-pink-100 border-b border-red-600">
                                    <div className="w-full py-0.5 text-center font-normal tracking-[0.15em] uppercase text-[8px] text-[#FF1744]">
                                        Pleasure Coupon
                                    </div>
                                </div>
                                {/* Main Body */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 px-4">
                                    <h3 className="text-sm leading-tight text-[#FF1744] text-center line-clamp-1" style={{ fontFamily: "'Shrikhand', cursive" }}>
                                        {item.title || "COUPON"}
                                    </h3>
                                    <p className="text-[8px] text-[#FF1744] font-bold uppercase tracking-wide line-clamp-1 mt-1">
                                        {item.content || "Valid for one special request"}
                                    </p>
                                </div>
                                {/* Redeemed Badge */}
                                <div className="absolute bottom-1 left-4 right-4 text-center">
                                    <span className="text-[8px] text-gray-500 font-medium">
                                        Redeemed by {getAuthorLabel(item.assigned_to)}
                                    </span>
                                </div>
                            </div>
                        ) : item.type === 'sticky_note' ? (
                            <div className="space-y-2">
                                <p className="text-xs text-yellow-700 font-medium mb-1">
                                    Note from {getAuthorLabel(item.uploader_id)}
                                </p>
                                <div className="bg-[#FEF9C3] p-4 rounded-lg shadow-sm border border-yellow-200/50 transform rotate-1 transition-transform group-hover:rotate-0">
                                    <p className="text-yellow-900 font-handwriting text-lg leading-snug line-clamp-3">
                                        "{item.content}"
                                    </p>
                                </div>
                            </div>
                        ) : item.type === 'event' ? (
                            // Event tile style from CalendarView - uses dynamic event_color
                            <div
                                className="flex items-start gap-2 p-2 rounded-xl"
                                style={{ backgroundColor: `${item.event_color || '#e11d48'}26` }}
                            >
                                <div
                                    className="w-1 self-stretch rounded-full flex-shrink-0"
                                    style={{ backgroundColor: item.event_color || '#e11d48' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                            {item.title}
                                        </h4>
                                        {item.category && (
                                            <span
                                                className="text-[8px] px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0"
                                                style={{ backgroundColor: item.event_color || '#e11d48' }}
                                            >
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    {item.location && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{item.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Default/fallback for unknown types
                            <div className="space-y-2">
                                {item.title && (
                                    <h4 className="font-bold text-heading-dark text-base line-clamp-1">
                                        {item.title}
                                    </h4>
                                )}
                                {item.content && (
                                    <p className="text-body-soft text-sm line-clamp-2">
                                        {item.content}
                                    </p>
                                )}
                                {!item.title && !item.content && (
                                    <p className="text-xs text-gray-400">A memory from the past</p>
                                )}
                            </div>
                        )}
                    </div>


                </div>
            </motion.div>

            {/* Expanded Modal */}
            <AnimatePresence>
                {isExpanded && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col"
                            >
                                {/* Header Section - Always at top */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-50 shrink-0 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-100 p-2 rounded-full">
                                            {getIcon()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
                                                    {getLabel()}
                                                </p>
                                                {getCategoryBadge()}
                                            </div>
                                            <p className="text-sm text-body-soft">
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full p-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="overflow-y-auto flex-1">
                                    {/* Image (if available) */}
                                    {hasMedia && (
                                        <div className="relative h-64 w-full">
                                            <img
                                                src={coverImage!}
                                                alt="Memory"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="px-6 py-3 space-y-6">
                                        {item.type === 'challenge' ? (
                                            <>
                                                <h3 className="text-xl font-bold text-heading-dark">
                                                    {item.title || item.activity_question || 'Challenge'}
                                                </h3>

                                                {/* Show answers using computed values */}
                                                {hasAnswers ? (
                                                    <div className="space-y-4">
                                                        {myAnswer && (
                                                            <div className="bg-gray-50 p-4 rounded-xl">
                                                                <p className="text-xs font-bold text-body-soft uppercase mb-2">You Answered</p>
                                                                <p className="text-heading-dark italic text-lg">"{myAnswer}"</p>
                                                            </div>
                                                        )}
                                                        {partnerAnswerText && (
                                                            <div className="bg-rose-50 p-4 rounded-xl">
                                                                <p className="text-xs font-bold text-rose-500 uppercase mb-2">{partner?.first_name || 'Partner'} Answered</p>
                                                                <p className="text-heading-dark italic text-lg">"{partnerAnswerText}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3">
                                                        <span className="text-green-500 text-2xl">✓</span>
                                                        <p className="text-green-700 font-medium">You completed this challenge!</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : item.type === 'position' ? (
                                            <>
                                                <div className="flex flex-col items-center gap-4">
                                                    {position && <PositionSVG position={position} size="lg" />}
                                                    <div className="text-center">
                                                        <h3 className="text-2xl font-bold text-heading-dark mb-2">
                                                            {item.title}
                                                        </h3>
                                                        {item.category && (
                                                            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-medium capitalize mb-3">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                        <p className="text-body-soft leading-relaxed">
                                                            {item.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : item.type === 'fantasy' ? (
                                            <>
                                                {/* Completed fantasy style - amber to match fantasy pill */}
                                                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                                            ✓
                                                        </span>
                                                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Completed Fantasy</span>
                                                    </div>
                                                    <p className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        Suggested by {getAuthorLabel(item.requester_id)}
                                                    </p>
                                                </div>
                                            </>
                                        ) : item.type === 'voucher' ? (
                                            <>
                                                {/* Pleasure coupon style from Coupon.tsx */}
                                                <div className="relative w-full h-[180px] bg-pink-200" style={{
                                                    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                                                    maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                                                    maskSize: '100% 100%',
                                                    WebkitMaskSize: '100% 100%',
                                                    borderRadius: '0px'
                                                }}>
                                                    {/* Header Banner */}
                                                    <div className="absolute top-3 left-7 right-7 h-[30px] bg-pink-100 border-b border-red-600">
                                                        <div className="w-full py-1.5 text-center font-normal tracking-[0.25em] uppercase text-base text-[#FF1744]">
                                                            Pleasure Coupon
                                                        </div>
                                                    </div>
                                                    {/* Inner Red Box Outline */}
                                                    <div className="absolute top-3 bottom-3 left-7 right-7 border border-red-600 opacity-50" />
                                                    {/* Main Body */}
                                                    <div className="absolute top-3 bottom-3 left-7 right-7 flex flex-col overflow-hidden text-center pt-[30px]">
                                                        <div className="flex-1 px-3 pt-3 flex flex-col items-center justify-start gap-3">
                                                            <h3 className="text-[1.6rem] leading-tight text-[#FF1744]" style={{ fontFamily: "'Shrikhand', cursive" }}>
                                                                {item.title || "COUPON"}
                                                            </h3>
                                                            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wide line-clamp-2 px-2 text-[#FF1744]">
                                                                {item.content || "Valid for one special request"}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 w-full border-t border-gray-400 flex items-center justify-center gap-1 text-gray-400 text-xs font-bold uppercase">
                                                            <span>Redeemed by {getAuthorLabel(item.assigned_to)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : item.type === 'sticky_note' ? (
                                            <>
                                                <div className="bg-[#FEF9C3] p-6 rounded-sm shadow-md border-t-8 border-yellow-200/50 transform -rotate-1 mt-0">
                                                    <h3 className="font-handwriting text-2xl text-yellow-900/50 mb-2">
                                                        Note from {getAuthorLabel(item.uploader_id)}
                                                    </h3>
                                                    <p className="text-yellow-900 font-handwriting text-2xl leading-relaxed whitespace-pre-wrap">
                                                        {item.content}
                                                    </p>
                                                </div>
                                            </>
                                        ) : item.type === 'journal' ? (
                                            <>

                                                <div className="space-y-1">

                                                    {item.title && (
                                                        <h3 className="text-2xl font-bold text-heading-dark">
                                                            {item.title}
                                                        </h3>
                                                    )}

                                                    {item.location && (
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="text-sm">{item.location}</span>
                                                        </div>
                                                    )}

                                                </div>
                                                {item.content && (
                                                    <div className="prose prose-rose max-w-none">
                                                        <p className="text-lg text-body-soft leading-relaxed whitespace-pre-wrap">
                                                            {item.content}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        ) : item.type === 'photo' ? (
                                            <>



                                                {item.title && (
                                                    <h3 className="text-2xl font-bold text-heading-dark">
                                                        {item.title}
                                                    </h3>
                                                )}

                                                {item.location && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="text-sm">{item.location}</span>
                                                    </div>
                                                )}

                                                {item.content && (
                                                    <div className="prose prose-rose max-w-none">
                                                        <p className="text-lg text-body-soft leading-relaxed whitespace-pre-wrap">
                                                            {item.content}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Additional Images Grid */}
                                                {item.media_urls && item.media_urls.length > 1 && (
                                                    <div className="grid grid-cols-2 gap-2 mt-6">
                                                        {item.media_urls.slice(1).map((url, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={url}
                                                                alt={`Memory ${idx + 2}`}
                                                                className="rounded-lg w-full h-32 object-cover"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : item.type === 'event' ? (
                                            <>
                                                {/* Event tile style - matches card view exactly with dynamic color */}
                                                <div
                                                    className="flex items-start gap-3 p-4 rounded-xl"
                                                    style={{ backgroundColor: `${item.event_color || '#e11d48'}26` }}
                                                >
                                                    <div
                                                        className="w-1.5 self-stretch rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: item.event_color || '#e11d48' }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {item.title}
                                                            </h3>
                                                            {item.category && (
                                                                <span
                                                                    className="text-xs px-3 py-1 rounded-full text-white font-medium flex-shrink-0 capitalize"
                                                                    style={{ backgroundColor: item.event_color || '#e11d48' }}
                                                                >
                                                                    {item.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.location && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{item.location}</span>
                                                            </div>
                                                        )}
                                                        {item.content && (
                                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                                {item.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            // Default fallback
                                            <>
                                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">
                                                    Memory
                                                </span>

                                                {item.title && (
                                                    <h3 className="text-2xl font-bold text-heading-dark">
                                                        {item.title}
                                                    </h3>
                                                )}

                                                {item.content && (
                                                    <div className="prose prose-rose max-w-none">
                                                        <p className="text-lg text-body-soft leading-relaxed whitespace-pre-wrap">
                                                            {item.content}
                                                        </p>
                                                    </div>
                                                )}

                                                {!item.title && !item.content && (
                                                    <p className="text-gray-400">A memory from the past</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
