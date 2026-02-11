// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useCoupleData } from "@/hooks/useCoupleData"
import { logger } from "@/lib/logger"
import { debugLog } from "@/lib/debug"

// Maps notification type to section for preference checking
const SECTION_MAP: Record<string, string> = {
    daily_question: "challenges_streak",
    challenge_completion: "challenges_streak",
    streak_expiry: "challenges_streak",
    daily_expiry: "challenges_streak",
    weekly_expiry: "challenges_streak",
    monthly_expiry: "challenges_streak",
    fantasies: "sexploration_fun",
    coupons: "sexploration_fun",
    coupon_activation: "sexploration_fun",
    calendar_events: "dates_reminders",
    new_sticky_note: "dates_reminders",
    new_journal_post: "dates_reminders",
    partner_birthday: "dates_reminders",
    my_birthday: "dates_reminders",
    anniversary: "dates_reminders"
}

// Notification message templates with random selection
const NOTIFICATION_MESSAGES: Record<string, string[]> = {
    daily_question: [
        "Your partner answered the Daily Question! 💬",
        "See what your partner answered for today's question! 👀"
    ],
    challenge_completion: [
        "Partner completed a Challenge! 🏆",
        "Challenge done by partner! Your turn! ⚡"
    ],
    new_journal_post: [
        "New Journal Post from partner! 📖",
        "Partner shared a moment in the Journal. Tap to see! ✨"
    ],
    new_sticky_note: [
        "You have a new sticky note! 📝",
        "Partner left you a love note. Tap to read! 💌"
    ],
    fantasies_added: [
        "Partner added a new fantasy... 🔥",
        "New fantasy from your partner! Check it out! 💕"
    ],
    fantasies_approved: [
        "It's a match! Your fantasy was approved! 💖",
        "Fantasy approved! Your partner is on board! 🎉"
    ],
    coupons: [
        "You received a Pleasure Coupon! 🎁",
        "Lucky you! Partner sent a coupon. Redeem it soon! 🎟️"
    ],
    coupon_activation: [
        "Partner activated a Pleasure Coupon! 🔥",
        "It's happening! Partner activated a coupon. Get ready! ⚡"
    ],
    calendar_events: [
        "New Event added to your calendar! 📅",
        "Partner planned something special! 🥂"
    ]
}

// Get random message from templates
const getMessage = (type: string): string => {
    const messages = NOTIFICATION_MESSAGES[type]
    if (!messages || messages.length === 0) {
        return "New notification from CoupleLink"
    }
    return messages[Math.floor(Math.random() * messages.length)]
}

// Get notification title based on type
const getTitle = (type: string): string => {
    const titles: Record<string, string> = {
        daily_question: "Daily Question",
        challenge_completion: "Challenge Complete",
        new_journal_post: "New Journal Entry",
        new_sticky_note: "Love Note",
        fantasies_added: "New Fantasy",
        fantasies_approved: "Fantasy Approved",
        coupons: "New Coupon",
        coupon_activation: "Coupon Activated",
        calendar_events: "Calendar Event"
    }
    return titles[type] || "CoupleLink"
}

interface NotificationPreferences {
    master_toggle: boolean
    sections: Record<string, boolean>
    types: Record<string, boolean>
}

export function NotificationListener() {
    const { user } = useAuth()
    const { couple, userProfile } = useCoupleData()
    const prefsRef = useRef<NotificationPreferences | null>(null)

    // Keep prefs updated in ref to access inside subscription closures
    useEffect(() => {
        if (userProfile?.notification_preferences) {
            prefsRef.current = userProfile.notification_preferences as unknown as NotificationPreferences
            // Simple debug log to confirm update (optional, can be removed)
            // console.log('[NOTIF] Prefs ref updated:', prefsRef.current)
        }
    }, [userProfile])

    // ═══════════════════════════════════════
    // DEBUG HELPER
    // ═══════════════════════════════════════
    const dbg = useCallback((tag: string, msg: string, data?: unknown) => {
        const formatted = `[${tag}] ${msg}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`
        debugLog(`[NOTIF] ${formatted}`, 'info')
        console.log(`%c[NOTIF-DEBUG] [${tag}]%c ${msg}`, 'color: #ff6b6b; font-weight: bold', 'color: inherit', data !== undefined ? data : '')
    }, [])

    // Check if notification should be shown based on preferences
    const shouldNotify = useCallback((type: string, prefs: NotificationPreferences | null): boolean => {
        if (!prefs) {
            dbg('PREFS', `No prefs found for type="${type}", defaulting to ALLOW`)
            return true;
        }
        if (!prefs.master_toggle) {
            dbg('PREFS', `master_toggle=OFF, BLOCKING type="${type}"`)
            return false;
        }

        const section = SECTION_MAP[type];
        if (section && prefs.sections && !prefs.sections[section]) {
            dbg('PREFS', `Section "${section}" disabled, BLOCKING type="${type}"`)
            return false;
        }
        if (prefs.types && prefs.types[type] === false) {
            dbg('PREFS', `Type "${type}" explicitly disabled, BLOCKING`)
            return false;
        }

        dbg('PREFS', `type="${type}" ALLOWED (master=ON, section="${section}"=ON, type=ON)`)
        return true
    }, [dbg])

    // Show notification using browser Notification API
    const showNotification = useCallback((type: string, customBody?: string) => {
        dbg('SHOW', `Attempting to show notification type="${type}"`)
        dbg('SHOW', `Notification API exists: ${"Notification" in window}, permission: ${("Notification" in window) ? Notification.permission : 'N/A'}`)

        if ("Notification" in window && Notification.permission === "granted") {
            try {
                const baseUrl = import.meta.env.BASE_URL || "/"
                const title = getTitle(type)
                const body = customBody || getMessage(type)
                dbg('SHOW', `Creating notification: title="${title}", body="${body}"`)
                new Notification(title, {
                    body,
                    icon: `${baseUrl}pwa-icon.svg`,
                    tag: `couplelink-${type}`
                })
                dbg('SHOW', `✅ Notification created successfully for type="${type}"`)
            } catch (e) {
                dbg('SHOW', `❌ Notification creation FAILED for type="${type}"`, e)
                logger.error("NotificationListener", "Notification creation failed", e)
            }
        } else {
            dbg('SHOW', `❌ Cannot show notification - API missing or permission not granted`)
        }
    }, [dbg])

    useEffect(() => {
        if (!user || !couple) {
            dbg('INIT', `Skipping setup: user=${!!user}, couple=${!!couple}`)
            return
        }

        dbg('INIT', `Setting up NotificationListener for user=${user.id}, couple=${couple.id}`)

        // Request permission on mount
        if ("Notification" in window) {
            dbg('INIT', `Browser Notification permission: ${Notification.permission}`)
            if (Notification.permission === "default") {
                dbg('INIT', `Requesting notification permission...`)
                Notification.requestPermission().then(result => {
                    dbg('INIT', `Permission result: ${result}`)
                })
            }
        } else {
            dbg('INIT', `❌ Browser does NOT support notifications`)
            logger.warn("NotificationListener", "This browser does not support desktop notifications.")
            return
        }

        // Update timezone in profile
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        supabase
            .from("profiles")
            .update({ timezone })
            .eq("id", user.id)
            .then(({ error }) => {
                if (error) logger.error("NotificationListener", "Failed to update timezone", error)
            })

        // Helper to log channel status changes
        const logChannelStatus = (channelName: string) => (status: string, err?: Error) => {
            if (err) {
                dbg('CHANNEL', `❌ ${channelName} status=${status} ERROR:`, err)
            } else {
                dbg('CHANNEL', `${channelName} status=${status}`)
            }
        }

        // ============================================
        // MEMORIES CHANNEL (Journal, Sticky Notes, Challenges)
        // ============================================
        dbg('SETUP', `Creating memories-changes channel with filter: couple_id=eq.${couple.id}`)
        const memoriesChannel = supabase
            .channel("memories-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "memories",
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('MEMORIES', `📥 INSERT received on memories table`, {
                        id: payload.new.id,
                        type: payload.new.type,
                        uploader_id: payload.new.uploader_id,
                        couple_id: payload.new.couple_id,
                        current_user_id: user.id,
                        is_from_partner: payload.new.uploader_id !== user.id
                    })

                    if (payload.new.uploader_id !== user.id) {
                        const memoryType = payload.new.type;
                        dbg('MEMORIES', `Event is from partner, memoryType="${memoryType}"`)

                        if (memoryType === "journal") {
                            dbg('MEMORIES', `→ Checking journal notification preferences...`)
                            if (shouldNotify("new_journal_post", prefsRef.current)) {
                                showNotification("new_journal_post")
                            }
                        } else if (memoryType === "sticky_note") {
                            dbg('MEMORIES', `→ Checking sticky_note notification preferences...`)
                            if (shouldNotify("new_sticky_note", prefsRef.current)) {
                                showNotification("new_sticky_note")
                            }
                        } else if (memoryType === "challenge") {
                            dbg('MEMORIES', `→ Checking challenge notification preferences...`)
                            if (shouldNotify("challenge_completion", prefsRef.current)) {
                                showNotification("challenge_completion")
                            }
                        } else {
                            dbg('MEMORIES', `⚠️ Unknown memory type: "${memoryType}", no notification sent`)
                        }
                    } else {
                        dbg('MEMORIES', `Ignoring - event is from current user (self)`)
                    }
                }
            )
            .subscribe(logChannelStatus('memories-changes'))

        // ============================================
        // USER ANSWERS CHANNEL (Daily Questions)
        // ============================================
        dbg('SETUP', `Creating user-answers-changes channel with filter: couple_id=eq.${couple.id}`)
        const answersChannel = supabase
            .channel('user-answers-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_answers',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('ANSWERS', `📥 INSERT received on user_answers table`, {
                        id: payload.new.id,
                        user_id: payload.new.user_id,
                        couple_id: payload.new.couple_id,
                        current_user_id: user.id,
                        is_from_partner: payload.new.user_id !== user.id
                    })

                    if (payload.new.user_id !== user.id) {
                        dbg('ANSWERS', `Event is from partner, checking daily_question preferences...`)
                        if (shouldNotify('daily_question', prefsRef.current)) {
                            showNotification('daily_question');
                        }
                    } else {
                        dbg('ANSWERS', `Ignoring - event is from current user (self)`)
                    }
                }
            )
            .subscribe(logChannelStatus('user-answers-changes'));

        // ============================================
        // FANTASY BUCKET LIST CHANNEL
        // ============================================
        dbg('SETUP', `Creating fantasy-changes channel with filter: couple_id=eq.${couple.id}`)
        const fantasyChannel = supabase
            .channel('fantasy-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'fantasy_bucket_list',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('FANTASY', `📥 INSERT received on fantasy_bucket_list table`, {
                        id: payload.new.id,
                        requester_id: payload.new.requester_id,
                        couple_id: payload.new.couple_id,
                        current_user_id: user.id,
                        is_from_partner: payload.new.requester_id !== user.id
                    })

                    if (payload.new.requester_id !== user.id) {
                        dbg('FANTASY', `Event is from partner, checking fantasies preferences...`)
                        if (shouldNotify('fantasies', prefsRef.current)) {
                            showNotification('fantasies_added');
                        }
                    } else {
                        dbg('FANTASY', `Ignoring INSERT - event is from current user (self)`)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'fantasy_bucket_list',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('FANTASY', `📥 UPDATE received on fantasy_bucket_list table`, {
                        id: payload.new.id,
                        status: payload.new.status,
                        old_status: payload.old?.status,
                        requester_id: payload.new.requester_id,
                        current_user_id: user.id,
                        is_requester: payload.new.requester_id === user.id
                    })

                    if (payload.new.status === 'approved' && payload.new.requester_id === user.id) {
                        dbg('FANTASY', `Fantasy approved AND I'm the requester, checking preferences...`)
                        if (shouldNotify('fantasies', prefsRef.current)) {
                            showNotification('fantasies_approved');
                        }
                    } else {
                        dbg('FANTASY', `Ignoring UPDATE - status="${payload.new.status}", requester_id=${payload.new.requester_id}, my_id=${user.id}`)
                    }
                }
            )
            .subscribe(logChannelStatus('fantasy-changes'));

        // ============================================
        // COUPONS CHANNEL
        // ============================================
        dbg('SETUP', `Creating coupons-changes channel with filter: couple_id=eq.${couple.id}`)
        const couponsChannel = supabase
            .channel('coupons-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'coupons',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('COUPONS', `📥 INSERT received on coupons table`, {
                        id: payload.new.id,
                        assigned_to: payload.new.assigned_to,
                        gifted_by: payload.new.gifted_by,
                        couple_id: payload.new.couple_id,
                        current_user_id: user.id,
                        is_recipient: payload.new.assigned_to === user.id
                    })

                    if (payload.new.assigned_to === user.id) {
                        dbg('COUPONS', `I'm the recipient, checking coupons preferences...`)
                        if (shouldNotify('coupons', prefsRef.current)) {
                            showNotification('coupons');
                        }
                    } else {
                        dbg('COUPONS', `Ignoring INSERT - I'm not the recipient (assigned_to=${payload.new.assigned_to}, me=${user.id})`)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'coupons',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('COUPONS', `📥 UPDATE received on coupons table`, {
                        id: payload.new.id,
                        gifted_by: payload.new.gifted_by,
                        activated_at_new: payload.new.activated_at,
                        activated_at_old: payload.old?.activated_at,
                        current_user_id: user.id,
                        is_gifter: payload.new.gifted_by === user.id
                    })

                    if (
                        payload.new.gifted_by === user.id &&
                        payload.new.activated_at &&
                        !payload.old.activated_at
                    ) {
                        dbg('COUPONS', `Coupon activated by partner AND I'm the gifter, checking preferences...`)
                        if (shouldNotify('coupon_activation', prefsRef.current)) {
                            showNotification('coupon_activation');
                        }
                    } else {
                        dbg('COUPONS', `Ignoring UPDATE - gifted_by=${payload.new.gifted_by}, me=${user.id}, activated_at changed: ${!payload.old?.activated_at} → ${payload.new.activated_at}`)
                    }
                }
            )
            .subscribe(logChannelStatus('coupons-changes'));

        // ============================================
        // CALENDAR EVENTS CHANNEL
        // ============================================
        dbg('SETUP', `Creating calendar-changes channel with filter: couple_id=eq.${couple.id}`)
        const calendarChannel = supabase
            .channel('calendar-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calendar_events',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    dbg('CALENDAR', `📥 INSERT received on calendar_events table`, {
                        id: payload.new.id,
                        created_by: payload.new.created_by,
                        couple_id: payload.new.couple_id,
                        current_user_id: user.id,
                        is_from_partner: payload.new.created_by !== user.id
                    })

                    if (payload.new.created_by !== user.id) {
                        dbg('CALENDAR', `Event is from partner, checking calendar_events preferences...`)
                        if (shouldNotify('calendar_events', prefsRef.current)) {
                            showNotification('calendar_events');
                        }
                    } else {
                        dbg('CALENDAR', `Ignoring - event is from current user (self)`)
                    }
                }
            )
            .subscribe(logChannelStatus('calendar-changes'));

        dbg('SETUP', `✅ All 5 channels created and subscribing`)

        // Cleanup function
        return () => {
            dbg('CLEANUP', `Removing all notification channels`)
            supabase.removeChannel(memoriesChannel);
            supabase.removeChannel(answersChannel);
            supabase.removeChannel(fantasyChannel);
            supabase.removeChannel(couponsChannel);
            supabase.removeChannel(calendarChannel);
        };
    }, [user, couple, shouldNotify, showNotification, dbg]);

    return null; // This component doesn't render anything
}
