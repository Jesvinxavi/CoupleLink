// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format as formatZoned } from 'npm:date-fns-tz';
import { addDays, addHours, differenceInHours } from 'npm:date-fns';
import webPush from 'npm:web-push';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreferences {
    master_toggle: boolean;
    sections: Record<string, boolean>;
    types: Record<string, boolean>;
}

interface PushSubscription {
    id: string;
    user_id: string;
    endpoint: string;
    keys_p256dh: string;
    keys_auth: string;
}

// Section mapping for preference checking
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

// Check if notification should be sent based on preferences
function shouldNotify(prefs: NotificationPreferences | null, type: string): boolean {
    if (!prefs) return true;
    if (!prefs.master_toggle) return false;

    const section = SECTION_MAP[type];
    if (section && prefs.sections && !prefs.sections[section]) return false;
    if (prefs.types && prefs.types[type] === false) return false;

    return true;
}

// Get days in current month
function getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Check if two dates share the same month/day
function isSameDayOfYear(date1: Date, date2: Date): boolean {
    return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

// Add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}



// Check idempotency - prevent duplicate sends for daily events
async function checkIdempotency(supabase: any, userId: string, type: string, hours = 20): Promise<boolean> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const { data } = await supabase
        .from('push_notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .eq('status', 'sent')
        .gte('created_at', cutoff.toISOString())
        .limit(1);

    return !data || data.length === 0;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Initialize Supabase client with service role
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        // Validation
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase configuration');
        }
        if (!vapidPublicKey || !vapidPrivateKey) {
            console.error('Missing VAPID keys - push notifications will fail');
            // We don't throw here to allow logic to run (e.g. for testing) but we log error
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date();
        const utcHour = now.getUTCHours();
        const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
        const utcDate = now.getUTCDate();
        const daysInMonth = getDaysInMonth(now);

        const notifications: { user_id: string; type: string; title: string; body: string; url: string }[] = [];

        // =============================================
        // HOURLY CHECK: Birthdays & Anniversaries (09:00 local time)
        // =============================================

        // Get all profiles with timezone info
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, birth_date, timezone, couple_id, notification_preferences');

        if (profiles) {
            for (const profile of profiles) {
                if (!profile.couple_id) continue;

                const timezone = profile.timezone || 'UTC';
                const prefs = profile.notification_preferences as NotificationPreferences | null;

                // Check if it's 9 AM (+/- 1 hour) in user's timezone
                let localHour: number;
                try {
                    const hourStr = formatZoned(now, 'H', { timeZone: timezone });
                    localHour = parseInt(hourStr, 10);
                } catch (e) {
                    console.error(`Invalid timezone ${timezone}, falling back to UTC`);
                    localHour = now.getUTCHours();
                }

                if (localHour < 8 || localHour > 10) continue; // Only check between 8-10 AM local time

                // Get partner info
                const { data: partner } = await supabase
                    .from('profiles')
                    .select('id, first_name, birth_date')
                    .eq('couple_id', profile.couple_id)
                    .neq('id', profile.id)
                    .single();

                if (partner && partner.birth_date) {
                    const partnerBirthday = new Date(partner.birth_date);
                    const today = new Date();
                    const oneWeekFromNow = addDays(today, 7);

                    // Partner birthday today
                    if (isSameDayOfYear(partnerBirthday, today)) {
                        if (shouldNotify(prefs, 'partner_birthday')) {
                            const type = 'partner_birthday';
                            if (await checkIdempotency(supabase, profile.id, type)) {
                                notifications.push({
                                    user_id: profile.id,
                                    type,
                                    title: '🎂 Happy Birthday!',
                                    body: `It's ${partner.first_name}'s special day! Make it memorable.`,
                                    url: '#/dashboard'
                                });
                            }
                        }
                    }
                    // Partner birthday in 1 week
                    else if (isSameDayOfYear(partnerBirthday, oneWeekFromNow)) {
                        if (shouldNotify(prefs, 'partner_birthday')) {
                            const type = 'partner_birthday_reminder';
                            if (await checkIdempotency(supabase, profile.id, type)) {
                                notifications.push({
                                    user_id: profile.id,
                                    type,
                                    title: '📅 Birthday Reminder',
                                    body: `${partner.first_name}'s birthday is in 1 week! Start planning!`,
                                    url: '#/dashboard'
                                });
                            }
                        }
                    }
                }

                // My birthday today
                if (profile.birth_date) {
                    const myBirthday = new Date(profile.birth_date);
                    const today = new Date();
                    if (isSameDayOfYear(myBirthday, today)) {
                        if (shouldNotify(prefs, 'my_birthday')) {
                            const type = 'my_birthday';
                            if (await checkIdempotency(supabase, profile.id, type)) {
                                notifications.push({
                                    user_id: profile.id,
                                    type,
                                    title: '🎉 Happy Birthday!',
                                    body: `Happy Birthday, ${profile.first_name}! Wishing you the best day ever!`,
                                    url: '#/dashboard'
                                });
                            }
                        }
                    }
                }

                // Anniversary check
                const { data: coupleData } = await supabase
                    .from('couples')
                    .select('anniversary')
                    .eq('id', profile.couple_id)
                    .single();

                if (coupleData?.anniversary) {
                    const anniversary = new Date(coupleData.anniversary);
                    const today = new Date();
                    const oneWeekFromNow = addDays(today, 7);

                    // Anniversary today
                    if (isSameDayOfYear(anniversary, today)) {
                        if (shouldNotify(prefs, 'anniversary')) {
                            const type = 'anniversary';
                            if (await checkIdempotency(supabase, profile.id, type)) {
                                notifications.push({
                                    user_id: profile.id,
                                    type,
                                    title: '💕 Happy Anniversary!',
                                    body: `Today marks another year of love! Celebrate your journey together.`,
                                    url: '#/dashboard'
                                });
                            }
                        }
                    }
                    // Anniversary in 1 week
                    else if (isSameDayOfYear(anniversary, oneWeekFromNow)) {
                        if (shouldNotify(prefs, 'anniversary')) {
                            const type = 'anniversary_reminder';
                            if (await checkIdempotency(supabase, profile.id, type)) {
                                notifications.push({
                                    user_id: profile.id,
                                    type,
                                    title: '📅 Anniversary Reminder',
                                    body: `Your anniversary is in 1 week! Time to plan something special!`,
                                    url: '#/dashboard'
                                });
                            }
                        }
                    }
                }
            }
        }

        // =============================================
        // 23:00 UTC CHECK: Streak & Daily Challenge Expiry
        // =============================================
        if (utcHour === 23) {
            // Get all couples
            const { data: couples } = await supabase
                .from('couples')
                .select('id, streak_count');

            if (couples) {
                for (const couple of couples) {
                    // Get both users in the couple
                    const { data: users } = await supabase
                        .from('profiles')
                        .select('id, first_name, notification_preferences')
                        .eq('couple_id', couple.id);

                    if (!users || users.length !== 2) continue;

                    // Check daily challenge completion for today
                    const todayStart = new Date(now);
                    todayStart.setUTCHours(0, 0, 0, 0);

                    for (const user of users) {
                        const partner = users.find(u => u.id !== user.id);
                        const prefs = user.notification_preferences as NotificationPreferences | null;

                        // Check if user has completed today's daily challenge
                        const { data: userChallenges } = await supabase
                            .from('memories')
                            .select('id')
                            .eq('couple_id', couple.id)
                            .eq('uploader_id', user.id)
                            .eq('type', 'challenge')
                            .gte('created_at', todayStart.toISOString())
                            .limit(1);

                        const userCompleted = userChallenges && userChallenges.length > 0;

                        // Check partner's completion
                        const { data: partnerChallenges } = await supabase
                            .from('memories')
                            .select('id')
                            .eq('couple_id', couple.id)
                            .eq('uploader_id', partner?.id)
                            .eq('type', 'challenge')
                            .gte('created_at', todayStart.toISOString())
                            .limit(1);

                        const partnerCompleted = partnerChallenges && partnerChallenges.length > 0;

                        // Daily expiry notification
                        if (!userCompleted) {
                            if (shouldNotify(prefs, 'daily_expiry')) {
                                const type = 'daily_expiry';
                                if (await checkIdempotency(supabase, user.id, type)) {
                                    if (partnerCompleted) {
                                        notifications.push({
                                            user_id: user.id,
                                            type,
                                            title: '⏰ Daily Challenge',
                                            body: `${partner?.first_name} completed it! Finish yours before midnight!`,
                                            url: '#/challenges'
                                        });
                                    } else {
                                        notifications.push({
                                            user_id: user.id,
                                            type,
                                            title: '⏰ Daily Challenge',
                                            body: `1 hour left! Complete today's challenge together!`,
                                            url: '#/challenges'
                                        });
                                    }
                                }
                            }
                        }

                        // Streak at risk notification
                        if (couple.streak_count && couple.streak_count > 0 && !userCompleted) {
                            if (shouldNotify(prefs, 'streak_expiry')) {
                                const type = 'streak_expiry';
                                if (await checkIdempotency(supabase, user.id, type)) {
                                    notifications.push({
                                        user_id: user.id,
                                        type,
                                        title: '🔥 Streak At Risk!',
                                        body: `Your ${couple.streak_count}-day streak expires in 1 hour!`,
                                        url: '#/challenges'
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // =============================================
        // SATURDAY 20:00 UTC CHECK: Weekly Challenge Expiry
        // =============================================
        if (utcDay === 6 && utcHour === 20) {
            const { data: couples } = await supabase
                .from('couples')
                .select('id');

            if (couples) {
                for (const couple of couples) {
                    const { data: users } = await supabase
                        .from('profiles')
                        .select('id, first_name, notification_preferences')
                        .eq('couple_id', couple.id);

                    if (!users) continue;

                    for (const user of users) {
                        const prefs = user.notification_preferences as NotificationPreferences | null;
                        if (shouldNotify(prefs, 'weekly_expiry')) {
                            const type = 'weekly_expiry';
                            if (await checkIdempotency(supabase, user.id, type)) {
                                notifications.push({
                                    user_id: user.id,
                                    type,
                                    title: '📅 Weekly Challenge',
                                    body: `Weekly challenge expires tomorrow! Complete it this weekend!`,
                                    url: '#/challenges'
                                });
                            }
                        }
                    }
                }
            }
        }

        // =============================================
        // DAYS 25-31 at 20:00 UTC: Monthly Challenge Expiry (5 days before EOM)
        // =============================================
        if (utcDate >= (daysInMonth - 5) && utcHour === 20) {
            const daysLeft = daysInMonth - utcDate + 1;

            if (daysLeft === 5) { // Exactly 5 days before end of month
                const { data: couples } = await supabase
                    .from('couples')
                    .select('id');

                if (couples) {
                    for (const couple of couples) {
                        const { data: users } = await supabase
                            .from('profiles')
                            .select('id, first_name, notification_preferences')
                            .eq('couple_id', couple.id);

                        if (!users) continue;

                        for (const user of users) {
                            const prefs = user.notification_preferences as NotificationPreferences | null;
                            if (shouldNotify(prefs, 'monthly_expiry')) {
                                const type = 'monthly_expiry';
                                if (await checkIdempotency(supabase, user.id, type)) {
                                    notifications.push({
                                        user_id: user.id,
                                        type,
                                        title: '🗓️ Monthly Challenge',
                                        body: `5 days left for the Monthly Challenge! Don't miss out!`,
                                        url: '#/challenges'
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // =============================================
        // SEND PUSH NOTIFICATIONS
        // =============================================
        let sent = 0;
        let failed = 0;
        let removed = 0;

        for (const notification of notifications) {
            // Get user's push subscriptions
            const { data: subscriptions } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', notification.user_id);

            if (!subscriptions || subscriptions.length === 0) {
                console.log(`No subscription for user ${notification.user_id}`);
                failed++;
                continue;
            }

            const payload = JSON.stringify({
                title: notification.title,
                body: notification.body,
                url: notification.url,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png'
            });

            // Log the notification attempt (only once per user, even if multiple devices)
            await supabase.from('push_notification_logs').insert({
                user_id: notification.user_id,
                notification_type: notification.type,
                status: 'sent',
                error_message: null
            });

            for (const sub of subscriptions) {
                try {
                    // Send real notification
                    // Construct the subscription object in the format web-push expects
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.keys_p256dh,
                            auth: sub.keys_auth
                        }
                    };

                    await webPush.sendNotification(pushSubscription, payload, {
                        vapidDetails: {
                            subject: 'mailto:support@couplelink.io', // Replace with real email
                            publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
                            privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!
                        }
                    });

                    // Log success
                    console.log(`[PUSH SUCCESS] To: ${notification.user_id} | Title: ${notification.title}`);
                    sent++;
                } catch (error: any) {
                    console.error(`Push failed for ${sub.endpoint}:`, error);

                    // Handle 410 Gone / 404 Not Found (Subscription expired)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`Removing expired subscription for user ${notification.user_id}`);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint);
                        removed++;
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                notifications_queued: notifications.length,
                sent,
                failed,
                timestamp: now.toISOString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Push scheduler error:', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        );
    }
});
