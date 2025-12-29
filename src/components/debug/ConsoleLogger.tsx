import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Copy, Trash2, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LogType = 'log' | 'warn' | 'error' | 'info';

interface LogEntry {
    id: string;
    type: LogType;
    message: string;
    timestamp: string;
    details?: any;
}

export function ConsoleLogger() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Store original console methods
    const originalConsole = useRef({
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    });

    useEffect(() => {
        const addLog = (type: LogType, args: any[]) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');

            const newLog: LogEntry = {
                id: Math.random().toString(36).substring(7),
                type,
                message,
                timestamp: new Date().toLocaleTimeString(),
                details: args
            };

            setLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs

            // Call original to still see in devtools
            originalConsole.current[type](...args);
        };

        console.log = (...args) => addLog('log', args);
        console.warn = (...args) => addLog('warn', args);
        console.error = (...args) => addLog('error', args);
        console.info = (...args) => addLog('info', args);

        return () => {
            console.log = originalConsole.current.log;
            console.warn = originalConsole.current.warn;
            console.error = originalConsole.current.error;
            console.info = originalConsole.current.info;
        };
    }, []);

    const handleCopy = async () => {
        const textToCopy = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');

        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('Logs copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers or non-secure contexts
            try {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;

                // Ensure it's not visible but part of DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    alert('Logs copied to clipboard (fallback)!');
                } else {
                    throw new Error('Fallback copy failed');
                }
            } catch (fallbackErr) {
                console.error('Copy failed:', fallbackErr);
                alert('Could not copy logs automatically. Please manually select and copy the text if possible.');
            }
        }
    };

    const handleClear = () => {
        setLogs([]);
    };

    return (
        <div className="fixed bottom-20 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2">
            <div className="pointer-events-auto">
                <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full bg-black/80 text-white border-none shadow-lg backdrop-blur-sm"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronDown className="h-5 w-5" /> : <Bug className="h-5 w-5" />}
                </Button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto w-[90vw] max-w-md bg-black/90 text-green-400 p-4 rounded-xl shadow-2xl backdrop-blur-md border border-gray-800 max-h-[60vh] flex flex-col text-xs font-mono"
                    >
                        <div className="flex items-center justify-between mb-2 border-b border-gray-800 pb-2">
                            <span className="font-bold text-white">Console Logs ({logs.length})</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 hover:bg-gray-800 text-white"
                                    onClick={handleCopy}
                                >
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 hover:bg-gray-800 text-red-400 hover:text-red-300"
                                    onClick={handleClear}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
                            {logs.length === 0 ? (
                                <div className="text-gray-500 italic p-2 text-center">No logs captured yet...</div>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="border-b border-gray-800/50 last:border-0 py-1 break-words">
                                        <span className="text-gray-500">[{log.timestamp}]</span>
                                        <span className={`mx-1 font-bold ${log.type === 'error' ? 'text-red-500' :
                                            log.type === 'warn' ? 'text-yellow-500' :
                                                'text-blue-400'
                                            }`}>[{log.type.toUpperCase()}]</span>
                                        <span className="text-white/90">{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
