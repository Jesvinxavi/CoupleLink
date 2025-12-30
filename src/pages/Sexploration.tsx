import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { SexCounterTile } from '../components/sexploration/SexCounterTile';
import { PositionTrackerTile } from '../components/sexploration/PositionTrackerTile';
import { PleasureCouponsTile } from '../components/sexploration/PleasureCouponsTile';
import { useSexplorationModals } from '@/context/SexplorationModalContext';
import { FantasyBucketListTile } from '../components/sexploration/FantasyBucketListTile';
import { SpicyDiceTile } from '../components/sexploration/SpicyDiceTile';
import { useCoupleData } from '@/hooks/useCoupleData';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Sexploration() {
    const { couple, loading } = useCoupleData();
    const navigate = useNavigate();
    const { isFantasyFocused } = useSexplorationModals();

    useEffect(() => {
        if (!loading && couple && !couple.spicy_mode) {
            navigate('/dashboard');
        }
    }, [couple, loading, navigate]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!couple?.spicy_mode) return null;

    return (
        <>
            <div style={{ display: isFantasyFocused ? 'none' : 'contents' }}>
                <Sidebar />
                <div className="pt-14 md:ml-[250px] md:pt-0">
                    <main className="p-4 md:p-8">
                        <div className="flex max-w-7xl flex-col mx-auto space-y-8">
                            {/* Header */}
                            <motion.header
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 pt-4 md:pt-8"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">local_fire_department</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-heading-dark">
                                        Sexploration
                                    </h1>
                                    <p className="text-sm text-body-soft">
                                        Track your intimate journey together
                                    </p>
                                </div>
                            </motion.header>

                            {/* Tiles Grid */}
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {/* Sex Counter Tile */}
                                <motion.div variants={item} className="md:col-span-1">
                                    <SexCounterTile />
                                </motion.div>

                                {/* Position Tracker Tile */}
                                <motion.div variants={item} className="md:col-span-1">
                                    <PositionTrackerTile />
                                </motion.div>

                                {/* Pleasure Coupons Tile */}
                                <motion.div variants={item} className="md:col-span-1">
                                    <PleasureCouponsTile />
                                </motion.div>

                                {/* Fantasy Bucket List Tile */}
                                <motion.div variants={item} className="md:col-span-1">
                                    <FantasyBucketListTile />
                                </motion.div>

                                {/* Spicy Dice Tile */}
                                <motion.div variants={item} className="md:col-span-1">
                                    <SpicyDiceTile />
                                </motion.div>
                            </motion.div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
