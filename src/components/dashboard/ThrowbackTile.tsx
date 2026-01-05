import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCoupleData } from '@/hooks/useCoupleData';
import { Loader2, Calendar, CalendarDays, Quote, Image as ImageIcon, HelpCircle, X, MapPin, Heart, Sparkles, Ticket, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { positions } from '@/data/positionsData';
import { PositionSVG } from '../sexploration/PositionSVG';
import { DateBadge } from '../ui/DateBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { ImageCarousel } from '../ui/ImageCarousel';

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

export function ThrowbackTile() {
    const { couple, currentUser, partner, userProfile } = useCoupleData();
    const [item, setItem] = useState<MemoryItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchThrowback = async () => {
            if (!couple || !currentUser) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const today = new Date();
                const month = today.getMonth() + 1; // 1-12
                const day = today.getDate(); // 1-31
                const seed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));



                // 1. Try "On This Day" via RPC
                const { data: onThisDayData, error: otdError } = await supabase
                    .rpc('get_on_this_day_contents', {
                        p_couple_id: couple.id,
                        p_month: month,
                        p_day: day,
                        p_timezone: userProfile?.timezone || 'UTC'
                    });

                if (otdError) throw otdError;

                // Type definition for RPC response item
                type OnThisDayItem = {
                    id: string;
                    type: string;
                    title: string | null;
                    content: string | null;
                    created_at: string;
                    media_urls: string[] | null;
                    location: string | null;
                    uploader_id: string | null;
                    extra_data: any; // Ideally strictly typed too, but mapped to generic Json in Supabase types
                };

                let selectedItem: OnThisDayItem | null = null;

                if (onThisDayData && onThisDayData.length > 0) {
                    // Pick random item from "On This Day" using consistent daily seed
                    const index = seed % onThisDayData.length;
                    selectedItem = onThisDayData[index];
                } else {

                    // 2. Fallback: "Throwback" via RPC
                    // Use a 2-day seed for rotation
                    const twoDaySeed = Math.floor(today.getTime() / (1000 * 60 * 60 * 24 * 2));
                    // We need a float seed for the random function, normalize to 0-1
                    // Using a simple hash of the seed to get 0-1
                    const randomSeed = (Math.sin(twoDaySeed) + 1) / 2;

                    const excludeDate = today.toISOString().split('T')[0];


                    const { data: throwbackData, error: tbError } = await supabase
                        .rpc('get_random_throwback', {
                            p_couple_id: couple.id,
                            p_seed: randomSeed,
                            p_exclude_date: excludeDate
                        });

                    if (tbError) throw tbError;



                    if (throwbackData && throwbackData.length > 0) {
                        selectedItem = throwbackData[0];
                    }
                }



                if (selectedItem) {
                    // Transform RPC result to MemoryItem
                    // Challenges need answer mapping
                    let challengeAnswers: any = {};
                    if (selectedItem.type === 'challenge' && selectedItem.extra_data?.answers) {
                        const answers = selectedItem.extra_data.answers as any[];
                        const userOne = answers.find((a: any) => a.user_id === couple.user_one_id);
                        const userTwo = answers.find((a: any) => a.user_id === couple.user_two_id);
                        challengeAnswers = {
                            user_one_id: couple.user_one_id,
                            user_one_answer: userOne?.answer,
                            user_two_id: couple.user_two_id,
                            user_two_answer: userTwo?.answer
                        };
                    }

                    setItem({
                        id: selectedItem.id,
                        type: selectedItem.type as any,
                        content: selectedItem.content,
                        title: selectedItem.title,
                        media_urls: selectedItem.media_urls,
                        location: selectedItem.location,
                        created_at: selectedItem.created_at,
                        uploader_id: selectedItem.uploader_id,
                        requester_id: selectedItem.uploader_id, // For fantasy (requester_id mapped to uploader_id in RPC)
                        assigned_to: selectedItem.extra_data?.assigned_to,
                        category: selectedItem.extra_data?.category,
                        event_color: selectedItem.extra_data?.event_color,
                        activity_question: selectedItem.extra_data?.activity_question,
                        ...challengeAnswers
                    });
                } else {
                    setItem(null);
                }

            } catch (err) {
                console.error('Error fetching On This Day:', err);
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchThrowback();
    }, [couple?.id, currentUser?.id, userProfile?.timezone]);

    if (loading) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
        );
    }

    if (!item) {
        return null;
    }

    // DEBUG: Log item details for troubleshooting
    console.log('[ThrowbackTile] Rendering item:', {
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
        media_urls: item.media_urls,
        hasMediaUrls: item.media_urls && item.media_urls.length > 0,
        coverImage: item.media_urls?.[0] || null,
        created_at: item.created_at,
        uploader_id: item.uploader_id
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getIcon = () => {
        const iconClasses = "w-5 h-5 text-rose-500";
        switch (item.type) {
            case 'photo': return <ImageIcon className={iconClasses} />;
            case 'journal': return <Quote className={iconClasses} />;
            case 'challenge': return <HelpCircle className={iconClasses} />;
            case 'position': return <Heart className={iconClasses} />;
            case 'fantasy': return <Sparkles className={iconClasses} />;
            case 'voucher': return <Ticket className={iconClasses} />;
            case 'sticky_note': return <StickyNote className={iconClasses} />;
            case 'event': return <CalendarDays className={iconClasses} />;
            default: return <Calendar className={iconClasses} />;
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
                return <span className={`${baseClasses} bg-rose-100 text-rose-600`}>Position</span>;
            case 'fantasy':
                return <span className={`${baseClasses} bg-pink-100 text-pink-600`}>Fantasy</span>;
            case 'voucher':
                return <span className={`${baseClasses} bg-emerald-100 text-emerald-600`}>Voucher</span>;
            default:
                return null;
        }
    };


    const position = item.type === 'position' ? positions.find(p => p.name === item.title || p.id === item.id) : null;

    const getLabel = () => {
        return "Throwback";
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

    const getUser = (userId: string | null | undefined) => {
        if (!userId) return null;
        if (userId === currentUser?.id) return userProfile;
        if (userId === partner?.id) return partner;
        return null;
    };

    return (
        <>
            <motion.div
                layoutId={`memory-${item.id}`}
                onClick={() => setIsExpanded(true)}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all md:hover:shadow-md active:shadow-md cursor-pointer flex flex-col ${item.type === 'photo' && coverImage ? 'min-h-[220px]' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Background Image for Photos */}
                {item.type === 'photo' && coverImage && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={coverImage}
                            alt="Memory"
                            className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-105 group-active:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2">
                            <div className={`shrink-0 ${item.type === 'photo' ? 'p-1.5 rounded-full bg-white/20 backdrop-blur-sm' : 'mt-1'}`}>
                                {getIcon()}
                            </div>
                            <div className={`flex flex-col min-w-0 ${item.type === 'photo' && coverImage ? 'bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 ml-1' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-bold ${item.type === 'photo' ? 'text-white' : 'text-heading-dark'}`}>
                                        {getLabel()}
                                    </h3>
                                    {getCategoryBadge()}
                                </div>
                                <p className={`text-xs -mt-0.5 ${item.type === 'photo' ? 'text-white/80' : 'text-body-soft'}`}>
                                    {formatDate(item.created_at)}
                                </p>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined transition-colors ${item.type === 'photo' ? 'text-white/60 md:group-hover:text-white group-active:text-white' : 'text-gray-400 md:group-hover:text-gray-600 group-active:text-gray-600'}`}>
                            arrow_forward
                        </span>
                    </div>

                    {/* Content Preview */}
                    <div className={`flex flex-col ${item.type === 'photo' && coverImage ? 'flex-1 min-h-[140px] justify-end' : 'justify-start'}`}>
                        {item.type === 'photo' ? (
                            <div className={`space-y-1 ${coverImage ? 'mt-auto bg-black/40 backdrop-blur-md rounded-xl p-3' : ''}`}>
                                {/* Show title if no cover image */}
                                {item.title && (
                                    <h4 className={`font-bold text-base line-clamp-1 ${coverImage ? 'text-white drop-shadow-sm' : 'text-heading-dark'}`}>
                                        {item.title}
                                    </h4>
                                )}
                                {item.content && (
                                    <p className={`font-medium line-clamp-2 leading-snug ${coverImage ? 'text-white text-lg drop-shadow-sm' : 'text-body-soft text-base'}`}>
                                        {coverImage ? `"${item.content}"` : item.content}
                                    </p>
                                )}
                                {!item.content && !item.title && (
                                    <p className={`text-xs ${coverImage ? 'text-white/70' : 'text-gray-400'}`}>Photo memory</p>
                                )}
                                <div className={`flex items-center gap-2 pt-2 text-[10px] font-medium ${coverImage ? 'text-white/90' : 'text-gray-500'}`}>
                                    <UserAvatar
                                        user={getUser(item.uploader_id)}
                                        className="w-4 h-4 border-none"
                                        iconClassName="w-3 h-3"
                                    />
                                    <span>Uploaded by {getAuthorLabel(item.uploader_id)}</span>
                                    {item.location && (
                                        <>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[100px]">{item.location}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        ) : item.type === 'journal' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-2 min-w-[75%] mx-auto">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Posted by {getAuthorLabel(item.uploader_id)}
                                    {item.location && (
                                        <span className="inline-flex items-center gap-1 ml-2">
                                            <MapPin className="w-3 h-3 inline" />
                                            <span className="truncate max-w-[100px]">{item.location}</span>
                                        </span>
                                    )}
                                </p>
                                {item.title ? (
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight break-words line-clamp-2">
                                        {item.title}
                                    </h3>
                                ) : (
                                    <span className="text-gray-400 italic">Untitled Memory</span>
                                )}
                                {item.content && (
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-3 text-sm">
                                        {item.content}
                                    </p>
                                )}
                            </div>
                        ) : item.type === 'challenge' ? (
                            <div className="space-y-1">
                                {/* Challenge Title */}
                                <h4 className="font-bold text-heading-dark text-base line-clamp-2">
                                    {item.title || item.activity_question || 'Challenge'}
                                </h4>

                                {/* Answers using new user-agnostic fields */}
                                {hasAnswers ? (
                                    <div className="space-y-1">
                                        {myAnswer && (
                                            <p className="text-body-soft text-base line-clamp-1 italic">
                                                You: "{myAnswer}"
                                            </p>
                                        )}
                                        {partnerAnswerText && (
                                            <p className="text-body-soft text-base line-clamp-1 italic">
                                                {partner?.first_name || 'Partner'}: "{partnerAnswerText}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-green-600 font-medium">Challenge Completed ✓</p>
                                )}
                            </div>
                        ) : item.type === 'position' ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    {position && <PositionSVG position={position} size="sm" />}
                                    <div>
                                        <h4 className="font-bold text-heading-dark text-base line-clamp-1">
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
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 space-y-1">
                                <p className="text-gray-800 dark:text-gray-200 line-clamp-2 font-bold text-base">
                                    {item.title}
                                </p>
                                <p className="text-[10px] text-gray-400">
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
                                    <h3 className="text-base leading-tight text-[#FF1744] text-center line-clamp-1" style={{ fontFamily: "'Shrikhand', cursive" }}>
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

                            <div className="bg-[#FEF9C3] p-3 rounded-lg shadow-sm border border-yellow-200/50 transform rotate-1 transition-transform md:group-hover:rotate-0 group-active:rotate-0 space-y-1 w-fit min-w-[75%] mx-auto">
                                <p className="text-xs text-yellow-900/50 font-handwriting mb-0.5">
                                    Note from {getAuthorLabel(item.uploader_id)}
                                </p>
                                <p className="text-yellow-900 font-handwriting text-lg leading-snug line-clamp-3">
                                    {item.content}
                                </p>
                            </div>
                        ) : item.type === 'event' ? (
                            // Event tile style from CalendarView - uses dynamic event_color
                            <div className="relative flex items-start gap-2 px-1.5 py-2.5 rounded-xl self-center min-w-[240px] w-fit overflow-hidden">
                                {/* Background with opacity for robust color handling */}
                                <div
                                    className="absolute inset-0 opacity-15"
                                    style={{ backgroundColor: item.event_color || '#e11d48' }}
                                />

                                <div
                                    className="relative w-1 self-stretch rounded-full flex-shrink-0"
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
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                            <MapPin className="w-2.5 h-2.5" />
                                            <span className="truncate">{item.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Default/fallback for unknown types
                            <div className="space-y-1">
                                {item.title && (
                                    <h4 className="font-bold text-heading-dark text-base line-clamp-1">
                                        {item.title}
                                    </h4>
                                )}
                                {item.content && (
                                    <p className="text-body-soft text-base line-clamp-2">
                                        {item.content}
                                    </p>
                                )}
                                {!item.title && !item.content && (
                                    <p className="text-[10px] text-gray-400">A memory from the past</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div >

            {/* Expanded Modal */}
            <AnimatePresence>
                {
                    isExpanded && (
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
                                    <div className="flex items-start justify-between px-6 py-3 border-b border-gray-50 shrink-0 bg-white">
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 mt-1">
                                                {getIcon()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-heading-dark">
                                                        {getLabel()}
                                                    </h3>
                                                    {getCategoryBadge()}
                                                </div>
                                                <p className="text-xs text-body-soft -mt-0.5">
                                                    {formatDate(item.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full p-2 transition-colors mt-1"
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

                                        <div className={`px-6 ${item.type === 'event' ? 'pt-2 pb-5' : 'py-3'} ${item.type === 'photo' ? 'space-y-2' : 'space-y-6'}`}>
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
                                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                        <div className="p-5 space-y-2">
                                                            {/* Header: Date | Avatar Row */}
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <DateBadge
                                                                        date={new Date(item.created_at)}
                                                                        className="w-10 h-11 shrink-0 scale-90 origin-left"
                                                                    />

                                                                    <UserAvatar
                                                                        user={getUser(item.uploader_id)}
                                                                        className="h-10 w-10 shadow-sm border border-gray-100 dark:border-gray-700"
                                                                    />
                                                                    {item.location && (
                                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            <MapPin className="w-3 h-3" />
                                                                            <span className="truncate max-w-[150px]">{item.location}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0 w-full">
                                                                    {item.title ? (
                                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight break-words">
                                                                            {item.title}
                                                                        </h3>
                                                                    ) : (
                                                                        <span className="text-gray-400 italic">Untitled Memory</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Caption */}
                                                            {item.content && (
                                                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                                    {item.content}
                                                                </p>
                                                            )}

                                                            {/* Image Carousel */}
                                                            {item.media_urls && item.media_urls.length > 0 && (
                                                                <div className="w-full mt-4">
                                                                    <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                                                                        <ImageCarousel
                                                                            images={item.media_urls}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
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

                                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-1 text-xs text-gray-500 font-medium">
                                                        <UserAvatar
                                                            user={getUser(item.uploader_id)}
                                                            className="w-5 h-5 border-none"
                                                            iconClassName="w-3 h-3"
                                                        />
                                                        <span>Uploaded by {getAuthorLabel(item.uploader_id)}</span>
                                                        {item.location && (
                                                            <>
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    <span className="truncate">{item.location}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

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
                                </motion.div >
                            </div >
                        </>
                    )
                }
            </AnimatePresence >
        </>
    );
}
