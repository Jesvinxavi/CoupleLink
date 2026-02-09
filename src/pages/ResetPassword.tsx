// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { authConfig } from "@/lib/authConfig"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/AuthContext"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type ResetMessage = {
    type: "success" | "error"
    text: string
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function ResetPassword() {
    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<ResetMessage | null>(null)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const navigate = useNavigate()
    const { completeRecovery } = useAuth() // Destructure completeRecovery from useAuth

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        // Check if user arrived here via a valid reset password link
        // Supabase automatically handles the token from the URL
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) {
                logger.error('ResetPassword', 'Failed to get auth session', error)
            }

            if (session) {
                setIsValidSession(true)
            } else {
                setMessage({
                    type: "error",
                    text: "Invalid or expired reset link. Please request a new password reset."
                })
            }
            setCheckingSession(false)
        }

        checkSession()
    }, [])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (password.length < authConfig.minPasswordLength) {
            setMessage({
                type: "error",
                text: `Password must be at least ${authConfig.minPasswordLength} characters`
            })
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" })
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            logger.error('ResetPassword', 'Failed to update password', error)
            setMessage({ type: "error", text: error.message })
        } else {
            setMessage({ type: "success", text: "Password updated successfully! Redirecting..." })

            // Clear recovery mode so we can access dashboard
            await completeRecovery()

            setTimeout(() => {
                navigate("/")
            }, 2000)
        }
        setLoading(false)
    }

    // ═══════════════════════════════════════
    // EARLY RETURNS
    // ═══════════════════════════════════════
    if (checkingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Verifying reset link...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Couple<span className="text-[#EA2831]">Link</span>
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isValidSession ? "Set your new password" : "Password Reset"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {isValidSession ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    required
                                    minLength={authConfig.minPasswordLength}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum {authConfig.minPasswordLength} characters
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-new-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Updating..." : "Set New Password"}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                The reset link may have expired or been already used.
                            </p>
                            <Button
                                className="w-full"
                                onClick={() => navigate("/login")}
                            >
                                Back to Login
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}











