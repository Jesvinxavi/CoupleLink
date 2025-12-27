import type { Position } from '../../data/positionsData';

interface PositionSVGProps {
    position: Position;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

// SVG path data for different position categories
// Each position uses simple stick figure representations
const positionPaths: Record<string, { figure1: string; figure2: string }> = {
    // Classic positions
    'missionary': {
        figure1: 'M20,35 L20,50 M15,42 L25,42 M17,55 L15,65 M23,55 L25,65',
        figure2: 'M20,20 L20,35 M15,27 L25,27 M17,35 L15,45 M23,35 L25,45',
    },
    'cowgirl': {
        figure1: 'M20,45 L20,60 M15,52 L25,52 M17,60 L15,70 M23,60 L25,70',
        figure2: 'M20,20 L20,35 M15,27 L25,27 M15,35 L17,45 M25,35 L23,45',
    },
    'reverse-cowgirl': {
        figure1: 'M20,45 L20,60 M15,52 L25,52 M17,60 L15,70 M23,60 L25,70',
        figure2: 'M20,20 L20,35 M15,27 L25,27 M15,35 L17,45 M25,35 L23,45',
    },
    'doggy-style': {
        figure1: 'M15,35 L30,35 M20,30 L20,40 M30,35 L35,45 M30,35 L35,25',
        figure2: 'M35,35 L50,35 M45,30 L45,40 M50,35 L55,45 M50,35 L55,25',
    },
    'lotus': {
        figure1: 'M20,40 L20,55 M15,47 L25,47 M15,55 L12,50 M25,55 L28,50',
        figure2: 'M20,20 L20,35 M15,27 L25,27 M15,35 L12,40 M25,35 L28,40',
    },
    'the-bridge': {
        figure1: 'M10,50 Q20,35 30,50 M15,50 L15,60 M25,50 L25,60',
        figure2: 'M20,25 L20,40 M15,32 L25,32 M17,40 L15,50 M23,40 L25,50',
    },
    // Spooning positions
    'spooning': {
        figure1: 'M10,40 L25,40 M15,35 L15,45 M25,40 L28,50 M25,40 L28,30',
        figure2: 'M30,40 L45,40 M35,35 L35,45 M45,40 L48,50 M45,40 L48,30',
    },
    'the-pretzel': {
        figure1: 'M15,30 L15,50 M10,40 L20,40 M15,50 L10,55 M15,50 L20,55',
        figure2: 'M25,40 L35,50 M30,42 L30,55 M35,50 L40,55 M35,50 L38,60',
    },
    'lazy-dog': {
        figure1: 'M10,45 L35,45 M20,40 L20,50',
        figure2: 'M25,35 L25,50 M20,42 L30,42 M25,50 L22,60 M25,50 L28,60',
    },
    'the-spork': {
        figure1: 'M15,30 L15,50 M10,40 L20,40 M15,50 L10,60 M15,50 L20,60',
        figure2: 'M25,30 L25,50 M20,40 L30,40 M25,50 L20,60 M25,50 L30,60',
    },
    'the-scissors': {
        figure1: 'M10,35 L25,50 M15,40 L15,50 M25,50 L25,60',
        figure2: 'M45,35 L30,50 M40,40 L40,50 M30,50 L30,60',
    },
    'the-landslide': {
        figure1: 'M10,50 L35,50 M20,45 L20,55',
        figure2: 'M25,40 L25,55 M20,47 L30,47 M25,55 L22,65 M25,55 L28,65',
    },
    // Standing positions
    'standing-facing': {
        figure1: 'M15,20 L15,45 M10,30 L20,30 M15,45 L10,60 M15,45 L20,60',
        figure2: 'M30,20 L30,45 M25,30 L35,30 M30,45 L25,60 M30,45 L35,60',
    },
    'standing-from-behind': {
        figure1: 'M15,20 L15,45 M10,30 L20,30 M15,45 L10,60 M15,45 L20,60',
        figure2: 'M25,20 L25,45 M20,30 L30,30 M25,45 L20,60 M25,45 L30,60',
    },
    'the-ballet-dancer': {
        figure1: 'M15,20 L15,45 M10,30 L20,30 M15,45 L10,60 M15,45 L20,30',
        figure2: 'M30,20 L30,45 M25,30 L35,30 M30,45 L25,60 M30,45 L35,60',
    },
    'the-wheelbarrow': {
        figure1: 'M10,35 L25,45 M15,30 L15,40 M25,45 L30,55 M25,45 L30,35',
        figure2: 'M35,25 L35,50 M30,35 L40,35 M35,50 L30,65 M35,50 L40,65',
    },
    'against-the-wall': {
        figure1: 'M20,20 L20,40 M15,28 L25,28 M20,40 L15,50 M20,40 L25,35',
        figure2: 'M30,20 L30,50 M25,30 L35,30 M30,50 L25,65 M30,50 L35,65',
    },
    // Seated positions
    'the-throne': {
        figure1: 'M20,35 L20,55 M15,42 L25,42 M15,55 L12,50 M25,55 L28,50',
        figure2: 'M20,20 L20,35 M15,27 L25,27 M15,35 L12,40 M25,35 L28,40',
    },
    'lap-dance': {
        figure1: 'M20,35 L20,55 M15,42 L25,42 M15,55 L12,50 M25,55 L28,50',
        figure2: 'M20,15 L20,30 M15,22 L25,22 M15,30 L12,25 M25,30 L28,25',
    },
    'the-mastery': {
        figure1: 'M20,40 L20,60 M15,47 L25,47 M15,60 L12,70 M25,60 L28,70',
        figure2: 'M35,25 L35,40 M30,32 L40,32 M35,40 L32,50 M35,40 L38,50',
    },
    'the-amazon': {
        figure1: 'M20,50 L20,65 M15,57 L25,57 M17,65 L15,75 M23,65 L25,75',
        figure2: 'M20,25 L20,45 M15,32 L25,32 M15,45 L18,55 M25,45 L22,55',
    },
    'the-cradle': {
        figure1: 'M15,40 L15,60 M10,47 L20,47 M10,60 L10,70 M20,60 L20,70',
        figure2: 'M25,35 L25,55 M20,42 L30,42 M20,55 L20,50 M30,55 L30,50',
    },
    // Advanced positions
    'the-helicopter': {
        figure1: 'M20,45 L20,60 M15,52 L25,52 M17,60 L15,70 M23,60 L25,70',
        figure2: 'M20,20 Q25,30 20,35 M15,27 L25,27',
    },
    'the-spider': {
        figure1: 'M10,40 L20,50 M12,45 L18,45 M20,50 L15,60 M20,50 L25,60',
        figure2: 'M40,40 L30,50 M32,45 L38,45 M30,50 L25,60 M30,50 L35,60',
    },
    'the-piledriver': {
        figure1: 'M20,30 L20,10 M15,20 L25,20 M20,30 L15,25 M20,30 L25,25',
        figure2: 'M20,35 L20,55 M15,42 L25,42 M17,55 L15,65 M23,55 L25,65',
    },
    'the-standing-split': {
        figure1: 'M15,20 L15,60 M10,30 L20,30 M15,60 L10,70 M15,35 L20,15',
        figure2: 'M30,20 L30,60 M25,30 L35,30 M30,60 L25,70 M30,60 L35,70',
    },
    'the-deckchair': {
        figure1: 'M10,40 Q20,30 25,45 M15,35 L20,45 M25,45 L22,55 M25,45 L28,55',
        figure2: 'M30,30 L30,50 M25,38 L35,38 M30,50 L27,60 M30,50 L33,60',
    },
    'the-waterfall': {
        figure1: 'M20,50 Q25,60 20,70 M15,58 L25,58 M17,70 L15,80 M23,70 L25,80',
        figure2: 'M20,25 L20,45 M15,32 L25,32 M17,45 L15,55 M23,45 L25,55',
    },
};

// Category-based default paths for positions without specific illustrations
const categoryDefaults: Record<string, { figure1: string; figure2: string }> = {
    classic: positionPaths['missionary'],
    spooning: positionPaths['spooning'],
    standing: positionPaths['standing-facing'],
    seated: positionPaths['the-throne'],
    advanced: positionPaths['the-spider'],
};

export function PositionSVG({ position, size = 'md', className = '' }: PositionSVGProps) {
    const sizeMap: Record<string, any> = {
        xs: { width: 32, height: 32, strokeWidth: 1.5 },
        sm: { width: 40, height: 40, strokeWidth: 2 },
        md: { width: 56, height: 56, strokeWidth: 2.5 },
        lg: { width: 96, height: 96, strokeWidth: 3 },
    };

    const { width, height, strokeWidth } = sizeMap[size];
    const paths = positionPaths[position.id] || categoryDefaults[position.category];

    return (
        <div
            className={`rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center overflow-hidden ${className}`}
            style={{ width, height }}
        >
            <svg
                viewBox="0 0 55 80"
                width={width * 0.8}
                height={height * 0.8}
                className="text-rose-500 dark:text-rose-400"
            >
                {/* Figure 1 (person 1) */}
                <circle cx="20" cy="15" r="5" fill="currentColor" opacity="0.9" />
                <path
                    d={paths.figure1}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.9"
                />

                {/* Figure 2 (person 2) - slightly different color */}
                <circle cx="35" cy="15" r="5" fill="currentColor" opacity="0.6" />
                <path
                    d={paths.figure2}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.6"
                />
            </svg>
        </div>
    );
}
