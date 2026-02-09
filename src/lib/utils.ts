import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ═══════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════

/**
 * Merge conditional class names with Tailwind conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
