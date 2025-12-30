
import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Pencil, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddEventOverlay } from './AddEventOverlay';
import { expandRecurringEvents } from './eventUtils';
import { useCoupleData } from '@/hooks/useCoupleData';
import { useCalendarContext, type CalendarEvent } from '@/context/CalendarContext';

export function CalendarView() {
    const { couple } = useCoupleData();
    const { events, loading, saveEvent, deleteEvent } = useCalendarContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isOverlayFocused, setIsOverlayFocused] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const handleSaveEvent = async (event: CalendarEvent) => {
        if (!couple) {
            alert('Error: No couple data found. Please try refreshing the page.');
            return;
        }
        try {
            await saveEvent(event);
            // Modal close handled by caller if strictly async awaiting? 
            // In original code, fetchEvents was called. 
            // Here saveEvent is async.
        } catch (error: any) {
            console.error('Error saving event:', error);
            alert(`Failed to save event: ${error.message || JSON.stringify(error)} `);
            throw error; // Re-throw so overlay knows to stop loading if it wants
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!couple) return;
        try {
            await deleteEvent(eventId);
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event: ' + error.message);
        }
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditingEvent(event);
        setIsAddModalOpen(true);
    };

    const handleAddEvent = () => {
        setEditingEvent(null);
        setIsAddModalOpen(true);
    };

    const allEvents = expandRecurringEvents(events, startDate, endDate);

    const checkEventMatch = (event: CalendarEvent, date: Date) => {
        // Simple day match
        if (isSameDay(new Date(event.event_date), date)) return true;
        // Multiday match
        if (event.end_date) {
            const start = startOfDay(new Date(event.event_date));
            const end = endOfDay(new Date(event.end_date));
            return date >= start && date <= end;
        }
        return false;
    };

    const selectedDateEvents = allEvents.filter(event => checkEventMatch(event, selectedDate));

    return (
        <div className="flex flex-col h-full gap-6">
            <div style={{ display: isOverlayFocused ? 'none' : 'contents' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                        {/* Header & Days */}
                        <div className="border-b border-gray-100 dark:border-gray-700">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between p-4 pb-2">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white pl-2">
                                    {format(currentDate, 'MMMM yyyy')}
                                </h2>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </div>
                            </div>

                            {/* Days Header */}
                            <div className="grid grid-cols-7">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weeks Grid */}
                        <div className="flex-1 flex flex-col">
                            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
                                const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
                                const weekStart = weekDays[0];
                                const weekEnd = weekDays[6];

                                const weekEvents = allEvents.filter(event => {
                                    const eventStart = new Date(event.event_date);
                                    const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
                                    return (eventStart <= weekEnd && eventEnd >= weekStart);
                                });

                                const sortedEvents = weekEvents.sort((a, b) => {
                                    const startA = new Date(a.event_date);
                                    const startB = new Date(b.event_date);
                                    if (startA.getTime() !== startB.getTime()) return startA.getTime() - startB.getTime();

                                    const endA = a.end_date ? new Date(a.end_date) : startA;
                                    const endB = b.end_date ? new Date(b.end_date) : startB;
                                    const durA = endA.getTime() - startA.getTime();
                                    const durB = endB.getTime() - startB.getTime();
                                    return durB - durA;
                                });

                                const lanes: CalendarEvent[][] = [];
                                const eventLanes = new Map<string, number>();

                                sortedEvents.forEach(event => {
                                    const eventStart = new Date(event.event_date);
                                    const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
                                    const displayStart = eventStart < weekStart ? weekStart : eventStart;
                                    const displayEnd = eventEnd > weekEnd ? weekEnd : eventEnd;

                                    let laneIndex = 0;
                                    while (true) {
                                        const lane = lanes[laneIndex] || [];
                                        const hasOverlap = lane.some(existingEvent => {
                                            const eStart = new Date(existingEvent.event_date);
                                            const eEnd = existingEvent.end_date ? new Date(existingEvent.end_date) : eStart;
                                            const dStart = eStart < weekStart ? weekStart : eStart;
                                            const dEnd = eEnd > weekEnd ? weekEnd : eEnd;
                                            return (displayStart <= dEnd && displayEnd >= dStart);
                                        });

                                        if (!hasOverlap) {
                                            if (!lanes[laneIndex]) lanes[laneIndex] = [];
                                            lanes[laneIndex].push(event);
                                            eventLanes.set(event.id!, laneIndex);
                                            break;
                                        }
                                        laneIndex++;
                                    }
                                });

                                return (
                                    <div key={weekIndex} className="flex-1 grid grid-cols-7 relative min-h-[100px] border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        {weekDays.map((day) => {
                                            const isSelected = isSameDay(day, selectedDate);
                                            const isCurrentMonth = isSameMonth(day, currentDate);
                                            const isTodayDate = isToday(day);

                                            return (
                                                <div
                                                    key={day.toString()}
                                                    onClick={() => setSelectedDate(day)}
                                                    className={cn(
                                                        "border-r border-gray-50 dark:border-gray-700/50 transition-colors cursor-pointer relative p-2",
                                                        !isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/20 text-gray-400",
                                                        isSelected && "bg-rose-50 dark:bg-rose-900/10",
                                                        "hover:bg-rose-50 dark:hover:bg-rose-900/10"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className={cn(
                                                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full z-10 relative",
                                                            isTodayDate ? "bg-rose-500 text-white" : "text-gray-700 dark:text-gray-300",
                                                            isSelected && !isTodayDate && "text-rose-600 dark:text-rose-400"
                                                        )}>
                                                            {format(day, 'd')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="absolute inset-0 pt-10 px-0 pointer-events-none grid grid-cols-7">
                                            {sortedEvents.map(event => {
                                                const eventStart = new Date(event.event_date);
                                                const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
                                                let startCol = 0;
                                                let span = 1;

                                                if (eventStart >= weekStart) {
                                                    startCol = eventStart.getDay();
                                                }

                                                const effectiveEnd = eventEnd > weekEnd ? weekEnd : eventEnd;
                                                const effectiveStart = eventStart < weekStart ? weekStart : eventStart;
                                                const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                span = Math.min(diffDays, 7 - startCol);
                                                const laneIndex = eventLanes.get(event.id!) || 0;
                                                const topOffset = laneIndex * 22 + 40;

                                                if (laneIndex > 3) return null;

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="absolute h-5 rounded-md text-[10px] font-medium px-2 flex items-center truncate shadow-sm z-20 pointer-events-none"
                                                        style={{
                                                            left: ((startCol / 7) * 100) + '%',
                                                            top: topOffset + 'px',
                                                            backgroundColor: event.color,
                                                            color: '#fff',
                                                            marginLeft: '2px',
                                                            marginRight: '2px',
                                                            width: 'calc(' + ((span / 7) * 100) + '% - 4px)'
                                                        }}
                                                    >
                                                        <span className="truncate">{event.title}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Events for this day */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {format(selectedDate, 'MMMM d, yyyy')}
                                    </h2>
                                </div>
                                <Button
                                    onClick={handleAddEvent}
                                    size="sm"
                                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-4"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                    </div>
                                ) : selectedDateEvents.length === 0 ? (
                                    <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                            <CalendarIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 dark:text-gray-500">No events for this day</p>
                                    </div>
                                ) : (
                                    selectedDateEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className="group flex items-start gap-3 p-3 rounded-xl transition-colors border border-transparent dark:border-gray-700 relative"
                                            style={{ backgroundColor: `${event.color}26` }}
                                        >
                                            <div
                                                className="w-1 self-stretch rounded-full flex-shrink-0"
                                                style={{ backgroundColor: event.color }}
                                            />
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                                            {event.title}
                                                        </h3>
                                                        <span
                                                            className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0"
                                                            style={{ backgroundColor: event.color }}
                                                        >
                                                            {event.category}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditEvent(event);
                                                        }}
                                                        className="h-6 w-6 text-gray-400 hover:text-rose-500 -mr-1 shrink-0"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                                {event.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddEventOverlay
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                selectedDate={selectedDate}
                eventToEdit={editingEvent}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                onFocusChange={setIsOverlayFocused}
            />
        </div>
    );
}
