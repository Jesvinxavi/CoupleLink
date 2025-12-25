import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

// Set to true to skip authentication during testing
const SKIP_AUTH = false

export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    // Skip authentication check if SKIP_AUTH is enabled
    if (SKIP_AUTH) {
        return <Outlet />
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    return user ? <Outlet /> : <Navigate to="/login" />
}
