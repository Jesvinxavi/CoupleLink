import { motion } from 'framer-motion';
import { useSexploration } from '../../hooks/useSexploration';

export function SexCounterTile() {
    const { sexCount, incrementSexCount, decrementSexCount, loading } = useSexploration();

    return (
        <motion.div
            className="relative bg-gradient-to-br from-rose-600 to-pink-500 rounded-3xl p-6 shadow-lg shadow-rose-500/20 overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Background decoration */}
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl text-white/10 rotate-12">
                favorite
            </span>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-2xl text-white/80 bg-white/20 p-2 rounded-xl">
                        local_fire_department
                    </span>
                    <span className="font-medium text-rose-100 uppercase tracking-wider text-sm">
                        Intimacy Counter
                    </span>
                </div>

                <div className="flex items-center justify-center gap-6">
                    {/* Minus Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={decrementSexCount}
                        disabled={loading || sexCount <= 0}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        −
                    </motion.button>

                    {/* Counter Display */}
                    <motion.div
                        key={sexCount}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <span className="text-6xl font-bold text-white tabular-nums">
                            {loading ? '—' : sexCount}
                        </span>
                        <span className="text-rose-100 text-sm mt-1">times together</span>
                    </motion.div>

                    {/* Plus Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={incrementSexCount}
                        disabled={loading}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        +
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
