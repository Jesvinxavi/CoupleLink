export function formatTime(ms: number): string {
    if (ms < 0) return "00s";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

export function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

export const getDateRange = (type: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (type === 'daily') {
        // Daily: UTC Midnight to UTC 23:59:59
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
    } else if (type === 'weekly') {
        // Weekly: Start of current UTC week (Monday?) -> End of UTC week
        // Note: JS getUTCDay() returns 0 for Sunday.
        // Let's standardise on Monday start
        const day = start.getUTCDay();
        const diff = start.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

        start.setUTCDate(diff);
        start.setUTCHours(0, 0, 0, 0);

        end.setUTCDate(diff + 6);
        end.setUTCHours(23, 59, 59, 999);
    } else {
        // Monthly: UTC Month 1st to Last Day
        start.setUTCDate(1);
        start.setUTCHours(0, 0, 0, 0);

        end.setUTCMonth(end.getUTCMonth() + 1);
        end.setUTCDate(0); // Last day of previous month (which is current month since we added 1)
        end.setUTCHours(23, 59, 59, 999);
    }
    return { start: start.toISOString(), end: end.toISOString() };
};

/**
 * Generate a period key for challenge_history tracking
 * Daily: "2026-01-05", Weekly: "2026-W01", Monthly: "2026-01"
 */
export function getPeriodKey(type: 'daily' | 'weekly' | 'monthly' | 'question', date: Date = new Date()): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    if (type === 'daily' || type === 'question') {
        return `${year}-${month}-${day}`;
    } else if (type === 'weekly') {
        const week = String(getWeekNumber(date)).padStart(2, '0');
        return `${year}-W${week}`;
    } else {
        return `${year}-${month}`;
    }
}
