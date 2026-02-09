// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import Sidebar from "@/components/Sidebar"
import { CalendarView } from "@/components/calendar/CalendarView"
import { motion } from "framer-motion"

// ═══════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function CalendarPage() {
    return (
        <>
            <Sidebar />
            <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen dark:bg-gray-900">
                <main className="p-4 md:p-8">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="max-w-7xl mx-auto"
                    >
                        <motion.div variants={item} className="pt-4 md:pt-8 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">calendar_month</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Plan your shared moments</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={item}>
                            <CalendarView />
                        </motion.div>
                    </motion.div>
                </main>
            </div>
        </>
    )
}
