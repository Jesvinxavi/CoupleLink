import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarEvent {
    id: string;
    title: string | null;
    event_date: string;
    category: string | null;
}

export function SharedCalendar() {
    const { couple } = useCoupleData();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventCategory, setNewEventCategory] = useState('Date Night');
    const [submitting, setSubmitting] = useState(false);

    const fetchEvents = async () => {
        if (!couple) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('couple_id', couple.id)
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data as any);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [couple]);

    const handleAddEvent = async () => {
        if (!couple || !date || !newEventTitle.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('calendar_events')
                .insert({
                    couple_id: couple.id,
                    title: newEventTitle,
                    event_date: format(date, 'yyyy-MM-dd'),
                    category: newEventCategory
                });

            if (error) throw error;

            setNewEventTitle('');
            setIsDialogOpen(false);
            fetchEvents();
        } catch (err) {
            console.error('Error adding event:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter events for selected date
    const selectedDateEvents = events.filter(event =>
        date && event.event_date === format(date, 'yyyy-MM-dd')
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Calendar View */}
            <div className="md:col-span-7 lg:col-span-8">
                <Card className="border-none shadow-sm h-full">
                    <CardContent className="p-4 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border shadow-sm bg-white"
                            modifiers={{
                                event: events.map(e => new Date(e.event_date))
                            }}
                            modifiersStyles={{
                                event: { fontWeight: 'bold', textDecoration: 'underline', color: '#e11d48' }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Event List / Add Event */}
            <div className="md:col-span-5 lg:col-span-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                    </h3>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Event</DialogTitle>
                                <div className="sr-only">
                                    <DialogDescription>Fill in the details below to add a new event to your shared calendar.</DialogDescription>
                                </div>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="title">Event Title</Label>
                                    <Input
                                        id="title"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        placeholder="e.g., Date Night, Anniversary"
                                    />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newEventCategory}
                                        onChange={(e) => setNewEventCategory(e.target.value)}
                                    >
                                        <option value="Date Night">Date Night</option>
                                        <option value="Visit">Visit</option>
                                        <option value="Milestone">Milestone</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddEvent}
                                        disabled={submitting || !newEventTitle.trim()}
                                        className="bg-rose-500 hover:bg-rose-600 text-white"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : 'Save Event'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    ) : selectedDateEvents.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200">
                            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No events for this day</p>
                        </div>
                    ) : (
                        selectedDateEvents.map(event => (
                            <Card key={event.id} className="border-l-4 border-l-rose-500 shadow-sm">
                                <CardContent className="p-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-1 inline-block">
                                        {event.category}
                                    </span>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
