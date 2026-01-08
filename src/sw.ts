/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Precache assets (injected by Vite PWA)
precacheAndRoute(self.__WB_MANIFEST);

// Handle push events from backend
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const { title, body, icon, tag, url, type } = data;

        const options: NotificationOptions = {
            body: body || 'New notification from CoupleLink',
            icon: icon || '/CoupleLink/pwa-icon.svg',
            badge: '/CoupleLink/pwa-icon.svg',
            tag: tag || type || 'couplelink-notification', // Group similar notifications
            data: { url: url || '/CoupleLink/' },
            requireInteraction: type === 'streak_expiry' // Keep streak alerts visible
        };

        event.waitUntil(
            self.registration.showNotification(title || 'CoupleLink', options)
        );
    } catch (error) {
        console.error('[SW] Error processing push event:', error);
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event: any) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Check if client is focusing on the same origin
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    // Ideally we could navigate the existing client to the specific URL
                    // But standard behavior often just focuses it. 
                    // Let's try to navigate if different, or just focus if same.
                    if ('navigate' in client) {
                        client.navigate(urlToOpen);
                    }
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle subscription change (e.g., browser refreshes push subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
    // Re-subscribe logic if subscription expires


    // Attempt to re-subscribe with same options
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true
        }).then(() => {

            // Note: In production, you'd want to update the backend with the new subscription
        }).catch((error) => {
            console.error('[SW] Failed to re-subscribe:', error);
        })
    );
});
