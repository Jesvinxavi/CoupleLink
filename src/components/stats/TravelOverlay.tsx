// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Globe } from "lucide-react"
import { getContinent } from "@/utils/geocoding"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface TravelOverlayProps {
    isOpen: boolean
    onClose: () => void
    countries: string[]
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function TravelOverlay({ isOpen, onClose, countries }: TravelOverlayProps) {
    useLockBodyScroll(isOpen)

    // ═══════════════════════════════════════
    // DERIVED DATA
    // ═══════════════════════════════════════
    const groupedCountries = useMemo(() => {
        const groups: Record<string, string[]> = {}

        // Initialize standard order
        const order = ["Europe", "North America", "Asia", "South America", "Oceania", "Africa", "Other"]
        order.forEach(c => groups[c] = [])

        countries.forEach(country => {
            const continent = getContinent(country)
            if (!groups[continent]) groups[continent] = []
            groups[continent].push(country)
        })

        // Filter out empty continents
        return Object.entries(groups).filter(([_, list]) => list.length > 0)
    }, [countries])

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
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
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Overlay */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
                        className="fixed inset-x-0 bottom-0 z-[61] outline-none overflow-hidden"
                        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-white dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container */}
                        <div className="flex flex-col w-full bg-white dark:bg-gray-900 max-h-[85vh] shadow-2xl ring-1 ring-black/5 rounded-t-[32px] overflow-hidden">
                            {/* Header */}
                            <div className="shrink-0 z-10 bg-white dark:bg-gray-900 relative overflow-hidden">
                                {/* Decorative Blur Background - Blue Theme */}
                                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-900/10 dark:via-gray-900 dark:to-gray-900 z-0"></div>
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl z-0 pointer-events-none"></div>
                                <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-200/30 rounded-full blur-3xl z-0 pointer-events-none"></div>

                                <div className="relative z-10 px-6 pt-4 pb-4">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                Places Explored
                                                <span className="text-2xl">🌍</span>
                                            </h2>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Your adventures around the world</p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Total Countries Display - Big & Premium */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>
                                            <div className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 drop-shadow-sm tracking-tighter">
                                                {countries.length}
                                            </div>
                                        </div>
                                        <span className="mt-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
                                            {countries.length === 1 ? "Country" : "Countries"} Visited Together
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div
                                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                onTouchMove={(e) => e.stopPropagation()}
                            >
                                {groupedCountries.length > 0 ? groupedCountries.map(([continent, list]) => {
                                    // Continent Colors
                                    const colors: Record<string, string> = {
                                        "Europe": "text-blue-500",
                                        "North America": "text-rose-500",
                                        "Asia": "text-amber-500",
                                        "South America": "text-emerald-500",
                                        "Africa": "text-purple-500",
                                        "Oceania": "text-cyan-500",
                                        "Other": "text-gray-500"
                                    }
                                    const colorClass = colors[continent] || "text-gray-500"

                                    return (
                                        <div key={continent} className="space-y-2">
                                            <h3 className={`text-lg font-bold ${colorClass} pl-1`}>
                                                {continent}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 pl-2">
                                                {list.map((country, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-100 dark:bg-gray-800 py-2.5 px-4 rounded-xl border-0 text-gray-900 dark:text-gray-100 font-medium text-sm w-fit"
                                                    >
                                                        {country}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl"></div>
                                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 flex items-center justify-center shadow-lg ring-1 ring-black/5 dark:ring-white/10 rotate-3">
                                                <Globe className="w-10 h-10 text-blue-500" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No travels yet</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px]">Add locations to your memories to visualize your journey around the world!</p>
                                    </div>
                                )}

                                {/* Bottom padding for safety */}
                                <div className="h-8" />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
