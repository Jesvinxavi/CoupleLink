// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format as formatZoned, utcToZonedTime } from 'npm:date-fns-tz';
import { addDays, format as formatDate } from 'npm:date-fns';
import webPush from 'npm:web-push';

// Environment variables:
// - SUPABASE_URL (auto-provided by Supabase)
// - SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase)
// - VAPID_PUBLIC_KEY (manual)
// - VAPID_PRIVATE_KEY (manual)

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = {
    info: (message: string, data?: unknown) => console.log('[PushScheduler]', message, data ?? ''),
    warn: (message: string, data?: unknown) => console.warn('[PushScheduler]', message, data ?? ''),
    error: (message: string, data?: unknown) => console.error('[PushScheduler]', message, data ?? '')
};

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_BASE_DELAY_MS = 250;

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
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
    coupon_activation: 'sexploration_fun',
    calendar_events: 'dates_reminders',
    new_sticky_note: 'dates_reminders',
    new_journal_post: 'dates_reminders',
    partner_birthday: 'dates_reminders',
    my_birthday: 'dates_reminders',
    anniversary: 'dates_reminders'
};

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
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

function resolveTimezone(timezone?: string | null): string {
    if (!timezone) return 'UTC';
    try {
        formatZoned(new Date(), 'H', { timeZone: timezone });
        return timezone;
    } catch {
        return 'UTC';
    }
}

function getMonthDayKeyFromDateString(value?: string | null): string | null {
    if (!value) return null;
    const datePart = value.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
        return `${parts[1]}-${parts[2]}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDate(parsed, 'MM-dd');
}

type VapidDetails = {
    subject: string;
    publicKey: string;
    privateKey: string;
};

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
    pushSubscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    vapidDetails: VapidDetails,
    maxRetries = 1
): Promise<void> {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
            await webPush.sendNotification(pushSubscription, payload, { vapidDetails });
            return;
        } catch (error: any) {
            const statusCode = error?.statusCode;
            const shouldRetry = statusCode && RETRY_STATUS_CODES.has(statusCode);
            if (!shouldRetry || attempt === maxRetries) {
                throw error;
            }
            await wait(RETRY_BASE_DELAY_MS * (attempt + 1));
        }
    }
}



// Check idempotency - prevent duplicate sends for daily events
async function checkIdempotency(supabase: any, userId: string, type: string, hours = 24): Promise<boolean> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const { data, error } = await supabase
        .from('push_notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .eq('status', 'sent')
        .gte('created_at', cutoff.toISOString())
        .limit(1);

    if (error) {
        log.error('Idempotency check failed', { error, userId, type });
        return false;
    }

    return !data || data.length === 0;
}

async function cleanupExpiredSubscriptions(supabase: any, days = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
        .from('push_subscriptions')
        .delete()
        .lt('last_used_at', cutoff.toISOString())
        .select('id');

    if (error) {
        log.error('Error cleaning up expired subscriptions', error);
        return 0;
    }

    return data?.length || 0;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
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
            return new Response(
                JSON.stringify({ success: false, error: 'Missing VAPID keys - push notifications disabled' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        const vapidDetails: VapidDetails = {
            subject: 'mailto:support@couplelink.io',
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey
        };

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Clean up old subscriptions to keep table lean
        await cleanupExpiredSubscriptions(supabase);

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
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, birth_date, timezone, couple_id, notification_preferences');

        if (profilesError) {
            log.error('Failed to fetch profiles for birthday checks', profilesError);
        }

        if (profiles) {
            for (const profile of profiles) {
                if (!profile.couple_id) continue;

                const timezone = resolveTimezone(profile.timezone);
                const prefs = profile.notification_preferences as NotificationPreferences | null;
                const localNow = utcToZonedTime(now, timezone);
                const localHour = parseInt(formatDate(localNow, 'H'), 10);
                if (Number.isNaN(localHour) || localHour < 8 || localHour > 10) continue; // Only check between 8-10 AM local time

                const todayKey = formatDate(localNow, 'MM-dd');
                const oneWeekKey = formatDate(addDays(localNow, 7), 'MM-dd');

                // Get partner info
                const { data: partner, error: partnerError } = await supabase
                    .from('profiles')
                    .select('id, first_name, birth_date')
                    .eq('couple_id', profile.couple_id)
                    .neq('id', profile.id)
                    .single();

                if (partnerError) {
                    log.error('Failed to fetch partner profile', { error: partnerError, profileId: profile.id });
                    continue;
                }

                if (partner && partner.birth_date) {
                    const partnerBirthdayKey = getMonthDayKeyFromDateString(partner.birth_date);

                    // Partner birthday today
                    if (partnerBirthdayKey && partnerBirthdayKey === todayKey) {
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
                    else if (partnerBirthdayKey && partnerBirthdayKey === oneWeekKey) {
                        if (shouldNotify(prefs, 'partner_birthday')) {
                            const type = 'partner_birthday';
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
                    const myBirthdayKey = getMonthDayKeyFromDateString(profile.birth_date);
                    if (myBirthdayKey && myBirthdayKey === todayKey) {
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
                const { data: coupleData, error: coupleError } = await supabase
                    .from('couples')
                    .select('anniversary_date')
                    .eq('id', profile.couple_id)
                    .single();

                if (coupleError) {
                    log.error('Failed to fetch couple data for anniversary check', { error: coupleError, coupleId: profile.couple_id });
                    continue;
                }

                if (coupleData?.anniversary_date) {
                    const anniversaryKey = getMonthDayKeyFromDateString(coupleData.anniversary_date);

                    // Anniversary today
                    if (anniversaryKey && anniversaryKey === todayKey) {
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
                    else if (anniversaryKey && anniversaryKey === oneWeekKey) {
                        if (shouldNotify(prefs, 'anniversary')) {
                            const type = 'anniversary';
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
            const { data: couples, error: couplesError } = await supabase
                .from('couples')
                .select('id, current_streak');

            if (couplesError) {
                log.error('Failed to fetch couples for daily expiry check', couplesError);
            }

            if (couples) {
                for (const couple of couples) {
                    // Get both users in the couple
                    const { data: users, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, first_name, notification_preferences')
                        .eq('couple_id', couple.id);

                    if (usersError) {
                        log.error('Failed to fetch users for couple', { error: usersError, coupleId: couple.id });
                        continue;
                    }

                    if (!users || users.length !== 2) continue;

                    // Check daily challenge completion for today
                    const todayStart = new Date(now);
                    todayStart.setUTCHours(0, 0, 0, 0);

                    for (const user of users) {
                        const partner = users.find(u => u.id !== user.id);
                        const prefs = user.notification_preferences as NotificationPreferences | null;

                        // Check if user has completed today's daily challenge
                        const { data: userChallenges, error: userChallengesError } = await supabase
                            .from('memories')
                            .select('id')
                            .eq('couple_id', couple.id)
                            .eq('uploader_id', user.id)
                            .eq('type', 'challenge')
                            .gte('created_at', todayStart.toISOString())
                            .limit(1);

                        if (userChallengesError) {
                            log.error('Failed to fetch user challenge completion', { error: userChallengesError, userId: user.id });
                            continue;
                        }

                        const userCompleted = userChallenges && userChallenges.length > 0;

                        // Check partner's completion
                        const { data: partnerChallenges, error: partnerChallengesError } = await supabase
                            .from('memories')
                            .select('id')
                            .eq('couple_id', couple.id)
                            .eq('uploader_id', partner?.id)
                            .eq('type', 'challenge')
                            .gte('created_at', todayStart.toISOString())
                            .limit(1);

                        if (partnerChallengesError) {
                            log.error('Failed to fetch partner challenge completion', { error: partnerChallengesError, partnerId: partner?.id });
                        }

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
                        if (couple.current_streak && couple.current_streak > 0 && !userCompleted) {
                            if (shouldNotify(prefs, 'streak_expiry')) {
                                const type = 'streak_expiry';
                                if (await checkIdempotency(supabase, user.id, type)) {
                                    notifications.push({
                                        user_id: user.id,
                                        type,
                                        title: '🔥 Streak At Risk!',
                                        body: `Your ${couple.current_streak}-day streak expires in 1 hour!`,
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
            const { data: couples, error: couplesError } = await supabase
                .from('couples')
                .select('id');

            if (couplesError) {
                log.error('Failed to fetch couples for weekly expiry check', couplesError);
            }

            if (couples) {
                for (const couple of couples) {
                    const { data: users, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, first_name, notification_preferences')
                        .eq('couple_id', couple.id);

                    if (usersError) {
                        log.error('Failed to fetch users for weekly expiry check', { error: usersError, coupleId: couple.id });
                        continue;
                    }

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
                const { data: couples, error: couplesError } = await supabase
                    .from('couples')
                    .select('id');

                if (couplesError) {
                    log.error('Failed to fetch couples for monthly expiry check', couplesError);
                }

                if (couples) {
                    for (const couple of couples) {
                        const { data: users, error: usersError } = await supabase
                            .from('profiles')
                            .select('id, first_name, notification_preferences')
                            .eq('couple_id', couple.id);

                        if (usersError) {
                            log.error('Failed to fetch users for monthly expiry check', { error: usersError, coupleId: couple.id });
                            continue;
                        }

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
            const { data: subscriptions, error: subscriptionsError } = await supabase
                .from('push_subscriptions')
                .select('id, endpoint, keys_p256dh, keys_auth')
                .eq('user_id', notification.user_id);

            if (subscriptionsError) {
                log.error('Failed to fetch push subscriptions', { error: subscriptionsError, userId: notification.user_id });
                failed++;
                continue;
            }

            if (!subscriptions || subscriptions.length === 0) {
                log.warn(`No subscription for user ${notification.user_id}`);
                const { error: logError } = await supabase.from('push_notification_logs').insert({
                    user_id: notification.user_id,
                    notification_type: notification.type,
                    status: 'failed',
                    error_message: 'No push subscriptions found'
                });
                if (logError) {
                    log.error('Failed to log missing subscription', { error: logError, userId: notification.user_id });
                }
                failed++;
                continue;
            }

            const payload = JSON.stringify({
                title: notification.title,
                body: notification.body,
                url: notification.url,
                icon: '/pwa-icon.svg',
                badge: '/pwa-icon.svg'
            });
            let loggedSuccess = false;

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

                    await sendWithRetry(pushSubscription, payload, vapidDetails);

                    if (!loggedSuccess) {
                        const { error: logError } = await supabase.from('push_notification_logs').insert({
                            user_id: notification.user_id,
                            notification_type: notification.type,
                            status: 'sent',
                            error_message: null
                        });
                        if (logError) {
                            log.error('Failed to log push success', { error: logError, userId: notification.user_id });
                        }
                        loggedSuccess = true;
                    }

                    const { error: updateError } = await supabase
                        .from('push_subscriptions')
                        .update({ last_used_at: now.toISOString() })
                        .eq('id', sub.id);
                    if (updateError) {
                        log.error('Failed to update subscription last_used_at', { error: updateError, subscriptionId: sub.id });
                    }

                    // Log success
                    log.info(`Push success for ${notification.user_id}`, { title: notification.title });
                    sent++;
                } catch (error: any) {
                    log.error(`Push failed for ${sub.endpoint}`, error);
                    failed++;

                    const { error: logError } = await supabase.from('push_notification_logs').insert({
                        user_id: notification.user_id,
                        notification_type: notification.type,
                        status: 'failed',
                        error_message: error?.message || String(error)
                    });
                    if (logError) {
                        log.error('Failed to log push failure', { error: logError, userId: notification.user_id });
                    }

                    // Handle 410 Gone / 404 Not Found (Subscription expired)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        log.warn(`Removing expired subscription for user ${notification.user_id}`);
                        const { error: deleteError } = await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint);
                        if (deleteError) {
                            log.error('Failed to remove expired subscription', { error: deleteError, endpoint: sub.endpoint });
                        } else {
                            removed++;
                        }
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
        log.error('Push scheduler error', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        );
    }
});
