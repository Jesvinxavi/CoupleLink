
import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import { AddEventOverlay, type CalendarEvent } from "../calendar/AddEventOverlay"
import { UserAvatar } from '../ui/UserAvatar'
import { differenceInDays, parseISO, setYear, isBefore, addYears, startOfDay } from "date-fns"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface PartnerTileProps {
    partner: Profile | null
}

export function PartnerTile({ partner }: PartnerTileProps) {
    const { onlineUsers } = useAuth()
    const { couple } = useCoupleData()
    const [partnerTime, setPartnerTime] = useState<string>("")
    const [timeIcon, setTimeIcon] = useState("schedule")
    const [showExpandedAvatar, setShowExpandedAvatar] = useState(false)

    const [anniversaryDays, setAnniversaryDays] = useState<number | null>(null)
    const [isAddAnniversaryOpen, setIsAddAnniversaryOpen] = useState(false)

    const isOnline = partner ? onlineUsers.includes(partner.id) : false

    useEffect(() => {
        if (!partner?.timezone) return

        const updateTime = () => {
            try {
                const now = new Date()
                const timeString = new Intl.DateTimeFormat('en-US', {
                    timeZone: partner.timezone!,
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                }).format(now)
                setPartnerTime(timeString)

                // Set icon based on hour
                const hour = parseInt(new Intl.DateTimeFormat('en-US', {
                    timeZone: partner.timezone!,
                    hour: 'numeric',
                    hour12: false
                }).format(now))

                if (hour >= 6 && hour < 18) {
                    setTimeIcon("wb_sunny") // Day
                } else {
                    setTimeIcon("bedtime") // Night
                }
            } catch (e) {
                console.error("Invalid timezone", e)
                setPartnerTime("")
            }
        }

        updateTime()
        const interval = setInterval(updateTime, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [partner?.timezone])

    const fetchAnniversary = async () => {
        if (!couple) return

        // Check calendar events first
        const { data: events } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('couple_id', couple.id)
            .eq('category', 'Anniversary')
            .limit(1)

        let anniversaryDateStr = events?.[0]?.event_date || couple.anniversary_date

        if (anniversaryDateStr) {
            const today = startOfDay(new Date())
            const anniversaryDate = parseISO(anniversaryDateStr)
            let nextAnniversary = setYear(anniversaryDate, today.getFullYear())

            // If anniversary has passed this year, look at next year
            if (isBefore(nextAnniversary, today)) {
                nextAnniversary = addYears(nextAnniversary, 1)
            }

            const days = differenceInDays(nextAnniversary, today)
            setAnniversaryDays(days)
        } else {
            setAnniversaryDays(null)
        }
    }

    useEffect(() => {
        fetchAnniversary()
    }, [couple?.id, couple?.anniversary_date])

    const handleSaveAnniversary = async (event: CalendarEvent) => {
        if (!couple) return
        try {
            // Save to calendar_events
            const { error } = await supabase
                .from('calendar_events')
                .insert({
                    couple_id: couple.id,
                    title: event.title,
                    event_date: event.event_date,
                    end_date: event.end_date,
                    category: event.category,
                    color: event.color,
                    location: event.location,
                    description: event.description
                })

            if (error) throw error

            // Also update couple profile if not set
            if (!couple.anniversary_date) {
                await supabase
                    .from('couples')
                    .update({ anniversary_date: event.event_date })
                    .eq('id', couple.id)
            }

            await fetchAnniversary()
        } catch (error) {
            console.error('Error saving anniversary:', error)
        }
    }



    if (!partner) {
        if (couple && !couple.user_two_id) {
            return (
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-dashed border-gray-200">
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">person_add</span>
                        </div>
                        <div>
                            <p className="font-medium">Waiting for partner...</p>
                            <p className="text-xs">Share your invite code!</p>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-2xl bg-white p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <UserAvatar
                            user={partner}
                            className="h-16 w-16 border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowExpandedAvatar(true)}
                        />
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm"></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-heading-dark truncate">{partner.first_name}</h2>

                        <div className="flex flex-col gap-1 mt-1">
                            {/* Time & Weather */}
                            <div className="flex items-center gap-3">
                                {partnerTime && (
                                    <div className="flex items-center gap-1 text-xs text-body-soft">
                                        <span className="material-symbols-outlined text-base">schedule</span>
                                        <span>{partnerTime}</span>
                                    </div>
                                )}
                                {partnerTime && (
                                    <div className="flex items-center gap-1 text-xs text-body-soft">
                                        <span className="material-symbols-outlined text-base">{timeIcon}</span>
                                        <span>{timeIcon === 'wb_sunny' ? 'Day' : 'Night'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Anniversary */}
                            {anniversaryDays !== null ? (
                                <div className="text-xs font-medium text-rose-500">
                                    Anniversary in: {anniversaryDays} days
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddAnniversaryOpen(true)}
                                    className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors w-fit"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add anniversary
                                </button>
                            )}
                        </div>
                    </div>


                </div>
            </div>

            {/* Expanded Avatar Overlay */}
            {showExpandedAvatar && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowExpandedAvatar(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <UserAvatar
                            user={partner}
                            className="h-64 w-64 md:h-96 md:w-96 border-4 border-white shadow-2xl"
                        />

                    </motion.div>
                </div>
            )}

            <AddEventOverlay
                isOpen={isAddAnniversaryOpen}
                onClose={() => setIsAddAnniversaryOpen(false)}
                selectedDate={new Date()}
                initialValues={{
                    title: 'Anniversary',
                    category: 'Anniversary',
                    color: '#ec4899'
                }}
                onSave={handleSaveAnniversary}
                onDelete={async () => { }} // Not needed for add
            />
        </>
    )
}
