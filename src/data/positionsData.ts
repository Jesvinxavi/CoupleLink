export interface Position {
    id: string;
    name: string;
    category: 'classic' | 'spooning' | 'standing' | 'seated' | 'advanced';
    description: string;
}

export const POSITION_CATEGORIES = {
    classic: { name: 'Classic', icon: 'favorite' },
    spooning: { name: 'Spooning & Lying', icon: 'bedtime' },
    standing: { name: 'Standing', icon: 'accessibility_new' },
    seated: { name: 'Seated', icon: 'event_seat' },
    advanced: { name: 'Advanced', icon: 'star' },
} as const;

export const positions: Position[] = [
    // Classic Positions
    {
        id: 'missionary',
        name: 'Missionary',
        category: 'classic',
        description: 'The receiving partner lies on their back while the other partner lies on top, facing them. A classic intimate position that allows for deep eye contact and kissing.',
    },
    {
        id: 'cowgirl',
        name: 'Cowgirl',
        category: 'classic',
        description: 'One partner lies on their back while the other sits on top, facing them. The partner on top controls the rhythm and depth, allowing for intimate face-to-face connection.',
    },
    {
        id: 'reverse-cowgirl',
        name: 'Reverse Cowgirl',
        category: 'classic',
        description: 'Similar to Cowgirl, but the partner on top faces away. This offers a different angle and allows the bottom partner to enjoy the view.',
    },
    {
        id: 'doggy-style',
        name: 'Doggy Style',
        category: 'classic',
        description: 'The receiving partner is on all fours while the other enters from behind. A position that allows for deep penetration and can be varied with different angles.',
    },
    {
        id: 'lotus',
        name: 'Lotus',
        category: 'classic',
        description: 'One partner sits cross-legged while the other sits in their lap, wrapping their legs around. An extremely intimate position allowing for full-body embrace and closeness.',
    },
    {
        id: 'the-bridge',
        name: 'The Bridge',
        category: 'classic',
        description: 'The receiving partner arches their back with feet and hands on the bed, creating a bridge shape. The other partner kneels between their legs. Requires flexibility but offers unique sensations.',
    },

    // Spooning & Lying Positions
    {
        id: 'spooning',
        name: 'Spooning',
        category: 'spooning',
        description: 'Both partners lie on their sides, with one partner curled behind the other. A gentle, intimate position perfect for lazy mornings or tender moments.',
    },
    {
        id: 'the-pretzel',
        name: 'The Pretzel',
        category: 'spooning',
        description: 'One partner lies on their side while the other kneels, straddling one of their legs while the other leg wraps around their hip. Allows for deep penetration with intimate eye contact.',
    },
    {
        id: 'lazy-dog',
        name: 'Lazy Dog',
        category: 'spooning',
        description: 'The receiving partner lies flat on their stomach while the other lies on top from behind. A relaxed variation of doggy style that requires minimal effort.',
    },
    {
        id: 'the-spork',
        name: 'The Spork',
        category: 'spooning',
        description: 'Both partners lie on their sides facing each other, with the receiving partner lifting one leg over the other\'s hip. Allows for intimate kissing and embracing.',
    },
    {
        id: 'the-scissors',
        name: 'The Scissors',
        category: 'spooning',
        description: 'Partners interlock their legs like scissors, lying in opposite directions. Creates unique friction and angles while allowing partners to see each other.',
    },
    {
        id: 'the-landslide',
        name: 'The Landslide',
        category: 'spooning',
        description: 'The receiving partner lies face-down with a pillow under their hips. The other partner lies on top from behind. Provides comfort and intimacy with deep access.',
    },

    // Standing Positions
    {
        id: 'standing-facing',
        name: 'Standing Face-to-Face',
        category: 'standing',
        description: 'Both partners stand facing each other. One partner may lift a leg or be lifted against a wall. Great for spontaneous encounters and deep kissing.',
    },
    {
        id: 'standing-from-behind',
        name: 'Standing From Behind',
        category: 'standing',
        description: 'Both partners stand with one partner behind the other. The receiving partner can bend forward or lean against a surface for support.',
    },
    {
        id: 'the-ballet-dancer',
        name: 'The Ballet Dancer',
        category: 'standing',
        description: 'Partners stand face-to-face while the receiving partner lifts one leg high, held by their partner. Requires flexibility and balance but creates an elegant, sensual pose.',
    },
    {
        id: 'the-wheelbarrow',
        name: 'The Wheelbarrow',
        category: 'standing',
        description: 'The receiving partner is held by their legs while their hands are on the floor or bed. The other partner stands and holds their hips. Athletic and fun!',
    },
    {
        id: 'against-the-wall',
        name: 'Against the Wall',
        category: 'standing',
        description: 'One partner is lifted and pressed against a wall, wrapping their legs around the other. A passionate, powerful position that requires strength.',
    },

    // Seated Positions
    {
        id: 'the-throne',
        name: 'The Throne',
        category: 'seated',
        description: 'One partner sits on a chair or edge of bed while the other sits on their lap, facing them. Allows for intimate embracing and controlled movement.',
    },
    {
        id: 'lap-dance',
        name: 'Lap Dance',
        category: 'seated',
        description: 'One partner sits while the other sits on their lap facing away, similar to reverse cowgirl but in a chair. Great for letting the partner on top control the pace.',
    },
    {
        id: 'the-mastery',
        name: 'The Mastery',
        category: 'seated',
        description: 'One partner sits on the edge of a bed or chair while the other partner kneels in front of them, wrapping legs around their waist. Intimate and allowing for deep eye contact.',
    },
    {
        id: 'the-amazon',
        name: 'The Amazon',
        category: 'seated',
        description: 'The receiving partner lies on their back with knees up while the other partner squats over them. A powerful position that reverses traditional dynamics.',
    },
    {
        id: 'the-cradle',
        name: 'The Cradle',
        category: 'seated',
        description: 'One partner sits with legs extended while the other sits on their lap with legs wrapped around. Close and nurturing, allowing for lots of skin-to-skin contact.',
    },

    // Advanced Positions
    {
        id: 'the-helicopter',
        name: 'The Helicopter',
        category: 'advanced',
        description: 'Starting in cowgirl, the partner on top slowly rotates 360 degrees without disconnecting. A challenging but playful position for adventurous couples.',
    },
    {
        id: 'the-spider',
        name: 'The Spider',
        category: 'advanced',
        description: 'Both partners sit facing each other, leaning back on their hands with legs interlocked. Creates a spider-like shape and allows both partners to control movement.',
    },
    {
        id: 'the-piledriver',
        name: 'The Piledriver',
        category: 'advanced',
        description: 'The receiving partner lies on their back and lifts their legs over their head, resting on shoulders. The other partner squats above. Requires significant flexibility!',
    },
    {
        id: 'the-standing-split',
        name: 'The Standing Split',
        category: 'advanced',
        description: 'The receiving partner stands on one leg while lifting the other straight up to the sky. The other partner holds the raised leg while standing face-to-face. Requires excellent flexibility.',
    },
    {
        id: 'the-deckchair',
        name: 'The Deckchair',
        category: 'advanced',
        description: 'The receiving partner lies back like in a deckchair, with their partner kneeling and lifting their hips. Creates a unique angle for deep stimulation.',
    },
    {
        id: 'the-waterfall',
        name: 'The Waterfall',
        category: 'advanced',
        description: 'One partner lies with their head and shoulders hanging off the edge of the bed while the other enters from above. The blood rush creates intensified sensations. Be careful!',
    },
];

export const getPositionOfTheWeek = (): Position => {
    // Use week number to deterministically select position
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const weekNumber = Math.floor((today.getTime() - startOfYear.getTime()) / (7 * 86400000));
    const index = weekNumber % positions.length;
    return positions[index];
};

// Alias for backward compatibility
export const getPositionOfTheDay = getPositionOfTheWeek;

export const getPositionsByCategory = (category: Position['category']): Position[] => {
    return positions.filter(p => p.category === category);
};
