/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { logger } from '@/lib/logger';

declare let self: ServiceWorkerGlobalScope;

// Precache assets (injected by Vite PWA)
precacheAndRoute(self.__WB_MANIFEST);

const getScopeUrl = () => self.registration.scope || self.location.origin

const toAbsoluteUrl = (url?: string) => {
    try {
        return new URL(url || '', getScopeUrl()).toString()
    } catch (error) {
        logger.error('ServiceWorker', 'Failed to build absolute URL', error)
        return getScopeUrl()
    }
}

// Handle push events from backend
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const { title, body, icon, tag, url, type } = data;
        const defaultIcon = toAbsoluteUrl('pwa-icon.svg')
        const defaultUrl = toAbsoluteUrl('/')

        const options: NotificationOptions = {
            body: body || 'New notification from CoupleLink',
            icon: icon || defaultIcon,
            badge: defaultIcon,
            tag: tag || type || 'couplelink-notification', // Group similar notifications
            data: { url: toAbsoluteUrl(url || defaultUrl) },
            requireInteraction: type === 'streak_expiry' // Keep streak alerts visible
        };

        event.waitUntil(
            self.registration.showNotification(title || 'CoupleLink', options)
        );
    } catch (error) {
        logger.error('ServiceWorker', 'Error processing push event', error)
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    const urlToOpen = toAbsoluteUrl(event.notification.data?.url || '/');

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    // Check if client is focusing on the same origin
                    if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                        // Ideally we could navigate the existing client to the specific URL
                        // But standard behavior often just focuses it.
                        // Let's try to navigate if different, or just focus if same.
                        if ('navigate' in client) {
                            client.navigate(urlToOpen).catch((error: unknown) => {
                                logger.error('ServiceWorker', 'Failed to navigate client', error)
                            })
                        }
                        return client.focus();
                    }
                }
                // If no window is open, open a new one
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
            .catch((error: unknown) => {
                logger.error('ServiceWorker', 'Failed to handle notification click', error)
            })
    );
});

// Handle subscription change (e.g., browser refreshes push subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
    // Re-subscribe logic if subscription expires
    // Note: Update backend with the new subscription when available.

    // Attempt to re-subscribe with same options
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true
        }).then(() => {

            // Note: In production, you'd want to update the backend with the new subscription
        }).catch((error) => {
            logger.error('ServiceWorker', 'Failed to re-subscribe', error)
        })
    );
});
