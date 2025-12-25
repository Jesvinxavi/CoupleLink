interface StreakStatsTileProps {
    currentStreak: number;
    longestStreak: number;
}

export function StreakStatsTile({ currentStreak, longestStreak }: StreakStatsTileProps) {

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-[#EA2831]">
                        local_fire_department
                    </span>
                    <div>
                        <p className="text-3xl font-bold text-heading-dark">
                            {currentStreak}
                        </p>
                        <p className="text-sm text-body-soft">Day Streak</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-body-soft">Longest</p>
                    <p className="text-2xl font-bold text-[#EA2831]">
                        {longestStreak}
                    </p>
                </div>
            </div>
        </div>
    );
}
