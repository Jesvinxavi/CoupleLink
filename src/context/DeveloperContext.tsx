import { createContext, useContext, useState, type ReactNode } from 'react';

interface DeveloperContextType {
    showDebugConsole: boolean;
    toggleDebugConsole: (show: boolean) => void;
}

const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined);

export function DeveloperProvider({ children }: { children: ReactNode }) {
    const [showDebugConsole, setShowDebugConsole] = useState(() => {
        const stored = localStorage.getItem('dev_show_debug_console');
        return stored === 'true';
    });

    const toggleDebugConsole = (show: boolean) => {
        setShowDebugConsole(show);
        localStorage.setItem('dev_show_debug_console', String(show));
    };

    return (
        <DeveloperContext.Provider value={{ showDebugConsole, toggleDebugConsole }}>
            {children}
        </DeveloperContext.Provider>
    );
}

export const useDeveloperSettings = () => {
    const context = useContext(DeveloperContext);
    if (context === undefined) {
        throw new Error('useDeveloperSettings must be used within a DeveloperProvider');
    }
    return context;
};
