import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import confetti from "canvas-confetti"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { useCoupleData } from "../hooks/useCoupleData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Alert, AlertDescription } from "../components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog"
import { PaywallModal } from "../components/ui/PaywallModal"
import { History, Image as ImageIcon, BookHeart, Clock } from "lucide-react"

export default function JoinPartner() {
    const { user } = useAuth()
    const { refreshCoupleData, userProfile } = useCoupleData()
    const navigate = useNavigate()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Restore Flow State
    const [showRestoreModal, setShowRestoreModal] = useState(false)
    const [partnerEmail, setPartnerEmail] = useState("")
    const [restoreStep, setRestoreStep] = useState<'email' | 'confirm'>('email')
    const [restoreStats, setRestoreStats] = useState<any>(null)
    const [archivedCoupleId, setArchivedCoupleId] = useState<string | null>(null)
    const [showPaywall, setShowPaywall] = useState(false)

    // Auto-redirect if we become paired (e.g. partner restored via email)
    useEffect(() => {
        if (userProfile?.couple_id) {
            setTimeout(() => {
                navigate('/');
            }, 500);
        }
    }, [userProfile?.couple_id, navigate]);

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
                console.error('RPC error', error)
                throw error
            }

            if (!data?.success) {
                // Legacy check removed. Standard error handling.
                throw new Error(data?.message || 'Failed to join')
            }
            // Refresh couple data to ensure context is updated before redirect
            await refreshCoupleData()
            // Explicitly mark onboarding as completed
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id)

            if (profileError) {
                console.error('Error setting onboarding_completed', profileError);
                console.error('Error details:', profileError.details, profileError.message, profileError.hint);
            }

            // Success! Trigger confetti and navigate
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Small delay to let confetti show before redirect
            setTimeout(() => {
                navigate("/")
            }, 1000)

        } catch (err: any) {
            console.error('Error during join:', err)
            setError(err.message || "Invalid code. Please check and try again.")
        } finally {
            setLoading(false)
        }
    }

    const checkArchivedSpace = async () => {
        if (!partnerEmail) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.rpc('check_archived_couple', {
                partner_email: partnerEmail.trim()
            });

            if (error) throw error;

            if (data?.found) {
                // Check if partner is busy
                if (data.partner_active_couple_id) {
                    setError("Unable to restore: Your partner is currently in another active space.");
                    return;
                }

                setRestoreStats(data.stats);
                setArchivedCoupleId(data.couple_id);
                setRestoreStep('confirm');
            } else {
                setError("No archived space found with this email.");
            }
        } catch (err: any) {
            console.error("Error checking archive:", err);
            setError(err.message || "Failed to check archives.");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!archivedCoupleId) return;

        // Premium Check
        if (!userProfile?.is_premium) {
            setShowPaywall(true);
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.rpc('restore_couple', {
                target_couple_id: archivedCoupleId
            });

            if (error) throw error;

            // Success
            await refreshCoupleData();
            setShowRestoreModal(false);
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });
            setTimeout(() => navigate("/"), 1000);

        } catch (err: any) {
            console.error("Restore failed:", err);
            setError("Failed to restore space. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                        {error && !showRestoreModal && (
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
                                maxLength={6}
                                className="text-center text-2xl tracking-widest uppercase"
                                required
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Enter the 6-character code
                            </p>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={loading || code.length !== 6}>
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
                            variant="outline"
                            className="w-full gap-2 border-dashed"
                            onClick={() => {
                                setShowRestoreModal(true);
                                setRestoreStep('email');
                                setPartnerEmail('');
                                setError(null);
                            }}
                        >
                            <History className="w-4 h-4" />
                            Restore Previous Space
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={() => navigate("/pairing")}
                        >
                            Back
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Restore Logic Modal */}
            <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
                <DialogContent className="w-[90%] sm:max-w-[425px] rounded-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {restoreStep === 'email' ? "Restore Previous Space" : "Welcome Back!"}
                        </DialogTitle>
                        <DialogDescription>
                            {restoreStep === 'email'
                                ? "Enter your partner's email address to find your previous space."
                                : "We found your shared history! Would you like to restore it?"}
                        </DialogDescription>
                    </DialogHeader>

                    {error && showRestoreModal && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>
                    )}

                    {restoreStep === 'email' ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Partner's Email</Label>
                                <Input
                                    type="email"
                                    placeholder="partner@example.com"
                                    value={partnerEmail}
                                    onChange={(e) => setPartnerEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4 py-6">
                            {restoreStats && (
                                <>
                                    <div className="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-lg text-center gap-1 border border-orange-100">
                                        <Clock className="w-5 h-5 text-orange-500 mb-1" />
                                        <span className="font-bold text-lg text-orange-700">{restoreStats.duration_days}</span>
                                        <span className="text-xs text-orange-600/80">Days Together</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center gap-1 border border-blue-100">
                                        <ImageIcon className="w-5 h-5 text-blue-500 mb-1" />
                                        <span className="font-bold text-lg text-blue-700">{restoreStats.photo_count}</span>
                                        <span className="text-xs text-blue-600/80">Photos</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-3 bg-pink-50 rounded-lg text-center gap-1 border border-pink-100">
                                        <BookHeart className="w-5 h-5 text-pink-500 mb-1" />
                                        <span className="font-bold text-lg text-pink-700">{restoreStats.journal_count}</span>
                                        <span className="text-xs text-pink-600/80">Memories</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">

                        {restoreStep === 'email' ? (
                            <Button onClick={checkArchivedSpace} disabled={!partnerEmail || loading}>
                                {loading ? "Searching..." : "Find Space"}
                            </Button>
                        ) : (
                            <Button onClick={handleRestore} disabled={loading} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                                {loading ? "Restoring..." : "Restore Space"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>


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
