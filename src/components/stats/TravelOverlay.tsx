import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';
import { getContinent } from '../../utils/geocoding';

interface TravelOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    countries: string[];
}

export const TravelOverlay: React.FC<TravelOverlayProps> = ({ isOpen, onClose, countries }) => {
    // Group countries by continent
    const groupedCountries = React.useMemo(() => {
        const groups: Record<string, string[]> = {};

        // Initialize standard order
        const order = ['Europe', 'North America', 'Asia', 'South America', 'Oceania', 'Africa', 'Other'];
        order.forEach(c => groups[c] = []);

        countries.forEach(country => {
            const continent = getContinent(country);
            if (!groups[continent]) groups[continent] = [];
            groups[continent].push(country);
        });

        // Filter out empty continents
        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [countries]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Overlay */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-[61] bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Places Explored</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {countries.length} {countries.length === 1 ? 'Country' : 'Countries'} Visited Together
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {groupedCountries.length > 0 ? groupedCountries.map(([continent, list]) => (
                                <div key={continent} className="space-y-1">
                                    <h3 className="text-lg font-bold text-blue-500 pl-2">
                                        {continent}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 pl-4">
                                        {list.map((country, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-gray-50 dark:bg-gray-800/50 py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-800 w-fit"
                                            >
                                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {country}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                        <Globe className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No countries recorded yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Add locations to your memories to see them here!</p>
                                </div>
                            )}

                            {/* Bottom padding for safety */}
                            <div className="h-8" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
