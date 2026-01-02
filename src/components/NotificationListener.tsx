import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCoupleData } from '@/hooks/useCoupleData';

// Maps notification type to section for preference checking
const SECTION_MAP: Record<string, string> = {
    daily_question: 'challenges_streak',
    challenge_completion: 'challenges_streak',
    streak_expiry: 'challenges_streak',
    daily_expiry: 'challenges_streak',
    weekly_expiry: 'challenges_streak',
    monthly_expiry: 'challenges_streak',
    fantasies: 'sexploration_fun',
    coupons: 'sexploration_fun',
    calendar_events: 'dates_reminders',
    new_sticky_note: 'dates_reminders',
    new_journal_post: 'dates_reminders',
    partner_birthday: 'dates_reminders',
    my_birthday: 'dates_reminders',
    anniversary: 'dates_reminders'
};

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
    calendar_events: [
        "New Event added to your calendar! 📅",
        "Partner planned something special! 🥂"
    ]
};

// Get random message from templates
const getMessage = (type: string): string => {
    const messages = NOTIFICATION_MESSAGES[type];
    if (!messages || messages.length === 0) {
        return 'New notification from CoupleLink';
    }
    return messages[Math.floor(Math.random() * messages.length)];
};

// Get notification title based on type
const getTitle = (type: string): string => {
    const titles: Record<string, string> = {
        daily_question: 'Daily Question',
        challenge_completion: 'Challenge Complete',
        new_journal_post: 'New Journal Entry',
        new_sticky_note: 'Love Note',
        fantasies_added: 'New Fantasy',
        fantasies_approved: 'Fantasy Approved',
        coupons: 'New Coupon',
        calendar_events: 'Calendar Event'
    };
    return titles[type] || 'CoupleLink';
};

interface NotificationPreferences {
    master_toggle: boolean;
    sections: Record<string, boolean>;
    types: Record<string, boolean>;
}

export function NotificationListener() {
    const { user } = useAuth();
    const { couple } = useCoupleData();

    // Check if notification should be shown based on preferences
    const shouldNotify = useCallback((type: string, prefs: NotificationPreferences | null): boolean => {
        if (!prefs) return true; // Default to showing if no preferences
        if (!prefs.master_toggle) return false;

        const section = SECTION_MAP[type];
        if (section && prefs.sections && !prefs.sections[section]) return false;
        if (prefs.types && prefs.types[type] === false) return false;

        return true;
    }, []);

    // Show notification using browser Notification API
    const showNotification = useCallback((type: string, customBody?: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(getTitle(type), {
                    body: customBody || getMessage(type),
                    icon: '/CoupleLink/pwa-icon.svg',
                    tag: `couplelink-${type}` // Prevents duplicate notifications
                });
            } catch (e) {
                console.error('Notification creation failed:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (!user || !couple) return;

        // Request permission on mount
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            console.warn("This browser does not support desktop notifications.");
            return;
        }

        // Update timezone in profile
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        supabase
            .from('profiles')
            .update({ timezone })
            .eq('id', user.id)
            .then(({ error }) => {
                if (error) console.error('Failed to update timezone:', error);
            });

        // Fetch user's notification preferences
        let userPreferences: NotificationPreferences | null = null;
        const fetchPreferences = async () => {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('notification_preferences')
                    .eq('id', user.id)
                    .single();

                if (data?.notification_preferences) {
                    userPreferences = data.notification_preferences as unknown as NotificationPreferences;
                }
            } catch (error) {
                console.error('Error fetching notification preferences:', error);
            }
        };
        fetchPreferences();

        // ============================================
        // MEMORIES CHANNEL (Journal, Sticky Notes, Challenges)
        // ============================================
        const memoriesChannel = supabase
            .channel('memories-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'memories',
                    filter: `couple_id=eq.${couple.id}`
                },
                (payload) => {
                    // Only notify if the uploader is NOT the current user
                    if (payload.new.uploader_id !== user.id) {
                        const memoryType = payload.new.type;

                        if (memoryType === 'journal') {
                            if (shouldNotify('new_journal_post', userPreferences)) {
                                showNotification('new_journal_post');
                            }
                        } else if (memoryType === 'sticky_note') {
                            if (shouldNotify('new_sticky_note', userPreferences)) {
                                showNotification('new_sticky_note');
                            }
                        } else if (memoryType === 'challenge') {
                            if (shouldNotify('challenge_completion', userPreferences)) {
                                showNotification('challenge_completion');
                            }
                        }
                    }
                }
            )
            .subscribe();

        // ============================================
        // USER ANSWERS CHANNEL (Daily Questions)
        // ============================================
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
                    if (payload.new.user_id !== user.id) {
                        if (shouldNotify('daily_question', userPreferences)) {
                            showNotification('daily_question');
                        }
                    }
                }
            )
            .subscribe();

        // ============================================
        // FANTASY BUCKET LIST CHANNEL
        // ============================================
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
                    // New fantasy added by partner
                    if (payload.new.requester_id !== user.id) {
                        if (shouldNotify('fantasies', userPreferences)) {
                            showNotification('fantasies_added');
                        }
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
                    // Fantasy approved - notify the original requester
                    if (payload.new.status === 'approved' && payload.new.requester_id === user.id) {
                        if (shouldNotify('fantasies', userPreferences)) {
                            showNotification('fantasies_approved');
                        }
                    }
                }
            )
            .subscribe();

        // ============================================
        // COUPONS CHANNEL
        // ============================================
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
                    // Only notify the recipient
                    if (payload.new.assigned_to === user.id) {
                        if (shouldNotify('coupons', userPreferences)) {
                            showNotification('coupons');
                        }
                    }
                }
            )
            .subscribe();

        // ============================================
        // CALENDAR EVENTS CHANNEL
        // ============================================
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
                    // Only notify if created by partner
                    if (payload.new.created_by !== user.id) {
                        if (shouldNotify('calendar_events', userPreferences)) {
                            showNotification('calendar_events');
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup function
        return () => {
            supabase.removeChannel(memoriesChannel);
            supabase.removeChannel(answersChannel);
            supabase.removeChannel(fantasyChannel);
            supabase.removeChannel(couponsChannel);
            supabase.removeChannel(calendarChannel);
        };
    }, [user, couple, shouldNotify, showNotification]);

    return null; // This component doesn't render anything
}
