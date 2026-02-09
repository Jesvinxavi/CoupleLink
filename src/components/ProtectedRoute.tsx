// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { ROUTES } from "@/lib/constants"

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
// Set to true to skip authentication during testing
const SKIP_AUTH = false

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    // Skip authentication check if SKIP_AUTH is enabled
    if (SKIP_AUTH) {
        return <Outlet />
    }

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return user ? <Outlet /> : <Navigate to={ROUTES.LOGIN} />
}
