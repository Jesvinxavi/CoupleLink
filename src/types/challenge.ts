export interface Challenge {
    id: string;
    type: 'daily' | 'weekly' | 'monthly';
    title: string;
    description: string;
    durationMinutes: number; // Approximate duration
    category: 'fun' | 'deep' | 'active' | 'creative' | 'romantic';
    isCompetition?: boolean;
}
