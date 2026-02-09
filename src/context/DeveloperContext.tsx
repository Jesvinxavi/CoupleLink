import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface DeveloperContextType {
    showDebugConsole: boolean;
    toggleDebugConsole: (show: boolean) => void;
}

// ═══════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════
const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined);

// ═══════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════
export function DeveloperProvider({ children }: { children: ReactNode }) {
    const [showDebugConsole, setShowDebugConsole] = useState(() => {
        const stored = localStorage.getItem('dev_show_debug_console');
        return stored === 'true';
    });

    const toggleDebugConsole = useCallback((show: boolean) => {
        setShowDebugConsole(show);
        localStorage.setItem('dev_show_debug_console', String(show));
    }, []);

    const contextValue = useMemo(
        () => ({ showDebugConsole, toggleDebugConsole }),
        [showDebugConsole, toggleDebugConsole]
    );

    return (
        <DeveloperContext.Provider value={contextValue}>
            {children}
        </DeveloperContext.Provider>
    );
}

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
export const useDeveloperSettings = () => {
    const context = useContext(DeveloperContext);
    if (context === undefined) {
        throw new Error('useDeveloperSettings must be used within a DeveloperProvider');
    }
    return context;
};
