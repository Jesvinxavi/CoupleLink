/**
 * Type definitions for Supabase RPC function return values
 * These are used to properly type the JSON responses from RPC calls
 */

/** Result from check_archived_couple RPC */
export interface CheckArchivedCoupleResult {
    found: boolean;
    couple_id?: string;
    partner_active_couple_id?: string | null;
    stats?: {
        photo_count: number;
        journal_count: number;
        duration_days: number;
    };
    expires_at?: string;
}

/** Result from check_existing_archive_for_pair RPC */
export interface CheckExistingArchiveResult {
    found: boolean;
    archived_couple_id?: string;
    stats?: {
        photo_count: number;
        journal_count: number;
        duration_days: number;
    };
    expires_at?: string;
}

/** Result from join_couple RPC */
export interface JoinCoupleResult {
    success: boolean;
    message?: string;
    couple_id?: string;
    archived_couple_id?: string;
    host_email?: string;
}
