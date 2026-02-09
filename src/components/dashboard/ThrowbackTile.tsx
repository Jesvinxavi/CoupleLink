// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useCoupleData } from "@/hooks/useCoupleData"
import {
    Loader2,
    Calendar,
    CalendarDays,
    Quote,
    Image as ImageIcon,
    HelpCircle,
    X,
    MapPin,
    Heart,
    Sparkles,
    Ticket,
    StickyNote,
    Trophy,
    CircleDashed,
    Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { positions } from "@/data/positionsData"
import { PositionSVG } from "@/components/sexploration/PositionSVG"
import { DateBadge } from "@/components/ui/DateBadge"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { ImageCarousel } from "@/components/ui/ImageCarousel"
import { URGENCY_THRESHOLDS } from "@/lib/constants"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface MemoryItem {
    id: string
    type: "journal" | "photo" | "challenge" | "position" | "fantasy" | "voucher" | "sticky_note" | "event" | "quiz"
    content: string | null
    title?: string | null
    media_urls?: string[] | null
    location?: string | null
    created_at: string
    activity_question?: string
    category?: string
    // Attribution fields
    uploader_id?: string | null // For journals, photos, sticky_notes
    requester_id?: string | null // For fantasies
    assigned_to?: string | null // For vouchers (redeemer)
    // Challenge answers stored by user position (not viewer-relative)
    user_one_id?: string | null
    user_one_answer?: string | null
    user_two_id?: string | null
    user_two_answer?: string | null
    // Event color from calendar
    event_color?: string | null
    challenge_type?: "daily" | "weekly" | "monthly" | null
    is_competition?: boolean
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function ThrowbackTile() {
    const { couple, currentUser, partner, userProfile } = useCoupleData()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [item, setItem] = useState<MemoryItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
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
                const seed = Math.floor(today.getTime() / URGENCY_THRESHOLDS.ONE_DAY);



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
                    const twoDaySeed = Math.floor(today.getTime() / URGENCY_THRESHOLDS.TWO_DAYS);
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
                    if ((selectedItem.type === 'challenge' || selectedItem.type === 'quiz') && selectedItem.extra_data?.answers) {
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
                        challenge_type: selectedItem.extra_data?.challenge_type,
                        is_competition: !!selectedItem.extra_data?.is_competition,
                        partner_completed: !!selectedItem.extra_data?.partner_completed,
                        ...challengeAnswers
                    });
                } else {
                    setItem(null);
                }

            } catch (err) {
                logger.error("ThrowbackTile", "Error fetching On This Day", err)
                setItem(null)
            } finally {
                setLoading(false)
            }
        }

        fetchThrowback()
    }, [couple?.id, currentUser?.id, userProfile?.timezone])

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (loading) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
        )
    }

    if (!item) {
        return null
    }



    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    }

    const getIcon = () => {
        const iconClasses = "w-5 h-5 text-rose-500"
        switch (item.type) {
            case "photo": return <ImageIcon className={iconClasses} />
            case "journal": return <Quote className={iconClasses} />
            case "challenge": return <HelpCircle className={iconClasses} />
            case "position": return <Heart className={iconClasses} />
            case "fantasy": return <Sparkles className={iconClasses} />
            case "voucher": return <Ticket className={iconClasses} />
            case "sticky_note": return <StickyNote className={iconClasses} />
            case "event": return <CalendarDays className={iconClasses} />
            case "quiz": return <HelpCircle className={iconClasses} />
            default: return <Calendar className={iconClasses} />
        }
    }

    const getCategoryBadge = () => {
        const baseClasses = "ml-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"

        switch (item.type) {
            case "photo":
                return <span className={`${baseClasses} bg-blue-100 text-blue-600`}>Photo Memory</span>
            case "journal":
                return <span className={`${baseClasses} bg-amber-100 text-amber-600`}>Journal</span>
            case "challenge":
                return (
                    <div className="flex items-center gap-1.5 ml-1">
                        <span className={`${baseClasses} bg-purple-100 text-purple-600`}>
                            Challenge
                        </span>
                    </div>
                )
            case "sticky_note":
                return <span className={`${baseClasses} bg-yellow-100 text-yellow-600`}>Note</span>
            case "event":
                return <span className={`${baseClasses} bg-indigo-100 text-indigo-600`}>Past Event</span>
            case "position":
                return <span className={`${baseClasses} bg-rose-100 text-rose-600`}>Position</span>
            case "fantasy":
                return <span className={`${baseClasses} bg-pink-100 text-pink-600`}>Fantasy</span>
            case "voucher":
                return <span className={`${baseClasses} bg-emerald-100 text-emerald-600`}>Voucher</span>
            case "quiz":
                return <span className={`${baseClasses} bg-rose-100 text-rose-600`}>Daily Question</span>
            default:
                return null
        }
    }


    // Fix: item.title contains position_id (slug) from RPC, so match against p.id
    const position = item.type === "position" ? positions.find((p) => p.id === item.title) : null

    const getLabel = () => {
        return "Throwback"
    }

    // Helper for dynamic attribution labels
    const getAuthorLabel = (userId: string | null | undefined) =>
        userId === currentUser?.id ? "You" : (partner?.first_name || "Partner")

    // Compute challenge answers based on viewer
    const myAnswer = item.user_one_id === currentUser?.id ? item.user_one_answer : item.user_two_answer
    const partnerAnswerText = item.user_one_id === currentUser?.id ? item.user_two_answer : item.user_one_answer

    // Logic for completion states
    // A challenge is fully completed if the current user has a memory (evident by item existence) AND proper answer OR partner_completed flag is true
    // However, this 'item' IS the current user's memory (usually). 
    // If 'item.uploader_id' is me, then I have completed it.
    // If 'item.uploader_id' is partner, then partner has completed it.

    const uploaderIsMe = item.uploader_id === currentUser?.id
    const uploaderIsPartner = item.uploader_id === partner?.id

    const iHaveCompleted = uploaderIsMe || (!!myAnswer); // I uploaded it OR I have an answer recorded
    const partnerHasCompleted = uploaderIsPartner || (!!partnerAnswerText) || (item as any).partner_completed; // Partner uploaded it OR partner has answer OR flag is true

    const isFullyCompleted = iHaveCompleted && partnerHasCompleted;
    const isPartiallyCompleted = !isFullyCompleted && (iHaveCompleted || partnerHasCompleted);
    const hasAnswers = !!myAnswer || !!partnerAnswerText;

    const hasMedia = item.media_urls && item.media_urls.length > 0;
    const coverImage = hasMedia ? item.media_urls![0] : null;

    const getUser = (userId: string | null | undefined) => {
        if (!userId) return null
        if (userId === currentUser?.id) return userProfile
        if (userId === partner?.id) return partner
        return null
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
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
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 flex flex-col p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col min-w-0">
                            <div className={`flex items-start gap-2 ${item.type === 'photo' && coverImage ? 'bg-black/40 backdrop-blur-md rounded-lg px-2 py-1.5' : ''}`}>
                                <div className={`shrink-0 mt-1`}>
                                    {getIcon()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <h3 className={`text-lg font-bold ${item.type === 'photo' ? 'text-white' : 'text-heading-dark'}`}>
                                        {getLabel()}
                                    </h3>
                                    {getCategoryBadge()}
                                </div>
                            </div>
                            <p className={`text-xs mt-0.5 ${item.type === 'photo' ? 'text-white/80' : 'text-body-soft'}`}>
                                {formatDate(item.created_at)}
                            </p>
                        </div>
                        <span className={`material-symbols-outlined transition-colors ${item.type === 'photo' ? 'text-white/60 md:group-hover:text-white group-active:text-white' : 'text-gray-400 md:group-hover:text-gray-600 group-active:text-gray-600'}`}>
                            arrow_forward
                        </span>
                    </div>

                    {/* Content Preview */}
                    <div className={`flex flex-col ${item.type === 'photo' && coverImage ? 'flex-1 min-h-[140px] justify-end' : 'justify-start'}`}>
                        {item.type === 'photo' ? (
                            <div className={`flex flex-col items-end space-y-1 ${coverImage ? 'mt-auto' : ''}`}>
                                <div className={`${coverImage ? 'bg-black/40 backdrop-blur-md rounded-xl p-3 inline-block max-w-full' : ''}`}>
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
                            </div>
                        ) : item.type === 'journal' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-4 space-y-2 min-w-[75%] mx-auto">
                                <div className="flex items-center gap-2">
                                    <UserAvatar
                                        user={getUser(item.uploader_id)}
                                        className="h-6 w-6 shrink-0"
                                    />
                                    {item.title ? (
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight break-words line-clamp-2">
                                            {item.title}
                                        </h3>
                                    ) : (
                                        <span className="text-gray-400 italic">Untitled Memory</span>
                                    )}
                                </div>
                                {item.content && (
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-3 text-sm">
                                        {item.content}
                                    </p>
                                )}
                                {item.location && (
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate">{item.location}</span>
                                    </p>
                                )}
                            </div>
                        ) : item.type === 'challenge' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3 min-w-[75%] mx-auto relative overflow-hidden">
                                {/* Tab Notch */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-100 dark:bg-purple-900/30" />

                                <div className="space-y-1">
                                    {/* Challenge Title + Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                            {item.title || item.activity_question || 'Challenge'}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            {item.challenge_type && (
                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 uppercase">
                                                    {item.challenge_type}
                                                </span>
                                            )}
                                            {item.is_competition && (
                                                <span className="p-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                                                    <Trophy className="w-2.5 h-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Completion Status + Answers */}
                                    <div className="space-y-1.5 pt-1">
                                        {hasAnswers && (
                                            <div className="space-y-1">
                                                {myAnswer && (
                                                    <div className="flex items-start gap-1.5">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 shrink-0">You:</span>
                                                        <p className="text-gray-600 dark:text-gray-300 text-[11px] line-clamp-1 italic leading-tight">
                                                            "{myAnswer}"
                                                        </p>
                                                    </div>
                                                )}
                                                {partnerAnswerText && (
                                                    <div className="flex items-start gap-1.5">
                                                        <span className="text-[10px] font-bold text-rose-400 uppercase mt-0.5 shrink-0">{partner?.first_name?.charAt(0) || 'P'}:</span>
                                                        <p className="text-gray-600 dark:text-gray-300 text-[11px] line-clamp-1 italic leading-tight">
                                                            "{partnerAnswerText}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isFullyCompleted ? (
                                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mt-1">
                                                <Check className="w-4 h-4 text-green-600 dark:text-green-500 stroke-[3]" />
                                                <p className="text-[10px] font-bold uppercase">Challenge completed by both</p>
                                            </div>
                                        ) : isPartiallyCompleted ? (
                                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mt-1">
                                                <CircleDashed className="w-3.5 h-3.5" />
                                                <p className="text-[10px] font-bold uppercase">Partially completed by {iHaveCompleted ? 'You' : (partner?.first_name || 'Partner')}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : item.type === 'position' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3 min-w-[75%] mx-auto relative overflow-hidden">
                                {/* Tab Notch - Rose for Positions */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-100 dark:bg-rose-900/30" />

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        {position && <PositionSVG position={position} size="sm" />}
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1 capitalize">
                                                {position?.name || (item.title || '').replace(/-/g, ' ')}
                                            </h4>
                                            {item.category && (
                                                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">{item.category}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mt-2 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                                        <Check className="w-4 h-4 text-green-600 dark:text-green-500 stroke-[3]" />
                                        <p className="text-[10px] font-bold uppercase">Position Completed</p>
                                    </div>
                                </div>
                            </div>
                        ) : item.type === 'fantasy' ? (
                            // Fantasy tile matching Event tab style (centered, not full width)
                            <div className="relative flex items-start gap-2 px-3 py-2.5 rounded-xl self-center min-w-[240px] w-fit mx-auto overflow-hidden bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                <div className="flex-1 min-w-0 text-left">
                                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-base leading-tight mb-2 text-left">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-start gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                                        <UserAvatar
                                            user={getUser(item.uploader_id)}
                                            className="w-3.5 h-3.5 border-none"
                                            iconClassName="w-2.5 h-2.5"
                                        />
                                        <span>Suggested by {getAuthorLabel(item.uploader_id)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : item.type === 'voucher' ? (
                            // Pleasure coupon style from Coupon.tsx
                            <div className="relative h-[90px] bg-pink-200 rounded-none overflow-hidden self-center min-w-[240px] w-fit mx-auto" style={{
                                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180' preserveAspectRatio='none'%3E%3Cpath fill='white' fill-rule='evenodd' d='M0,0 L300,0 L300,180 L0,180 Z M0,30 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,58 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,108 a18,18 0 0,0 0,-36 a18,18 0 0,0 0,36 M0,136 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M0,164 a8,8 0 0,0 0,-16 a8,8 0 0,0 0,16 M300,30 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,58 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,108 a18,18 0 0,1 0,-36 a18,18 0 0,1 0,36 M300,136 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16 M300,164 a8,8 0 0,1 0,-16 a8,8 0 0,1 0,16'/%3E%3C/svg%3E")`,
                                maskSize: '100% 100%',
                                WebkitMaskSize: '100% 100%',
                            }}>
                                {/* Header Banner */}
                                <div className="absolute top-1 left-4 right-4 h-[18px] bg-pink-100 border-b border-red-600">
                                    <div className="w-full py-0.5 text-center font-normal tracking-[0.15em] uppercase text-[8px] text-[#FF1744]">
                                        Pleasure Coupon
                                    </div>
                                </div>
                                {/* Inner Red Box Outline */}
                                <div className="absolute top-1 bottom-1 left-4 right-4 border border-red-600 opacity-50 pointer-events-none" />
                                {/* Main Body */}
                                <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center pt-[22px] pb-1.5 px-4">
                                    <div className="flex-1 flex flex-col items-center justify-center gap-0.5 w-full min-h-0">
                                        <h3 className="text-base leading-tight text-[#FF1744] text-center line-clamp-1 w-full" style={{ fontFamily: "'Shrikhand', cursive" }}>
                                            {item.title || "COUPON"}
                                        </h3>
                                        <p className="text-[8px] text-[#FF1744] font-bold uppercase tracking-wide line-clamp-1 w-full text-center">
                                            {item.content || "Valid for one special request"}
                                        </p>
                                    </div>

                                    {/* Redeemed Badge */}
                                    <div className="flex items-center justify-center gap-1.5 shrink-0">
                                        <UserAvatar
                                            user={getUser(item.assigned_to)}
                                            className="w-3.5 h-3.5 border-none"
                                            iconClassName="w-2.5 h-2.5"
                                        />
                                        <span className="text-[8px] text-gray-500 font-medium">
                                            Redeemed by {getAuthorLabel(item.assigned_to)}
                                        </span>
                                    </div>
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
                        ) : item.type === 'quiz' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-4 space-y-3 w-fit mx-auto relative overflow-hidden">
                                {/* Tab Notch - Rose for Questions */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-100 dark:bg-rose-900/30" />

                                <div className="space-y-1">
                                    {/* Question Title */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                            {item.title}
                                        </h4>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mt-1">
                                            <Check className="w-4 h-4 text-green-600 dark:text-green-500 stroke-[3]" />
                                            <p className="text-[10px] font-bold uppercase">Answered by both</p>
                                        </div>
                                    </div>
                                </div>
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
            </motion.div>

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
                                        <div className="flex flex-col">
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 mt-1">
                                                    {getIcon()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-heading-dark">
                                                        {getLabel()}
                                                    </h3>
                                                    {getCategoryBadge()}
                                                </div>
                                            </div>
                                            <p className="text-xs text-body-soft mt-0.5">
                                                {formatDate(item.created_at)}
                                            </p>
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
                                        {/* Image (if available) - Exclude journal and challenge as they have it inside the post */}
                                        {hasMedia && item.type !== 'journal' && item.type !== 'challenge' && (
                                            <div className="w-full px-6 pt-6">
                                                <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-sm">
                                                    <img
                                                        src={coverImage!}
                                                        alt="Memory"
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className={`px-6 ${item.type === 'event' ? 'pt-2 pb-5' : 'py-3'} ${item.type === 'photo' ? 'space-y-2' : 'space-y-6'}`}>
                                            {item.type === 'challenge' ? (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="text-2xl font-bold text-heading-dark">
                                                                {item.title || item.activity_question || 'Challenge'}
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                {item.challenge_type && (
                                                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-sm font-bold text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 uppercase">
                                                                        {item.challenge_type}
                                                                    </span>
                                                                )}
                                                                {item.is_competition && (
                                                                    <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                                                                        <Trophy className="w-4 h-4" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {item.content && (
                                                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                                                                {item.content}
                                                            </p>
                                                        )}

                                                        {/* Photo Carousel for Challenges */}
                                                        {item.media_urls && item.media_urls.length > 0 && (
                                                            <div className="w-full">
                                                                <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
                                                                    <ImageCarousel
                                                                        images={item.media_urls}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>



                                                    {/* Show answers or completion status */}
                                                    {/* Show completion status and answers */}
                                                    {/* Show completion status and answers */}
                                                    <div className="space-y-6">
                                                        {hasAnswers && (
                                                            <div className="space-y-4">
                                                                {myAnswer && (
                                                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">You Answered</p>
                                                                        <p className="text-gray-900 dark:text-gray-100 italic text-lg leading-relaxed">"{myAnswer}"</p>
                                                                    </div>
                                                                )}
                                                                {partnerAnswerText && (
                                                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                                        <p className="text-xs font-bold text-rose-400 dark:text-rose-500 uppercase mb-2">{partner?.first_name || 'Partner'} Answered</p>
                                                                        <p className="text-gray-900 dark:text-gray-100 italic text-lg leading-relaxed">"{partnerAnswerText}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {isFullyCompleted ? (
                                                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl flex items-center gap-3 border border-green-100 dark:border-green-900/30">
                                                                <Check className="w-5 h-5 text-green-600 dark:text-green-500 stroke-[3]" />
                                                                <p className="text-green-800 dark:text-green-400 font-bold text-sm text-center">Challenge completed by both</p>
                                                            </div>
                                                        ) : isPartiallyCompleted ? (
                                                            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl flex items-center gap-4 border border-amber-100 dark:border-amber-900/30">
                                                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                                                    <CircleDashed className="w-7 h-7 text-amber-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-amber-800 dark:text-amber-400 font-bold text-lg">Partially completed</p>
                                                                    <p className="text-amber-600 dark:text-amber-500 text-sm">Done by {(myAnswer ? currentUser : partner as any)?.first_name || 'Partner'}</p>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : item.type === 'quiz' ? (
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <h3 className="text-2xl font-bold text-heading-dark">
                                                            {item.title}
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {myAnswer && (
                                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">You Answered</p>
                                                                <p className="text-gray-900 dark:text-gray-100 italic text-lg leading-relaxed">"{myAnswer}"</p>
                                                            </div>
                                                        )}
                                                        {partnerAnswerText && (
                                                            <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                                <p className="text-xs font-bold text-rose-400 dark:text-rose-500 uppercase mb-2">{partner?.first_name || 'Partner'} Answered</p>
                                                                <p className="text-gray-900 dark:text-gray-100 italic text-lg leading-relaxed">"{partnerAnswerText}"</p>
                                                            </div>
                                                        )}

                                                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl flex items-center gap-3 border border-green-100 dark:border-green-900/30">
                                                            <Check className="w-5 h-5 text-green-600 dark:text-green-500 stroke-[3]" />
                                                            <p className="text-green-800 dark:text-green-400 font-bold text-sm text-center">Answered by both</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : item.type === 'position' ? (
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="flex items-center gap-4 w-full justify-center">
                                                                {position && <div className="shrink-0"><PositionSVG position={position} size="md" /></div>}
                                                                <h3 className="text-2xl font-bold text-heading-dark text-center capitalize">
                                                                    {position?.name || (item.title || '').replace(/-/g, ' ')}
                                                                </h3>
                                                            </div>

                                                            {item.category && (
                                                                <span className="inline-block px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wide">
                                                                    {item.category}
                                                                </span>
                                                            )}

                                                            <p className="text-body-soft leading-relaxed text-center px-4">
                                                                {position?.description || item.content}
                                                            </p>
                                                        </div>

                                                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl flex items-center justify-center gap-3 border border-green-100 dark:border-green-900/30">
                                                            <Check className="w-5 h-5 text-green-600 dark:text-green-500 stroke-[3]" />
                                                            <p className="text-green-800 dark:text-green-400 font-bold text-sm text-center">Position Completed</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : item.type === 'fantasy' ? (
                                                <div className="relative overflow-hidden p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">

                                                    <div className="space-y-4 text-left">
                                                        {/* Title */}
                                                        <h3 className="text-2xl font-bold text-heading-dark">
                                                            {item.title}
                                                        </h3>

                                                        {/* Completion Indicator */}
                                                        <div className="flex items-center justify-start gap-2 text-green-600 dark:text-green-500">
                                                            <Check className="w-5 h-5 stroke-[3]" />
                                                            <span className="font-bold text-sm uppercase">Fantasy Completed</span>
                                                        </div>

                                                        {/* Suggested By */}
                                                        <div className="flex items-center justify-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <UserAvatar
                                                                user={getUser(item.uploader_id)}
                                                                className="w-5 h-5"
                                                            />
                                                            <span>Suggested by {getAuthorLabel(item.uploader_id)}</span>
                                                        </div>
                                                    </div>
                                                </div>
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
                                                            <div className="p-2 w-full border-t border-gray-400 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase">
                                                                <UserAvatar
                                                                    user={getUser(item.assigned_to)}
                                                                    className="w-4 h-4 border-none"
                                                                    iconClassName="w-3 h-3"
                                                                />
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
                                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
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
                                                                    loading="lazy"
                                                                    decoding="async"
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
