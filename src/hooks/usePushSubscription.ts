import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// VAPID public key for Web Push authentication
// This should be replaced with your actual VAPID public key from `npx web-push generate-vapid-keys`
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY_HERE';

/**
 * Convert URL-safe base64 to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}

export interface PushSubscriptionState {
    isSubscribed: boolean | null;
    isSupported: boolean;
    permission: NotificationPermission;
    isLoading: boolean;
}

export interface UsePushSubscriptionReturn extends PushSubscriptionState {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    checkExistingSubscription: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
    const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check browser support
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkExistingSubscription();
        }
    }, []);

    const checkExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking push subscription:', error);
            setIsSubscribed(false);
        }
    };

    const subscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            // Request notification permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                console.warn('Notification permission denied');
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Extract subscription details
            const subscriptionJson = subscription.toJSON();
            const { endpoint, keys } = subscriptionJson;

            if (!endpoint || !keys?.p256dh || !keys?.auth) {
                throw new Error('Invalid subscription data');
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Save to database (upsert to handle re-subscriptions)
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint,
                    keys_p256dh: keys.p256dh,
                    keys_auth: keys.auth,
                    last_used_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (error) throw error;

            // Update user's timezone in profile
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await supabase
                .from('profiles')
                .update({ timezone })
                .eq('id', user.id);

            setIsSubscribed(true);
            return true;
        } catch (error) {
            console.error('Error subscribing to push:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Remove from database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('endpoint', subscription.endpoint);
                }
            }

            setIsSubscribed(false);
            return true;
        } catch (error) {
            console.error('Error unsubscribing from push:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isSubscribed,
        isSupported,
        permission,
        isLoading,
        subscribe,
        unsubscribe,
        checkExistingSubscription
    };
}
