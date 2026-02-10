/* eslint-disable no-console */
type LogPayload = {
    data?: unknown
    error?: unknown
}

const isDev = import.meta.env.DEV

const formatPrefix = (level: string, scope?: string) => {
    const timestamp = new Date().toISOString()
    const scopeLabel = scope ? ` [${scope}]` : ''
    return `[${timestamp}] ${level}${scopeLabel}:`
}

const shouldLog = (level: 'debug' | 'info' | 'warn' | 'error') => {
    if (isDev) return true
    return level === 'warn' || level === 'error'
}

const log = (
    level: 'debug' | 'info' | 'warn' | 'error',
    scope: string,
    message: string,
    payload?: LogPayload
) => {
    if (!shouldLog(level)) return

    const prefix = formatPrefix(level.toUpperCase(), scope)
    const data = payload?.data
    const error = payload?.error

    if (error) {
        console[level](prefix, message, error, data ?? '')
        return
    }

    if (data !== undefined) {
        console[level](prefix, message, data)
        return
    }

    console[level](prefix, message)
}

const perf = (scope: string, label: string) => {
    const start = performance.now()
    return () => {
        const durationMs = performance.now() - start
        log('debug', scope, `${label} completed`, { data: { durationMs } })
        return durationMs
    }
}

export const logger = {
    debug: (scope: string, message: string, data?: unknown) =>
        log('debug', scope, message, { data }),
    info: (scope: string, message: string, data?: unknown) =>
        log('info', scope, message, { data }),
    warn: (scope: string, message: string, data?: unknown) =>
        log('warn', scope, message, { data }),
    error: (scope: string, message: string, error?: unknown, data?: unknown) =>
        log('error', scope, message, { error, data }),
    perf
}
