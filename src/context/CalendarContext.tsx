/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCoupleData } from '@/hooks/useCoupleData';
import type { CalendarEvent } from '@/types/calendar';

// Re-export for convenience if needed, or consumers should import from types
export type { CalendarEvent };

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CalendarContextType {
    events: CalendarEvent[];
    loading: boolean;
    refreshEvents: () => Promise<void>;
    saveEvent: (event: CalendarEvent) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function CalendarProvider({ children }: { children: ReactNode }) {
    const { couple } = useCoupleData();
    // Removed unused user hook

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const hasLoaded = useRef(false);

    const fetchEvents = useCallback(async () => {
        if (!couple) return;
        try {
            // Only set loading on initial fetch to prevent flickering
            if (!hasLoaded.current) setLoading(true);

            const { data, error } = await supabase
                .from('calendar_events')
                .select('id, title, event_date, end_date, category, color, location, description, recurrence')
                .eq('couple_id', couple.id);

            if (error) throw error;

            const mappedEvents: CalendarEvent[] = (data || []).map((e) => ({
                id: e.id,
                title: e.title || '',
                event_date: e.event_date || '',
                end_date: e.end_date,
                category: (e.category || 'Event') as CalendarEvent['category'],
                color: e.color || '#e11d48',
                location: e.location,
                description: e.description,
                recurrence: e.recurrence as CalendarEvent['recurrence']
            }));

            setEvents(mappedEvents);
            hasLoaded.current = true;
        } catch (error) {
            logger.error('CalendarContext', 'Error fetching calendar events', error);
        } finally {
            setLoading(false);
        }
    }, [couple]); // Intentionally not including events.length to allow fresh refetch call

    // Initial Fetch
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Realtime Subscription
    useEffect(() => {
        if (!couple) return;

        const channelName = `partner-calendar-${couple.id}`;
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        channel
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calendar_events',
                    filter: `couple_id=eq.${couple.id}`
                },
                () => {
                    fetchEvents();
                }
            )
            .on('broadcast', { event: 'calendar_update' }, () => {
                fetchEvents();
            })
            .subscribe();

        // 30s polling fallback
        const intervalId = setInterval(() => {
            fetchEvents();
        }, 30000);

        // Window focus listener
        const handleFocus = () => {
            fetchEvents();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
            channelRef.current = null;
        };
    }, [couple, fetchEvents]);

    const saveEvent = useCallback(async (event: CalendarEvent) => {
        if (!couple) throw new Error('No couple found');

        try {
            const eventData = {
                couple_id: couple.id,
                title: event.title,
                event_date: event.event_date,
                end_date: event.end_date,
                category: event.category,
                color: event.color,
                location: event.location,
                description: event.description,
                recurrence: event.recurrence as string | null
            };

            if (event.id) {
                // Update
                const { error } = await supabase
                    .from('calendar_events')
                    .update(eventData)
                    .eq('id', event.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('calendar_events')
                    .insert(eventData);
                if (error) throw error;
            }

            // Broadcast update
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'calendar_update',
                    payload: {}
                });
            }

            // Realtime will catch it, but optimistic fetch is fine
            fetchEvents();

        } catch (error) {
            logger.error('CalendarContext', 'Error saving event', error);
            throw error;
        }
    }, [couple, fetchEvents]);

    const deleteEvent = useCallback(async (eventId: string) => {
        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            // Broadcast update
            if (channelRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'calendar_update',
                    payload: {}
                });
            }

            fetchEvents();
        } catch (error) {
            logger.error('CalendarContext', 'Error deleting event', error);
            throw error;
        }
    }, [fetchEvents]);

    const contextValue = useMemo(() => ({
        events,
        loading,
        refreshEvents: fetchEvents,
        saveEvent,
        deleteEvent
    }), [events, loading, fetchEvents, saveEvent, deleteEvent]);

    return (
        <CalendarContext.Provider value={contextValue}>
            {children}
        </CalendarContext.Provider>
    );
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error('useCalendarContext must be used within a CalendarProvider');
    }
    return context;
}
