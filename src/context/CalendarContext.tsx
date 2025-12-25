import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useCoupleData } from '../hooks/useCoupleData';
import { useAuth } from './AuthContext';

export interface CalendarEvent {
    id?: string;
    title: string;
    event_date: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
    category: string;
    color: string;
    location?: string;
    description?: string;
    recurrence?: string; // 'none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'
    couple_id?: string;
}

interface CalendarContextType {
    events: CalendarEvent[];
    loading: boolean;
    refreshEvents: () => Promise<void>;
    saveEvent: (event: CalendarEvent) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
    const { couple } = useCoupleData();
    const { user } = useAuth();

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
                .select('*')
                .eq('couple_id', couple.id);

            if (error) throw error;

            const mappedEvents: CalendarEvent[] = (data || []).map((e: any) => ({
                id: e.id,
                title: e.title,
                event_date: e.event_date,
                end_date: e.end_date,
                category: e.category || 'Event',
                color: e.color || '#e11d48',
                location: e.location,
                description: e.description,
                recurrence: e.recurrence
            }));

            setEvents(mappedEvents);
            hasLoaded.current = true;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
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

    const saveEvent = async (event: CalendarEvent) => {
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
                recurrence: event.recurrence
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
            console.error('Error saving event:', error);
            throw error;
        }
    };

    const deleteEvent = async (eventId: string) => {
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
            console.error('Error deleting event:', error);
            throw error;
        }
    };

    return (
        <CalendarContext.Provider value={{
            events,
            loading,
            refreshEvents: fetchEvents,
            saveEvent,
            deleteEvent
        }}>
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error('useCalendarContext must be used within a CalendarProvider');
    }
    return context;
}
