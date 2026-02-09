// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import confetti from "canvas-confetti"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

import { useCoupleData } from "@/hooks/useCoupleData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Image as ImageIcon, BookHeart, Clock, AlertTriangle } from "lucide-react"
import type { CheckArchivedCoupleResult } from "@/types/rpc"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function RestoreSpace() {
    const { refreshCoupleData, userProfile } = useCoupleData()
    const navigate = useNavigate()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'email' | 'confirm'>('email')
    const [restoreStats, setRestoreStats] = useState<any>(null)
    const [archivedCoupleId, setArchivedCoupleId] = useState<string | null>(null)

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const checkArchivedSpace = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.rpc('check_archived_couple', {
                partner_email: email.trim()
            });

            if (error) throw error;

            const result = data as unknown as CheckArchivedCoupleResult;
            if (result?.found) {
                if (result.partner_active_couple_id) {
                    setError("Unable to restore: Your partner is currently in another active space.");
                    return;
                }

                setRestoreStats(result.stats);
                setArchivedCoupleId(result.couple_id ?? null);
                // Preserve expires_at if available
                if (result.expires_at) {
                    setRestoreStats((prev: any) => ({ ...prev, expires_at: result.expires_at }));
                }
                setStep('confirm');
            } else {
                setError("No archived space found with this email.");
            }
        } catch (err: any) {
            logger.error("RestoreSpace", "Error checking archive", err);
            setError(err?.message || "Failed to check archives.");
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!archivedCoupleId) return;

        // Premium Check
        if (!userProfile?.is_premium) {
            setError("Premium required to restore space.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.rpc('restore_couple', {
                target_couple_id: archivedCoupleId
            });

            if (error) throw error;

            await refreshCoupleData();

            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });

            setTimeout(() => navigate("/"), 1000);

        } catch (err: any) {
            logger.error("RestoreSpace", "Restore failed", err);
            setError("Failed to restore space. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

                <CardHeader>
                    <CardTitle>
                        {step === 'email' ? "Restore Previous Space" : "Found Shared History!"}
                    </CardTitle>
                    <CardDescription>
                        {step === 'email'
                            ? "Enter your partner's email to recover your shared memories"
                            : "We found your previous space. Would you like to restore it?"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 'email' ? (
                        <form onSubmit={checkArchivedSpace} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Partner's Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="partner@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={loading || !email}
                                >
                                    {loading ? "Searching..." : "Find Space"}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-lg text-center gap-1 border border-orange-100">
                                    <Clock className="w-5 h-5 text-orange-500 mb-1" />
                                    <span className="font-bold text-lg text-orange-700">{restoreStats?.duration_days}</span>
                                    <span className="text-xs text-orange-600/80">Days Together</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg text-center gap-1 border border-blue-100">
                                    <ImageIcon className="w-5 h-5 text-blue-500 mb-1" />
                                    <span className="font-bold text-lg text-blue-700">{restoreStats?.photo_count}</span>
                                    <span className="text-xs text-blue-600/80">Photos</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-3 bg-pink-50 rounded-lg text-center gap-1 border border-pink-100">
                                    <BookHeart className="w-5 h-5 text-pink-500 mb-1" />
                                    <span className="font-bold text-lg text-pink-700">{restoreStats?.journal_count}</span>
                                    <span className="text-xs text-pink-600/80">Memories</span>
                                </div>
                            </div>

                            {restoreStats?.expires_at && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium">Warning</p>
                                        <p>
                                            This history will be permanently deleted in {Math.max(0, Math.ceil((new Date(restoreStats.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days if not restored.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => setStep('email')}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleRestore}
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                    disabled={loading}
                                >
                                    {loading ? "Restoring..." : "Restore Space"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
