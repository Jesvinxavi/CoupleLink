import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeveloperSettings } from '../../context/DeveloperContext';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Trash2, ChevronUp, ChevronDown, Bug } from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: 'log' | 'warn' | 'error' | 'info';
}

// Global log storage
const logStore: LogEntry[] = [];
let logId = 0;
let listeners: (() => void)[] = [];

const addLog = (message: string, type: LogEntry['type'] = 'log') => {
    const entry: LogEntry = {
        id: logId++,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
        message,
        type
    };
    logStore.push(entry);
    // Keep only last 200 logs
    if (logStore.length > 200) {
        logStore.shift();
    }
    listeners.forEach(l => l());
};

const clearLogs = () => {
    logStore.length = 0;
    listeners.forEach(l => l());
};

// Export for use in other components
export const debugLog = (message: string, type: LogEntry['type'] = 'log') => {
    addLog(message, type);
};

export function DebugConsole() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([...logStore]);
    const [copied, setCopied] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const listener = () => setLogs([...logStore]);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current && !isMinimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isMinimized]);

    const handleCopy = useCallback(async () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [logs]);

    const handleClear = () => {
        clearLogs();
    };

    const getTypeColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'error': return 'text-red-400';
            case 'warn': return 'text-yellow-400';
            case 'info': return 'text-blue-400';
            default: return 'text-green-400';
        }
    };

    const { showDebugConsole } = useDeveloperSettings();

    if (!showDebugConsole) return null;

    return createPortal(
        <>
            {/* Toggle Button - Always visible */}
            {!isOpen && (
                <motion.button
                    drag
                    dragMomentum={false}
                    whileDrag={{ scale: 1.1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 left-4 z-[9999] w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center active:scale-95 touch-none"
                >
                    <Bug className="w-6 h-6" />
                </motion.button>
            )}

            {/* Console Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-[9999] bg-gray-900 text-white shadow-2xl rounded-t-2xl overflow-hidden"
                        style={{
                            height: isMinimized ? '48px' : '50vh',
                            maxHeight: isMinimized ? '48px' : '400px'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                            <div className="flex items-center gap-2">
                                <Bug className="w-4 h-4 text-green-400" />
                                <span className="font-mono text-sm font-bold">Debug Console</span>
                                <span className="text-xs text-gray-400">({logs.length})</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title="Copy logs"
                                >
                                    <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-gray-400'}`} />
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title="Clear logs"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title={isMinimized ? 'Expand' : 'Minimize'}
                                >
                                    {isMinimized ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Log Content */}
                        {!isMinimized && (
                            <div
                                ref={scrollRef}
                                className="h-full overflow-y-auto p-2 font-mono text-xs"
                                style={{ paddingBottom: '48px' }}
                            >
                                {logs.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No logs yet</div>
                                ) : (
                                    logs.map(log => (
                                        <div key={log.id} className="py-0.5 border-b border-gray-800 last:border-0">
                                            <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                            <span className={getTypeColor(log.type)}>[{log.type.toUpperCase()}]</span>{' '}
                                            <span className="text-gray-200 break-all">{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
