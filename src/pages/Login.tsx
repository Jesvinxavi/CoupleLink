// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { authConfig } from "@/lib/authConfig"
import { logger } from "@/lib/logger"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
type AuthMessage = {
    type: "success" | "error" | "info"
    text: string
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function Login() {
    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<AuthMessage | null>(null)
    const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin")
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const { user } = useAuth()
    const navigate = useNavigate()

    const isTestingMode = authConfig.isTestingMode

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        if (user) {
            navigate("/")
        }
    }, [user, navigate])

    // ═══════════════════════════════════════
    // AUTH HANDLERS
    // ═══════════════════════════════════════
    // Sign In with email/password
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        // In testing mode, use magic link (no password required)
        if (isTestingMode) {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
                },
            })

            if (error) {
                logger.error('Login', 'Magic link error', error)
                setMessage({ type: "error", text: error.message })
            } else {
                setMessage({ type: "success", text: "Check your email for the login link!" })
            }
            setLoading(false)
            return
        }

        // Production mode: require password
        if (!password) {
            setMessage({ type: "error", text: "Password is required" })
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            logger.error('Login', 'Sign in error', error)
            if (error.message.includes("Invalid login credentials")) {
                setMessage({ type: "error", text: "Invalid email or password. Please try again." })
            } else if (error.message.includes("Email not confirmed")) {
                setMessage({ type: "error", text: "Please verify your email before signing in. Check your inbox for the verification link." })
            } else {
                setMessage({ type: "error", text: error.message })
            }
        } else {
            // Navigation handled by useEffect when user state updates, but we can also nav here
            navigate("/")
        }
        setLoading(false)
    }

    // Sign Up with email/password
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)


        // In testing mode, use magic link (creates account automatically)
        if (isTestingMode) {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
                },
            })

            if (error) {
                logger.error('Login', 'Magic link signup error', error)
                setMessage({ type: "error", text: error.message })
            } else {
                setMessage({ type: "success", text: "Check your email for the login link! This will create your account." })
            }
            setLoading(false)
            return
        }

        // Production mode: validate password
        if (!password) {
            setMessage({ type: "error", text: "Password is required" })
            setLoading(false)
            return
        }

        if (password.length < authConfig.minPasswordLength) {
            setMessage({ type: "error", text: `Password must be at least ${authConfig.minPasswordLength} characters` })
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" })
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
            },
        })

        if (error) {
            logger.error('Login', 'Signup error', error)
            if (error.message.includes("already registered")) {
                setMessage({ type: "error", text: "This email is already registered. Try signing in instead." })
            } else {
                setMessage({ type: "error", text: error.message })
            }
        } else {
            setMessage({
                type: "success",
                text: "Account created! Please check your email to verify your account before signing in."
            })
        }
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
            },
        })

        if (error) {
            logger.error('Login', 'Google login error', error)
            setMessage({ type: "error", text: error.message })
            setLoading(false)
        }
    }

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════
    const resetForm = () => {
        setPassword("")
        setConfirmPassword("")
        setMessage(null)
    }

    // Forgot Password / Set Password for existing users
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!email) {
            setMessage({ type: "error", text: "Please enter your email address" })
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
        })

        if (error) {
            logger.error('Login', 'Password reset error', error)
            setMessage({ type: "error", text: error.message })
        } else {
            setMessage({
                type: "success",
                text: "Password reset link sent! Check your email to set a new password."
            })
        }
        setLoading(false)
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
                        {isTestingMode
                            ? "Testing Mode: Sign in with just your email"
                            : "Sign in or create an account to get started"
                        }
                    </CardDescription>
                    {isTestingMode && (
                        <div className="text-center">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                🧪 Testing Mode Active
                            </span>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"}>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "signin" | "signup"); resetForm(); }}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        {/* Sign In Tab */}
                        <TabsContent value="signin" className="space-y-4">
                            {showForgotPassword ? (
                                // Forgot Password Form
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="text-center mb-4">
                                        <h3 className="font-semibold">Reset Your Password</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Enter your email and we'll send you a link to set a new password
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-email">Email</Label>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => { setShowForgotPassword(false); setMessage(null); }}
                                    >
                                        Back to Sign In
                                    </Button>
                                </form>
                            ) : (
                                // Regular Sign In Form
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">Email</Label>
                                        <Input
                                            id="signin-email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {!isTestingMode && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="signin-password">Password</Label>
                                                <button
                                                    type="button"
                                                    className="text-xs text-primary hover:underline"
                                                    onClick={() => setShowForgotPassword(true)}
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <Input
                                                id="signin-password"
                                                type="password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading
                                            ? (isTestingMode ? "Sending link..." : "Signing in...")
                                            : (isTestingMode ? "Send Login Link" : "Sign In")
                                        }
                                    </Button>
                                    {!isTestingMode && (
                                        <p className="text-xs text-center text-muted-foreground">
                                            Existing user without a password?{" "}
                                            <button
                                                type="button"
                                                className="text-primary hover:underline"
                                                onClick={() => setShowForgotPassword(true)}
                                            >
                                                Set one here
                                            </button>
                                        </p>
                                    )}
                                </form>
                            )}
                        </TabsContent>

                        {/* Sign Up Tab */}
                        <TabsContent value="signup" className="space-y-4">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                {!isTestingMode && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="signup-password">Password</Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="Create a password"
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
                                            <Label htmlFor="signup-confirm">Confirm Password</Label>
                                            <Input
                                                id="signup-confirm"
                                                type="password"
                                                placeholder="Confirm your password"
                                                value={confirmPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading
                                        ? (isTestingMode ? "Sending link..." : "Creating account...")
                                        : (isTestingMode ? "Send Signup Link" : "Create Account")
                                    }
                                </Button>
                                {!isTestingMode && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        You'll receive a verification email to confirm your account
                                    </p>
                                )}
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
