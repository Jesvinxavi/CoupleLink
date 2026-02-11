/**
 * Calendar event shape used throughout the app.
 */
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
    /**
     * Recurrence interval label.
     * Examples: 'none', 'daily', 'weekly', 'monthly', 'six_months', 'yearly'.
     */
    recurrence?: string;
    created_by?: string;
}
