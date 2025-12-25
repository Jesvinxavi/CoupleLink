import { JournalFeed } from "@/components/journal/JournalFeed"
import { motion } from "framer-motion"
import Sidebar from "@/components/Sidebar"

export default function JournalPage() {
    return (
        <>
            <Sidebar />
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20 md:pb-0 md:pl-64 transition-all duration-300 pt-14 md:pt-0">
                <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 pt-4 md:pt-8"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl">menu_book</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Journal
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Document your journey together
                            </p>
                        </div>
                    </motion.div>

                    {/* Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <JournalFeed />
                    </motion.div>
                </div>
            </div>
        </>
    )
}
