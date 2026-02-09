// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { SpicyDiceModal } from "@/components/sexploration/SpicyDiceModal"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function SpicyDiceTile() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleOpen = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpen}
                className="relative w-full h-full min-h-[160px] overflow-hidden rounded-3xl bg-gradient-to-br from-rose-400 to-pink-600 p-6 text-left shadow-lg shadow-rose-500/20 group"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-white text-xl">casino</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Spicy Dice</h3>
                        <p className="text-rose-100 text-sm font-medium">Roll for spontaneity</p>
                    </div>

                    {/* Floating Dice Illustration */}
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-90 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                        {/* Simple CSS Dice representation */}
                        <div className="relative w-24 h-24">
                            <div className="absolute top-0 right-4 w-12 h-12 bg-white rounded-xl shadow-lg transform rotate-12 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-16 w-10 h-10 bg-rose-200 rounded-xl shadow-lg transform -rotate-12 flex items-center justify-center">
                                <div className="w-2 h-2 bg-rose-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.button>

            <SpicyDiceModal
                isOpen={isModalOpen}
                onClose={handleClose}
            />
        </>
    )
}
