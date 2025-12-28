import { useEffect, useState, memo } from "react"
import type { Database } from "@/types/supabase"
import { format, addHours, differenceInMinutes } from "date-fns"
import { usePartnerNotes } from "@/hooks/usePartnerNotes"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface PartnerNoteTileProps {
    partner: Profile | null
}

export const PartnerNoteTile = memo(function PartnerNoteTile({ partner }: PartnerNoteTileProps) {
    const { partnerLastNote, markAsSeen } = usePartnerNotes();
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!partnerLastNote) {
            setIsVisible(false);
            return;
        }

        // 1. Mark as seen if not seen
        if (!partnerLastNote.metadata?.seen_at) {
            markAsSeen(partnerLastNote);
            // Don't show yet until we have a seen_at time (which happens via optimistic update in hook) or immediately if we want
            // Actually, for the timer to start, we need a seen_at. 
            // The hook optimistically updates, so partnerLastNote will have seen_at quickly.
        }

        // 2. Check Expiration & Timer
        const checkStatus = () => {
            if (!partnerLastNote.metadata?.seen_at) {
                // If not seen yet (and we just called markAsSeen), show it tentatively or wait? 
                // Let's show it. 
                setIsVisible(true);
                setTimeLeft("24h 00m");
                return;
            }

            const seenAt = new Date(partnerLastNote.metadata.seen_at);
            const expiresAt = addHours(seenAt, 24);
            const now = new Date();

            if (now > expiresAt) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
                const diffMins = differenceInMinutes(expiresAt, now);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                setTimeLeft(`${hours}h ${mins}m`);
            }
        };

        checkStatus();
        const timer = setInterval(checkStatus, 60000); // Update every minute

        return () => clearInterval(timer);

    }, [partnerLastNote, markAsSeen]);

    if (!partner || !partnerLastNote || !isVisible) return null

    return (
        <div className="rounded-2xl bg-[#FEF9C3] p-6 shadow-sm border border-yellow-200/50 relative overflow-hidden transition-all md:hover:shadow-md">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-yellow-900 text-lg"> {/* Increased font size */}
                    Note from {partner.first_name}
                </h3>
                <span className="material-symbols-outlined text-yellow-600 rotate-45 text-xl">
                    push_pin
                </span>
            </div>

            {/* Content */}
            <div>
                <p className="font-handwriting text-yellow-900 text-lg leading-snug whitespace-pre-wrap">
                    {partnerLastNote.caption}
                </p>
                {/* Date and Timer */}
                {/* Date and Timer */}
                <div className="mt-4 flex justify-between items-center">
                    {timeLeft ? (
                        <p className="text-xs text-yellow-700/60 font-medium font-mono">
                            {timeLeft}
                        </p>
                    ) : <div></div>}
                    <p className="text-xs text-yellow-700/60 font-medium">
                        {format(new Date(partnerLastNote.created_at), 'MMM d, h:mm a')}
                    </p>
                </div>
            </div>
        </div>
    )
})
