import { addMonths, addYears } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

// ═══════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════
/**
 * Expand recurring events into concrete instances within a view range.
 */
export function expandRecurringEvents(
    events: CalendarEvent[],
    viewStart: Date,
    viewEnd: Date
): CalendarEvent[] {
    const expandedEvents: CalendarEvent[] = [];

    events.forEach(event => {
        // If no recurrence, just include it (filtering will happen in the view if needed, 
        // but let's filter here for consistency with the recurring logic)
        if (!event.recurrence || event.recurrence === 'none') {
            const start = new Date(event.event_date);
            const end = event.end_date ? new Date(event.end_date) : start;

            // Simple overlap check
            if (start <= viewEnd && end >= viewStart) {
                expandedEvents.push(event);
            }
            return;
        }

        // Logic for Recurring
        let currentStart = new Date(event.event_date);
        const currentEnd = event.end_date ? new Date(event.end_date) : new Date(event.event_date);
        const duration = currentEnd.getTime() - currentStart.getTime();

        // Limit iteration to avoid infinite loops (1000 instances or safety break)
        let count = 0;
        while (currentStart <= viewEnd && count < 1000) {
            const instanceEnd = new Date(currentStart.getTime() + duration);

            // Check if this instance overlaps with view
            // Note: instanceEnd >= viewStart && currentStart <= viewEnd
            if (instanceEnd >= viewStart && currentStart <= viewEnd) {
                expandedEvents.push({
                    ...event,
                    id: `${event.id}_recur_${currentStart.getTime()}`, // Unique ID for React keys
                    event_date: currentStart.toISOString(),
                    end_date: instanceEnd.toISOString()
                });
            }

            // Advance date
            switch (event.recurrence) {
                case 'monthly':
                    currentStart = addMonths(currentStart, 1);
                    break;
                case 'six_months':
                    currentStart = addMonths(currentStart, 6);
                    break;
                case 'yearly':
                    currentStart = addYears(currentStart, 1);
                    break;
                default:
                    currentStart = addYears(currentStart, 100); // Safety
                    break;
            }
            count++;
        }
    });

    return expandedEvents;
}
