// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Component, type ErrorInfo, type ReactNode } from "react"
import { logger } from "@/lib/logger"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("GlobalErrorBoundary", "Uncaught error", error, { errorInfo })
        this.setState({ error, errorInfo })
    }

    public render() {
        // ═══════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-900 text-white p-4 font-mono text-xs overflow-auto z-[10000] relative">
                    <h1 className="text-xl font-bold mb-4 text-yellow-400">⚠️ APP CRASHED</h1>
                    <div className="bg-black/50 p-2 rounded mb-4 border border-red-500">
                        <p className="font-bold text-red-300">{this.state.error?.toString()}</p>
                    </div>
                    <details className="whitespace-pre-wrap opacity-75">
                        <summary>Stack Trace</summary>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 bg-blue-600 px-4 py-2 rounded text-white font-bold active:scale-95 transition-transform"
                    >
                        Reload App
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
