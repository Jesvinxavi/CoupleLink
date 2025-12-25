import { Card, CardContent } from '../ui/card';
import { useCoupleData } from '../../hooks/useCoupleData';
import { UserAvatar } from '../ui/UserAvatar';

interface LeaderboardTileProps {
    stats: {
        myScore: number;
        partnerScore: number;
        myWins: number;
        partnerWins: number;
        ties: number;
    } | undefined;
    loading: boolean;
}

export function LeaderboardTile({ stats, loading }: LeaderboardTileProps) {
    const { userProfile, partner } = useCoupleData();

    if (loading) {
        return (
            <Card className="w-full h-48 animate-pulse bg-gray-100 dark:bg-gray-800 border-none rounded-3xl">
                <CardContent className="flex items-center justify-center h-full">
                    <span className="text-gray-400">Loading leaderboard...</span>
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    const myScore = stats.myScore;
    const partnerScore = stats.partnerScore;
    const isMeWinning = myScore > partnerScore;
    const isPartnerWinning = partnerScore > myScore;

    return (
        <Card className="w-full overflow-hidden border-none shadow-sm bg-white rounded-3xl h-full">
            <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-heading-dark uppercase tracking-wider">
                        🏆 Leaderboard
                    </h3>
                    <span className="text-xs font-medium text-body-soft bg-gray-100 px-2 py-1 rounded-full">
                        Win = 2pts • Tie = 1pt
                    </span>
                </div>

                <div className="flex items-center justify-between gap-4 flex-1">
                    {/* Me */}
                    <div className={`flex flex-col items-center justify-center flex-1 p-3 rounded-2xl transition-all ${isMeWinning ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50'}`}>
                        <div className="relative mb-2">
                            <UserAvatar
                                user={userProfile}
                                className="w-12 h-12 border-2 border-white shadow-sm"
                            />
                            {isMeWinning && (
                                <div className="absolute -top-3 -right-1 text-2xl animate-bounce">
                                    👑
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-600 mb-1">Me</span>
                        <span className={`text-2xl font-black ${isMeWinning ? 'text-amber-600' : 'text-gray-800'}`}>
                            {myScore}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                            {stats.myWins} Wins
                        </span>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-gray-300">VS</span>
                        {stats.ties > 0 && (
                            <span className="text-[10px] font-medium text-gray-400 mt-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                {stats.ties} Ties
                            </span>
                        )}
                    </div>

                    {/* Partner */}
                    <div className={`flex flex-col items-center justify-center flex-1 p-3 rounded-2xl transition-all ${isPartnerWinning ? 'bg-amber-50 border-2 border-amber-200' : 'bg-gray-50'}`}>
                        <div className="relative mb-2">
                            <UserAvatar
                                user={partner}
                                className="w-12 h-12 border-2 border-white shadow-sm"
                            />
                            {isPartnerWinning && (
                                <div className="absolute -top-3 -right-1 text-2xl animate-bounce">
                                    👑
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-600 mb-1">
                            {partner?.first_name || 'Partner'}
                        </span>
                        <span className={`text-2xl font-black ${isPartnerWinning ? 'text-amber-600' : 'text-gray-800'}`}>
                            {partnerScore}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                            {stats.partnerWins} Wins
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
