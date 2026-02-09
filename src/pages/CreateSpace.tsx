// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useRef } from "react"
import { Copy, Share2, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useAuth } from "@/context/AuthContext"
import { useCoupleData } from "@/hooks/useCoupleData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CreateCoupleResult } from "@/types/rpc"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function CreateSpace() {
    const { user } = useAuth()
    const { refreshCoupleData } = useCoupleData()
    const navigate = useNavigate()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [inviteCode, setInviteCode] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [coupleId, setCoupleId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isSharing, setIsSharing] = useState(false)

    // ═══════════════════════════════════════
    // REFS
    // ═══════════════════════════════════════
    const generatingRef = useRef(false)
    const mountedRef = useRef(true)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    useEffect(() => {
        if (!user || generatingRef.current) return

        async function generateSpace() {
            generatingRef.current = true
            try {
                const { data: profile } = await supabase.from("profiles").select("couple_id").eq("id", user!.id).single()


                if (profile?.couple_id) {
                    const { data: existingCouple } = await supabase
                        .from("couples")
                        .select("id, invite_code, user_two_id")
                        .eq("id", profile.couple_id)
                        .single()

                    if (existingCouple) {
                        if (existingCouple.user_two_id) {
                            await refreshCoupleData()
                            navigate("/")
                            return
                        }
                        if (mountedRef.current) {
                            setInviteCode(existingCouple.invite_code || "")
                            setCoupleId(existingCouple.id) // Trigger subscription
                            setLoading(false)
                        }
                        return
                    }
                }

                const { data: createData, error: createError } = await supabase
                    .rpc("create_couple_with_invite")

                if (createError) throw createError

                const result = createData as unknown as CreateCoupleResult

                if (!result?.success || !result.couple_id || !result.invite_code) {
                    throw new Error(result?.message || "Failed to create space")
                }

                await refreshCoupleData()

                if (mountedRef.current) {
                    setInviteCode(result.invite_code)
                    setCoupleId(result.couple_id) // Trigger subscription
                    setLoading(false)
                }

            } catch (err: any) {
                logger.error('CreateSpace', 'Error generating space', err)
                if (mountedRef.current) {
                    setError(err.message)
                    setLoading(false)
                }
            }
        }

        generateSpace()
    }, [user, navigate, refreshCoupleData]) // Added refreshCoupleData to deps

    useEffect(() => {
        if (!coupleId || !user) return

        const stopPerf = logger.perf("CreateSpace", "Realtime subscription setup")
        let perfLogged = false

        const channel = supabase
            .channel(`couple:${coupleId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${coupleId}` }, async (payload) => {
                if (payload.new.user_two_id) {
                    // Explicitly mark onboarding as completed
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ onboarding_completed: true })
                        .eq('id', user!.id)

                    if (profileError) {
                        logger.error('CreateSpace', 'Error setting onboarding_completed', profileError)
                    }

                    navigate("/")
                }
            })
            .subscribe((status) => {
                if (!perfLogged && status === "SUBSCRIBED") {
                    perfLogged = true
                    stopPerf()
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [coupleId, navigate, user])

    // Reset copied state if the code changes
    useEffect(() => {
        setCopied(false)
    }, [inviteCode])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const copyToClipboard = async () => {
        if (!inviteCode) {
            logger.warn("CreateSpace", "Copy aborted: no invite code");
            return;
        }

        if (!navigator.clipboard) {
            logger.warn("CreateSpace", "Clipboard API unavailable");
            setError("Clipboard is unavailable in this browser. Please copy the code manually.");
            return;
        }

        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
        } catch (err) {
            logger.error("CreateSpace", "Failed to copy invite code", err);
            setError("Failed to copy the invite code. Please try again.");
        }
    }

    const shareCode = async () => {
        if (!inviteCode) {
            logger.warn("CreateSpace", "Share aborted: no invite code");
            return;
        }

        const shareData = {
            title: "Join me on CoupleLink!",
            text: `Use this code to connect with me: ${inviteCode}`,
            url: window.location.origin
        }

        if (!navigator.share) {
            logger.warn("CreateSpace", "Share API unavailable");
            setError("Sharing is not supported on this device.");
            return;
        }

        if (navigator.canShare && !navigator.canShare(shareData)) {
            logger.warn("CreateSpace", "Share payload not supported");
            setError("This device doesn't support sharing this data.");
            return;
        }

        setIsSharing(true)
        try {
            await navigator.share(shareData)
        } catch (err) {
            logger.error("CreateSpace", "Error sharing invite code", err)
        } finally {
            setIsSharing(false)
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Generating your space...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Your Invite Code</CardTitle>
                    <CardDescription>
                        Share this code with your partner to connect
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="rounded-lg bg-primary/10 p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Your Code</p>
                        <p className="text-4xl font-bold tracking-widest text-primary">{inviteCode}</p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            className={`flex-1 transition-all text-white ${copied ? "bg-green-500 hover:bg-green-600" : "bg-[#EA2831] hover:bg-[#D41F27]"}`}
                            onClick={copyToClipboard}
                            disabled={!inviteCode}
                        >
                            {copied ? (
                                <Check className="mr-2 h-4 w-4" />
                            ) : (
                                <Copy className="mr-2 h-4 w-4" />
                            )}
                            {copied ? "Copied!" : "Copy Code"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={shareCode}
                            disabled={isSharing || !inviteCode}
                            className="border-gray-200 hover:bg-gray-50 hover:text-[#EA2831]"
                        >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center text-sm text-muted-foreground">
                            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                            Waiting for partner to join...
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
