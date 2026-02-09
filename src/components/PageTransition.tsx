// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { motion } from "framer-motion"
import { type ReactNode, useEffect } from "react"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface PageTransitionProps {
    children: ReactNode
    className?: string
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function PageTransition({ children, className = "" }: PageTransitionProps) {
    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`w-full min-h-screen ${className}`}
        >
            {children}
        </motion.div>
    )
}
