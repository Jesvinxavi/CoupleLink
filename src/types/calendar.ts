export interface CalendarEvent {
    id?: string;
    title: string;
    event_date: string;
    end_date?: string | null;
    category: string;
    color: string;
    location?: string | null;
    description?: string | null;
    country?: string | null;
    recurrence?: string; // 'none', 'daily', 'weekly', 'monthly', etc.
}
