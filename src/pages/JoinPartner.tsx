// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import confetti from "canvas-confetti"
import { supabase } from "@/lib/supabase"
import { LIMITS } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { useAuth } from "@/context/AuthContext"
import { useCoupleData } from "@/hooks/useCoupleData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { PaywallModal } from "@/components/ui/PaywallModal"
import type { JoinCoupleResult } from "@/types/rpc"


// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function JoinPartner() {
    const { user } = useAuth()
    const { refreshCoupleData, userProfile } = useCoupleData()
    const navigate = useNavigate()
    const location = useLocation()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPaywall, setShowPaywall] = useState(false)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    // Auto-redirect if we become paired (e.g. partner restored via email)
    useEffect(() => {
        if (userProfile?.couple_id) {
            setTimeout(() => {
                navigate('/');
            }, 500);
        }
    }, [userProfile?.couple_id, navigate]);

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.rpc('join_couple', {
                invite_code_input: code.toUpperCase()
            })

            if (error) {
                logger.error('JoinPartner', 'RPC error', error)
                throw error
            }

            const result = data as unknown as JoinCoupleResult;
            if (!result?.success) {
                const message = result?.message || 'Failed to join'
                if (message.toLowerCase().includes("premium") || message.toLowerCase().includes("upgrade")) {
                    setShowPaywall(true)
                    return
                }
                throw new Error(message)
            }
            // Refresh couple data to ensure context is updated before redirect
            await refreshCoupleData()
            // Explicitly mark onboarding as completed
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id)

            if (profileError) {
                logger.error('JoinPartner', 'Error setting onboarding_completed', profileError);
            }

            // Success! Trigger confetti and navigate
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Small delay to let confetti show before redirect
            setTimeout(() => {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                window.scrollTo(0, 0);
                navigate("/")
            }, 1000)

        } catch (err: any) {
            logger.error('JoinPartner', 'Error during join', err)
            const message = err?.message || "Invalid code. Please check and try again."
            if (message.toLowerCase().includes("premium") || message.toLowerCase().includes("upgrade")) {
                setShowPaywall(true)
                return
            }
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md relative overflow-hidden">
                {/* Visual flourish */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500" />

                <CardHeader>
                    <CardTitle>Join Your Partner</CardTitle>
                    <CardDescription>
                        Enter the code your partner shared with you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleJoin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="code">Invite Code</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                                placeholder="LOVE8X"
                                maxLength={LIMITS.MAX_INVITE_CODE_LENGTH}
                                className="text-center text-2xl tracking-widest uppercase"
                                required
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Enter the 6-character code
                            </p>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading || code.length !== LIMITS.MAX_INVITE_CODE_LENGTH}>
                            {loading ? "Connecting..." : "Connect"}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>



                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                if (location.state?.from === 'dashboard') {
                                    navigate("/dashboard")
                                } else {
                                    navigate("/pairing")
                                }
                            }}
                        >
                            Back
                        </Button>
                    </form>
                </CardContent>
            </Card>




            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                onUpgradeSuccess={async () => {
                    await refreshCoupleData();
                    // Optional: You could auto-trigger handleRestore here if you safely can, 
                    // but asking user to click 'Restore' again is safer and clear.
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                }}
            />
        </div >
    )
}
