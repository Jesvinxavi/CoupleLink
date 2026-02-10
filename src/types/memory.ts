export interface MemoryMetadata {
    challenge_type?: 'daily' | 'weekly' | 'monthly';
    winner_selection?: 'me' | 'partner' | 'tie';
    confetti_seen?: boolean;
    [key: string]: unknown; // Allow for other metadata
}

export interface Memory {
    id: string;
    couple_id: string;
    uploader_id: string;
    type: 'challenge' | 'moment' | string;
    title: string;
    media_url: string | null;
    metadata: MemoryMetadata | null;
    created_at: string;
}
