/**
 * Challenge model used by challenge contexts and UI.
 */
export interface Challenge {
    id: string;
    type: 'daily' | 'weekly' | 'monthly' | 'question';
    title: string;
    description: string;
    durationMinutes: number; // Approximate duration
    category: 'fun' | 'deep' | 'active' | 'creative' | 'romantic' | 'question';
    isCompetition?: boolean;
}

export interface UserAnswer {
    id: string;
    activity_id: string | null;
    user_id: string | null;
    answer_text: string | null;
    drawing_data: unknown;
    created_at: string | null;
}
