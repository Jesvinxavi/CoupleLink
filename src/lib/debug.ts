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
// CONSTANTS
// ═══════════════════════════════════════
const LOG_LIMIT = 200

// ═══════════════════════════════════════
// LOG STORE
// ═══════════════════════════════════════
const logStore: LogEntry[] = []
let logId = 0
let listeners: Array<() => void> = []

const addLog = (message: string, type: LogEntry["type"] = "log") => {
    const entry: LogEntry = {
        id: logId++,
        timestamp: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: 3
        }),
        message,
        type
    }
    logStore.push(entry)
    if (logStore.length > LOG_LIMIT) {
        logStore.shift()
    }
    listeners.forEach((listener) => listener())
}

export const clearLogs = () => {
    logStore.length = 0
    listeners.forEach((listener) => listener())
}

export const debugLog = (message: string, type: LogEntry["type"] = "log") => {
    addLog(message, type)
}

export const getLogs = () => [...logStore]

export const subscribeToLogs = (listener: () => void) => {
    listeners.push(listener)
    return () => {
        listeners = listeners.filter((existing) => existing !== listener)
    }
}
