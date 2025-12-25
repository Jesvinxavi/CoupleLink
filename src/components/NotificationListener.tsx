import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCoupleData } from '@/hooks/useCoupleData';

export function NotificationListener() {
    const { user } = useAuth();
    const { couple } = useCoupleData();

    useEffect(() => {
        if (!user || !couple) return;

        // Request permission on mount
        if ('Notification' in window) { // Check if Notification API is supported
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        } else {
            console.warn("This browser does not support desktop notifications.");
        }

        const channel = supabase
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
                    // Only notify if the uploader is NOT the current user (i.e., it's the partner)
                    if (payload.new.uploader_id !== user.id) {
                        // Safety check before creating notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            const type = payload.new.type === 'journal' ? 'Journal Entry' : 'Memory';
                            try {
                                new Notification(`New ${type}`, {
                                    body: 'Your partner added a new memory!',
                                    icon: '/pwa-192x192.png' // Assuming PWA icon exists
                                });
                            } catch (e) {
                                console.error('Notification creation failed:', e);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, couple]);

    return null; // This component doesn't render anything
}
