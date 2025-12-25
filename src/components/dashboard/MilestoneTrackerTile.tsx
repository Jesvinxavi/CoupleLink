import { useState, useEffect } from 'react';
import { useCoupleData } from '../../hooks/useCoupleData';
import { supabase } from '../../lib/supabase';
import { AddEventOverlay, type CalendarEvent } from '../calendar/AddEventOverlay';
import { format, parseISO } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Flag } from 'lucide-react';

export function MilestoneTrackerTile() {
    const { couple } = useCoupleData();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchEvents = async () => {
        if (!couple) return;
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('couple_id', couple.id)
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(3);

            if (error) throw error;

            if (data) {
                setEvents(data.map((e: any) => ({
                    id: e.id,
                    title: e.title || 'Untitled',
                    event_date: e.event_date || '',
                    end_date: e.end_date,
                    category: e.category || 'Event',
                    color: e.color || '#e11d48',
                    location: e.location,
                    description: e.description
                } as CalendarEvent)));
            }
        } catch (error) {
            console.error('Error fetching milestones:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [couple?.id]);

    const handleSaveEvent = async (event: CalendarEvent) => {
        if (!couple) return;
        try {
            const { error } = await supabase
                .from('calendar_events')
                .insert({
                    couple_id: couple.id,
                    title: event.title,
                    event_date: event.event_date,
                    category: event.category,
                    // We cast to any to allow extra fields that might exist in DB but not in types
                    ...({
                        end_date: event.end_date,
                        color: event.color,
                        location: event.location,
                        description: event.description
                    } as any)
                });

            if (error) throw error;
            await fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = parseISO(dateStr);
        return format(date, 'MMM d');
    };

    return (
        <>
            <div className="rounded-2xl bg-white p-5 shadow-sm h-full">
                <div className={`flex items-center justify-between ${events.length > 0 ? 'mb-4' : 'mb-2'}`}>
                    <h3 className="text-lg font-bold text-heading-dark flex items-center gap-2">
                        <Flag className="w-5 h-5 text-rose-500" />
                        Upcoming Milestones
                    </h3>
                    {events.length > 0 && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="h-24 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500" />
                    </div>
                ) : events.length > 0 ? (
                    <div className="relative pt-2 pb-4">
                        {/* Timeline Line */}
                        <div className="absolute top-[22px] left-0 right-0 h-1 bg-black rounded-full -z-0" />

                        <div className="grid grid-cols-3 gap-4">
                            {events.map((event, index) => (
                                <div key={event.id || index} className="relative z-10 flex flex-col items-center text-center group">
                                    {/* Dot */}
                                    <div
                                        className="w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: event.color || '#e11d48' }}
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full opacity-50" />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-1 w-full">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {formatDate(event.event_date)}
                                        </p>
                                        <p className="text-[10px] font-medium text-rose-500 uppercase tracking-wider truncate w-full px-1">
                                            {event.category}
                                        </p>
                                        <h4 className="text-sm font-bold text-heading-dark line-clamp-2 w-full px-1 leading-tight" title={event.title}>
                                            {event.title}
                                        </h4>
                                    </div>
                                </div>
                            ))}

                            {/* Fill empty slots if less than 3 */}
                            {[...Array(3 - events.length)].map((_, i) => (
                                <div key={`empty-${i}`} className="relative z-10 flex flex-col items-center opacity-30">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 border-4 border-white mb-3" />
                                    <div className="h-4 w-16 bg-gray-100 rounded mb-1" />
                                    <div className="h-3 w-12 bg-gray-100 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3">
                            <CalendarIcon className="w-6 h-6 text-rose-500" />
                        </div>
                        <p className="text-sm text-body-soft mb-4">No upcoming events recorded</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-rose-500/20 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Milestones
                        </button>
                    </div>
                )}
            </div>

            <AddEventOverlay
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                selectedDate={new Date()}
                onSave={handleSaveEvent}
                onDelete={async () => { }}
            />
        </>
    );
}
