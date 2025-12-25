import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import { format } from "date-fns"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface PartnerNoteTileProps {
    partner: Profile | null
}

export function PartnerNoteTile({ partner }: PartnerNoteTileProps) {
    const [note, setNote] = useState<{ caption: string, created_at: string } | null>(null)

    const fetchNote = useCallback(async () => {
        if (!partner || !partner.couple_id) return

        const { data } = await supabase
            .from('memories')
            .select('caption, created_at')
            .eq('uploader_id', partner.id)
            .eq('couple_id', partner.couple_id!)
            .eq('type', 'sticky_note')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (data) {
            setNote({
                caption: data.caption || "",
                created_at: data.created_at
            })
        } else {
            setNote(null)
        }
    }, [partner?.id])

    useEffect(() => {
        if (!partner) return

        // Initial Fetch
        fetchNote()

        // Robust Subscription
        const channelName = `partner-notes-${partner.id}`
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'memories',
                    filter: `uploader_id=eq.${partner.id}&couple_id=eq.${partner.couple_id}`
                },
                (payload) => {
                    if (payload.new.type === 'sticky_note') {
                        setNote({
                            caption: payload.new.caption || "",
                            created_at: payload.new.created_at
                        })
                    }
                }
            )
            .on('broadcast', { event: 'note_update' }, () => {
                // Determine if the update is relevant (could filter by ID if passed, but refetching is safe)
                fetchNote()
            })
            .subscribe()

        // Polling Fallback (30s)
        const interval = setInterval(fetchNote, 30000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [partner?.id, fetchNote])

    if (!partner || !note) return null

    return (
        <div className="rounded-2xl bg-[#FEF9C3] p-6 shadow-sm border border-yellow-200/50 relative overflow-hidden transition-all hover:shadow-md">
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
                    {note.caption}
                </p>
                {/* Date moved to a new block below content */}
                <div className="mt-4 flex justify-end">
                    <p className="text-xs text-yellow-700/60 font-medium">
                        {format(new Date(note.created_at), 'MMM d, h:mm a')}
                    </p>
                </div>
            </div>
        </div>
    )
}
