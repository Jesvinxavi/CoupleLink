/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export type ModalType = 'raincheck' | 'streak_broken' | 'gift' | 'coupon_earned';

interface QueueItem {
    type: ModalType;
    data?: any;
    priority: number; // Higher number = higher priority
}

interface GlobalModalQueueContextType {
    enqueueModal: (type: ModalType, data?: any) => void;
    ackModal: (type: ModalType) => void;
    currentModal: QueueItem | null;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const GlobalModalQueueContext = createContext<GlobalModalQueueContextType | undefined>(undefined);

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export function useGlobalModalQueue() {
    const context = useContext(GlobalModalQueueContext);
    if (!context) {
        throw new Error('useGlobalModalQueue must be used within a GlobalModalQueueProvider');
    }
    return context;
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
// Priority mapping: Higher is more important
const PRIORITY_MAP: Record<ModalType, number> = {
    'raincheck': 100,      // Critical Notification
    'streak_broken': 90,   // Critical Alert
    'coupon_earned': 80,   // High Positive Reinforcement
    'gift': 50,            // Nice to have
};

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export const GlobalModalQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<QueueItem[]>([]);

    const enqueueModal = useCallback((type: ModalType, data?: any) => {
        setQueue(prev => {
            // Check if already in queue to avoid duplicates
            if (prev.some(item => item.type === type)) {
                return prev;
            }

            const newItem: QueueItem = {
                type,
                data,
                priority: PRIORITY_MAP[type]
            };

            const newQueue = [...prev, newItem];
            // Sort by priority descending (highest first)
            return newQueue.sort((a, b) => b.priority - a.priority);
        });
    }, []);

    const ackModal = useCallback((type: ModalType) => {
        setQueue(prev => prev.filter(item => item.type !== type));
    }, []);

    const currentModal = useMemo(() => {
        return queue.length > 0 ? queue[0] : null;
    }, [queue]);

    const contextValue = useMemo(
        () => ({ enqueueModal, ackModal, currentModal }),
        [enqueueModal, ackModal, currentModal]
    );

    return (
        <GlobalModalQueueContext.Provider value={contextValue}>
            {children}
        </GlobalModalQueueContext.Provider>
    );
};
