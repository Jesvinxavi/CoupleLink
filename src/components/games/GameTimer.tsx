import { useEffect, useState, memo, useRef } from 'react';
import { Clock } from 'lucide-react';

interface GameTimerProps {
    duration: number;
    onTimeUp: () => void;
    currentRound: number;
    showAnswer: boolean;
    isPaused?: boolean;
}

export const GameTimer = memo(function GameTimer({
    duration,
    onTimeUp,
    currentRound,
    showAnswer,
    isPaused = false
}: GameTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);

    // Reset timer when round changes
    useEffect(() => {
        setTimeLeft(duration);
    }, [currentRound, duration]);

    // Countdown logic
    useEffect(() => {
        if (showAnswer || isPaused || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [showAnswer, isPaused]);

    // Handle time up in a separate effect to avoid state updates during render
    const hasFiredTimeUp = useRef(false);

    // Reset the fired flag when round changes or duration changes
    useEffect(() => {
        hasFiredTimeUp.current = false;
    }, [currentRound, duration]);

    useEffect(() => {
        if (timeLeft === 0 && !hasFiredTimeUp.current && !showAnswer && !isPaused) {
            hasFiredTimeUp.current = true;
            onTimeUp();
        }
    }, [timeLeft, onTimeUp, showAnswer, isPaused]);





    const isUrgent = timeLeft <= 10;

    return (
        <div
            key={isUrgent ? 'urgent' : 'normal'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full will-change-transform ${isUrgent ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
            style={{ transform: 'translateZ(0)' }}
        >
            <Clock className="w-4 h-4" />
            <span className="font-bold tabular-nums">{timeLeft}s</span>
        </div>
    );
});

