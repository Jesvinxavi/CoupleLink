// ═══════════════════════════════════════
// push-notify — Event-Driven Push Notifications
// Triggered by database webhooks on INSERT/UPDATE
// Sends Web Push to partner when actions occur
// ═══════════════════════════════════════
import "edge-runtime";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import webPush from "web-push";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    schema: string;
    record: Record<string, unknown>;
    old_record: Record<string, unknown> | null;
}

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

type VapidDetails = {
    subject: string;
    publicKey: string;
    privateKey: string;
};

interface WebPushError extends Error {
    statusCode?: number;
}

interface NotificationDefinition {
    recipientId?: string;
    senderId?: string;
    type: string;
    title: string;
    body: string;
    url: string;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = {
    info: (msg: string, data?: unknown) => console.log('[PushNotify]', msg, data ?? ''),
    warn: (msg: string, data?: unknown) => console.warn('[PushNotify]', msg, data ?? ''),
    error: (msg: string, data?: unknown) => console.error('[PushNotify]', msg, data ?? ''),
};

const SECTION_MAP: Record<string, string> = {
    daily_question: 'challenges_streak',
    challenge_completion: 'challenges_streak',
    fantasies: 'sexploration_fun',
    coupons: 'sexploration_fun',
    coupon_activation: 'sexploration_fun',
    new_sticky_note: 'dates_reminders',
    new_journal_post: 'dates_reminders',
    calendar_events: 'dates_reminders',
};

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
    fantasies: [
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
};

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function shouldNotify(prefs: NotificationPreferences | null, type: string): boolean {
    if (!prefs) return true;
    if (!prefs.master_toggle) return false;
    const section = SECTION_MAP[type];
    if (section && prefs.sections && !prefs.sections[section]) return false;
    if (prefs.types && prefs.types[type] === false) return false;
    return true;
}

function getMessage(type: string): string {
    const messages = NOTIFICATION_MESSAGES[type];
    if (!messages || messages.length === 0) {
        return "New notification from CoupleLink";
    }
    return messages[Math.floor(Math.random() * messages.length)];
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(
    pushSub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    vapidDetails: VapidDetails,
    maxRetries = 1
): Promise<void> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            await webPush.sendNotification(pushSub, payload, { vapidDetails });
            return;
        } catch (error: unknown) {
            const statusCode = (error as WebPushError)?.statusCode;
            if (!statusCode || !RETRY_STATUS_CODES.has(statusCode) || attempt === maxRetries) {
                throw error;
            }
            await wait(250 * (attempt + 1));
        }
    }
}

// Send notification to a specific user (encapsulates prefs check, sub fetching, and sending)
async function sendToUser(
    userId: string,
    notification: NotificationDefinition,
    supabase: SupabaseClient,
    vapidDetails: VapidDetails
): Promise<{ sent: number; failed: number }> {
    // 1. Check preferences
    const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

    const prefs = recipientProfile?.notification_preferences as NotificationPreferences | null;
    if (!shouldNotify(prefs, notification.type)) {
        log.info('Notification blocked by preferences', { type: notification.type, userId });
        return { sent: 0, failed: 0 };
    }

    // 2. Get subscriptions
    const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (subError || !subscriptions?.length) {
        log.info('No push subscriptions for user', { userId });
        await supabase.from('push_notification_logs').insert({
            user_id: userId,
            notification_type: notification.type,
            status: 'failed',
            error_message: 'No push subscriptions found',
        });
        return { sent: 0, failed: 0 };
    }

    // 3. Send
    const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url,
        type: notification.type,
        icon: '/pwa-icon.svg',
        badge: '/pwa-icon.svg',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions as PushSubscription[]) {
        try {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            };

            await sendWithRetry(pushSub, payload, vapidDetails);
            sent++;

            // Update last_used_at
            await supabase
                .from('push_subscriptions')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', sub.id);

        } catch (error: unknown) {
            const webPushError = error as WebPushError;
            log.error(`Push failed for ${sub.endpoint}`, webPushError);
            failed++;

            if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
                log.warn('Removing expired subscription', { endpoint: sub.endpoint });
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
        }
    }

    // 4. Log success
    if (sent > 0) {
        await supabase.from('push_notification_logs').insert({
            user_id: userId,
            notification_type: notification.type,
            status: 'sent',
            error_message: null,
        });
    }

    return { sent, failed };
}

// Resolve what notification to send
function resolveNotification(
    webhook: WebhookPayload
): NotificationDefinition | null {
    const { type: eventType, table, record, old_record } = webhook;

    // ── memories table ──
    if (table === 'memories' && eventType === 'INSERT') {
        const memoryType = record.type as string;
        const senderId = record.uploader_id as string;

        if (memoryType === 'sticky_note') {
            return {
                senderId,
                type: 'new_sticky_note',
                title: '💌 New Sticky Note',
                body: getMessage('new_sticky_note'),
                url: '#/dashboard',
            };
        }
        if (memoryType === 'journal') {
            return {
                senderId,
                type: 'new_journal_post',
                title: '📔 New Journal Entry',
                body: getMessage('new_journal_post'),
                url: '#/memories',
            };
        }
        if (memoryType === 'challenge') {
            return {
                senderId,
                type: 'challenge_completion',
                title: '🏆 Challenge Completed!',
                body: getMessage('challenge_completion'),
                url: '#/challenges',
            };
        }
        return null;
    }

    // ── user_answers table ──
    if (table === 'user_answers' && eventType === 'INSERT') {
        return {
            senderId: record.user_id as string,
            type: 'daily_question',
            title: '💬 Daily Question Answered',
            body: getMessage('daily_question'),
            url: '#/challenges',
        };
    }

    // ── fantasy_bucket_list table ──
    if (table === 'fantasy_bucket_list') {
        if (eventType === 'INSERT') {
            return {
                senderId: record.requester_id as string,
                type: 'fantasies',
                title: '✨ New Fantasy Added',
                body: getMessage('fantasies'),
                url: '#/sexploration',
            };
        }
        if (eventType === 'UPDATE' && record.status === 'approved' && old_record?.status === 'pending') {
            return {
                recipientId: record.requester_id as string,
                type: 'fantasies',
                title: '💚 Fantasy Approved!',
                body: getMessage('fantasies_approved'),
                url: '#/sexploration',
            };
        }
        return null;
    }

    // ── coupons table ──
    if (table === 'coupons') {
        if (eventType === 'INSERT' && record.is_gift === true) {
            return {
                recipientId: record.assigned_to as string,
                senderId: record.gifted_by as string,
                type: 'coupons',
                title: '🎁 New Coupon Gift!',
                body: getMessage('coupons'),
                url: '#/sexploration',
            };
        }
        if (eventType === 'UPDATE' && record.activated_at && !old_record?.activated_at && record.gifted_by) {
            return {
                recipientId: record.gifted_by as string,
                senderId: record.assigned_to as string,
                type: 'coupon_activation',
                title: '🔥 Coupon Activated!',
                body: getMessage('coupon_activation'),
                url: '#/sexploration',
            };
        }
        return null;
    }

    // ── calendar_events table ──
    if (table === 'calendar_events' && eventType === 'INSERT') {
        // Correct logic: created_by should now be present
        const senderId = record.created_by as string;
        if (!senderId) {
             // Fallback if migration hasn't populated it or frontend missed it
             // We can't do much, log warn? Or return null.
             // But for now let's hope it's there.
             log.warn('Calendar event missing created_by', { id: record['id'] });
        }
        
        return {
            senderId: senderId,
            type: 'calendar_events',
            title: '📅 Calendar Event',
            body: getMessage('calendar_events'),
            url: '#/dashboard',
        };
    }

    return null;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Config ──
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        if (!vapidPublicKey || !vapidPrivateKey) {
            return new Response(JSON.stringify({ error: 'Missing VAPID keys' }), { status: 500 });
        }

        const vapidDetails: VapidDetails = {
            subject: 'mailto:support@couplelink.io',
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey,
        };

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const webhook: WebhookPayload = await req.json();
        log.info('Received webhook', { table: webhook.table, type: webhook.type, recordId: webhook.record['id'] });

        const notification = resolveNotification(webhook);
        if (!notification) {
            return new Response(JSON.stringify({ success: true, action: 'skipped' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── Resolve Recipients ──
        const recipientIds: string[] = [];

        if (notification.recipientId) {
            // Case 1: Direct recipient known
            recipientIds.push(notification.recipientId);
        } else if (notification.senderId) {
            // Case 2: Sender known, find partner
            const { data: senderProfile } = await supabase.from('profiles').select('couple_id').eq('id', notification.senderId).single();
            if (senderProfile?.couple_id) {
                const { data: partner } = await supabase.from('profiles')
                    .select('id')
                    .eq('couple_id', senderProfile.couple_id)
                    .neq('id', notification.senderId)
                    .single();
                if (partner) recipientIds.push(partner.id);
            }
        }

        if (recipientIds.length === 0) {
            log.warn('No recipients resolved');
            return new Response(JSON.stringify({ success: false, error: 'No recipients' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // ── Send to all resolved recipients ──
        let totalSent = 0;
        let totalFailed = 0;

        for (const userId of recipientIds) {
            const result = await sendToUser(userId, notification, supabase, vapidDetails);
            totalSent += result.sent;
            totalFailed += result.failed;
        }

        log.info('Push complete', { totalSent, totalFailed, type: notification.type });
        return new Response(
            JSON.stringify({ success: true, sent: totalSent, failed: totalFailed }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        log.error('Unhandled error', error);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
