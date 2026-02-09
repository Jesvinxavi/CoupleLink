// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface DateBadgeProps {
    date: Date;
    className?: string;
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function DateBadge({ date, className }: DateBadgeProps) {
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const dayNumber = date.getDate();

    return (
        <div className={cn(
            "flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden",
            "w-10 h-12", // Default size, can be overridden by className
            className
        )}>
            <div className="w-full bg-rose-500 text-white text-[8px] font-bold text-center py-0.5 leading-none">
                {dayName}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center -mt-0.5">
                <span className="text-lg font-semibold text-gray-900 dark:text-white leading-none">
                    {dayNumber}
                </span>
                <span className="text-[8px] font-medium text-gray-500 dark:text-gray-400 uppercase leading-none mt-0.5">
                    {date.toLocaleDateString(undefined, { month: 'short' })}
                </span>
            </div>
        </div>
    );
}
