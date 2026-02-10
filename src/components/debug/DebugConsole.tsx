import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Trash2, ChevronUp, ChevronDown, Bug } from "lucide-react"
import { useDeveloperSettings } from "@/context/DeveloperContext"
import { getLogs, subscribeToLogs, clearLogs } from "@/lib/debug"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface LogEntry {
    id: number
    timestamp: string
    message: string
    type: "log" | "warn" | "error" | "info"
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function DebugConsole() {
    const { showDebugConsole } = useDeveloperSettings()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>(() => getLogs() as unknown as LogEntry[])
    const [copied, setCopied] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const copyTimeoutRef = useRef<number | null>(null)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        const unsubscribe = subscribeToLogs(() => setLogs(getLogs() as unknown as LogEntry[]))
        return unsubscribe
    }, [])

    useEffect(() => {
        if (scrollRef.current && !isMinimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs, isMinimized])

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current)
            }
        }
    }, [])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleCopy = useCallback(async () => {
        const text = logs
            .map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`)
            .join("\n")

        const markCopied = () => {
            setCopied(true)
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current)
            }
            copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
        }

        try {
            await navigator.clipboard.writeText(text)
            markCopied()
        } catch {
            const textarea = document.createElement("textarea")
            textarea.value = text
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand("copy")
            document.body.removeChild(textarea)
            markCopied()
        }
    }, [logs])

    const handleClear = useCallback(() => {
        clearLogs()
    }, [])

    const handleToggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev)
    }, [])

    const handleOpen = useCallback(() => {
        setIsOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setIsOpen(false)
    }, [])

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    const getTypeColor = (type: LogEntry["type"]) => {
        switch (type) {
            case "error":
                return "text-red-400"
            case "warn":
                return "text-yellow-400"
            case "info":
                return "text-blue-400"
            default:
                return "text-green-400"
        }
    }

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (!showDebugConsole) return null

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return createPortal(
        <>
            {/* Toggle Button - Always visible */}
            {!isOpen && (
                <motion.button
                    drag
                    dragMomentum={false}
                    whileDrag={{ scale: 1.1 }}
                    onClick={handleOpen}
                    className="fixed bottom-4 left-4 z-[9999] w-12 h-12 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center active:scale-95 touch-none"
                >
                    <Bug className="w-6 h-6" />
                </motion.button>
            )}

            {/* Console Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-[9999] bg-gray-900 text-white shadow-2xl rounded-t-2xl overflow-hidden"
                        style={{
                            height: isMinimized ? "48px" : "50vh",
                            maxHeight: isMinimized ? "48px" : "400px"
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
                                    <Copy className={`w-4 h-4 ${copied ? "text-green-400" : "text-gray-400"}`} />
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title="Clear logs"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                    onClick={handleToggleMinimize}
                                    className="p-2 rounded hover:bg-gray-700 active:bg-gray-600 transition-colors"
                                    title={isMinimized ? "Expand" : "Minimize"}
                                >
                                    {isMinimized ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>
                                <button
                                    onClick={handleClose}
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
                                style={{ paddingBottom: "48px" }}
                            >
                                {logs.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No logs yet</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="py-0.5 border-b border-gray-800 last:border-0">
                                            <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                                            <span className={getTypeColor(log.type)}>[{log.type.toUpperCase()}]</span>{" "}
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
    )
}
