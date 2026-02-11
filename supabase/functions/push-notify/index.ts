// ═══════════════════════════════════════
// push-notify — Event-Driven Push Notifications
// Triggered by database webhooks on INSERT/UPDATE
// Sends Web Push to partner when actions occur
// ═══════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webPush from 'npm:web-push';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    schema: string;
    record: Record<string, any>;
    old_record: Record<string, any> | null;
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

// Section mapping for preference checking (matches push-scheduler)
const SECTION_MAP: Record<string, string> = {
    daily_question: 'challenges_streak',
    challenge_completion: 'challenges_streak',
    fantasies: 'sexploration_fun',
    coupons: 'sexploration_fun',
    coupon_activation: 'sexploration_fun',
    new_sticky_note: 'dates_reminders',
    new_journal_post: 'dates_reminders',
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
        } catch (error: any) {
            const statusCode = error?.statusCode;
            if (!statusCode || !RETRY_STATUS_CODES.has(statusCode) || attempt === maxRetries) {
                throw error;
            }
            await wait(250 * (attempt + 1));
        }
    }
}

// Resolve what notification to send based on the webhook payload
function resolveNotification(
    webhook: WebhookPayload
): { recipientId: string; senderId: string; type: string; title: string; body: string; url: string } | null {
    const { type: eventType, table, record, old_record } = webhook;

    // ── memories table ──
    if (table === 'memories' && eventType === 'INSERT') {
        const memoryType = record.type;
        const senderId = record.uploader_id;

        if (memoryType === 'sticky_note') {
            return {
                recipientId: '', // resolved later via couple
                senderId,
                type: 'new_sticky_note',
                title: '💌 New Sticky Note',
                body: record.caption
                    ? `"${record.caption.substring(0, 80)}${record.caption.length > 80 ? '...' : ''}"`
                    : 'Your partner left you a note!',
                url: '#/dashboard',
            };
        }
        if (memoryType === 'journal') {
            return {
                recipientId: '',
                senderId,
                type: 'new_journal_post',
                title: '📔 New Journal Entry',
                body: record.title
                    ? `"${record.title.substring(0, 80)}"`
                    : 'Your partner wrote a journal entry!',
                url: '#/memories',
            };
        }
        if (memoryType === 'challenge') {
            return {
                recipientId: '',
                senderId,
                type: 'challenge_completion',
                title: '🏆 Challenge Completed!',
                body: 'Your partner completed a challenge!',
                url: '#/challenges',
            };
        }
        return null;
    }

    // ── user_answers table ──
    if (table === 'user_answers' && eventType === 'INSERT') {
        return {
            recipientId: '',
            senderId: record.user_id,
            type: 'daily_question',
            title: '💬 Daily Question Answered',
            body: 'Your partner answered today\'s question!',
            url: '#/challenges',
        };
    }

    // ── fantasy_bucket_list table ──
    if (table === 'fantasy_bucket_list') {
        if (eventType === 'INSERT') {
            return {
                recipientId: '',
                senderId: record.requester_id,
                type: 'fantasies',
                title: '✨ New Fantasy Added',
                body: 'Your partner added a new fantasy to the bucket list!',
                url: '#/sexploration',
            };
        }
        if (eventType === 'UPDATE' && record.status === 'approved' && old_record?.status === 'pending') {
            // Notify the requester that their fantasy was approved
            return {
                recipientId: record.requester_id, // the requester gets notified
                senderId: '', // doesn't matter, we know who to notify
                type: 'fantasies',
                title: '💚 Fantasy Approved!',
                body: `Your fantasy was approved: "${record.fantasy_text?.substring(0, 60) || '...'}"`,
                url: '#/sexploration',
            };
        }
        return null;
    }

    // ── coupons table ──
    if (table === 'coupons') {
        if (eventType === 'INSERT' && record.is_gift === true) {
            return {
                recipientId: record.assigned_to,
                senderId: record.gifted_by,
                type: 'coupons',
                title: '🎁 New Coupon Gift!',
                body: record.title
                    ? `You received a coupon: "${record.title}"`
                    : 'Your partner sent you a coupon!',
                url: '#/sexploration',
            };
        }
        if (eventType === 'UPDATE' && record.activated_at && !old_record?.activated_at && record.gifted_by) {
            // Notify the gifter that their coupon was activated
            return {
                recipientId: record.gifted_by,
                senderId: record.assigned_to,
                type: 'coupon_activation',
                title: '🔥 Coupon Activated!',
                body: record.title
                    ? `Your coupon "${record.title}" was activated!`
                    : 'Your partner activated a coupon!',
                url: '#/sexploration',
            };
        }
        return null;
    }

    return null;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
Deno.serve(async (req) => {
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
            log.error('Missing VAPID keys');
            return new Response(
                JSON.stringify({ success: false, error: 'Missing VAPID keys' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            );
        }

        const vapidDetails: VapidDetails = {
            subject: 'mailto:support@couplelink.io',
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey,
        };

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ── Parse webhook payload ──
        const webhook: WebhookPayload = await req.json();
        log.info('Received webhook', { table: webhook.table, type: webhook.type, recordId: webhook.record?.id });

        // ── Resolve notification ──
        const notification = resolveNotification(webhook);
        if (!notification) {
            log.info('No notification needed for this event');
            return new Response(
                JSON.stringify({ success: true, action: 'skipped' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        log.info('Resolved notification', { type: notification.type, recipientId: notification.recipientId, senderId: notification.senderId });

        // ── Resolve recipient if not directly known ──
        let recipientId = notification.recipientId;

        if (!recipientId && notification.senderId) {
            // Look up partner via couple
            // First find the sender's couple_id
            const { data: senderProfile, error: senderError } = await supabase
                .from('profiles')
                .select('couple_id')
                .eq('id', notification.senderId)
                .single();

            if (senderError || !senderProfile?.couple_id) {
                log.warn('Could not find sender couple', { senderId: notification.senderId, error: senderError });
                return new Response(
                    JSON.stringify({ success: false, error: 'Sender has no couple' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Find partner in the same couple
            const { data: partner, error: partnerError } = await supabase
                .from('profiles')
                .select('id')
                .eq('couple_id', senderProfile.couple_id)
                .neq('id', notification.senderId)
                .single();

            if (partnerError || !partner) {
                log.warn('Could not find partner', { coupleId: senderProfile.couple_id, error: partnerError });
                return new Response(
                    JSON.stringify({ success: false, error: 'No partner found' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            recipientId = partner.id;
        }

        if (!recipientId) {
            log.warn('No recipient resolved');
            return new Response(
                JSON.stringify({ success: false, error: 'No recipient' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        log.info('Sending to recipient', { recipientId });

        // ── Check notification preferences ──
        const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('notification_preferences, first_name')
            .eq('id', recipientId)
            .single();

        const prefs = recipientProfile?.notification_preferences as NotificationPreferences | null;
        if (!shouldNotify(prefs, notification.type)) {
            log.info('Notification blocked by preferences', { type: notification.type, recipientId });
            return new Response(
                JSON.stringify({ success: true, action: 'blocked_by_prefs' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Get push subscriptions ──
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', recipientId);

        if (subError || !subscriptions?.length) {
            log.warn('No push subscriptions for recipient', { recipientId, error: subError });
            await supabase.from('push_notification_logs').insert({
                user_id: recipientId,
                notification_type: notification.type,
                status: 'failed',
                error_message: 'No push subscriptions found',
            });
            return new Response(
                JSON.stringify({ success: false, error: 'No push subscriptions' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Send push to all subscriptions ──
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

            } catch (error: any) {
                log.error(`Push failed for ${sub.endpoint}`, error);
                failed++;

                // Remove expired subscriptions (410/404)
                if (error.statusCode === 410 || error.statusCode === 404) {
                    log.warn('Removing expired subscription', { endpoint: sub.endpoint });
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
            }
        }

        // Log the notification
        if (sent > 0) {
            await supabase.from('push_notification_logs').insert({
                user_id: recipientId,
                notification_type: notification.type,
                status: 'sent',
                error_message: null,
            });
        }

        log.info('Push complete', { sent, failed, type: notification.type });

        return new Response(
            JSON.stringify({ success: true, sent, failed, type: notification.type }),
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
