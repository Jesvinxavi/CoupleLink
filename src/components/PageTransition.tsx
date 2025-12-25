import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`w-full min-h-screen ${className}`}
    >
        {children}
    </motion.div>
);
