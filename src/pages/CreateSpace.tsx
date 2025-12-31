import { useState, useEffect, useRef } from "react"
import { Copy, Share2, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { useCoupleData } from "../hooks/useCoupleData"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Alert, AlertDescription } from "../components/ui/alert"

export default function CreateSpace() {
    const { user } = useAuth()
    const { refreshCoupleData } = useCoupleData()
    const navigate = useNavigate()
    const [inviteCode, setInviteCode] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [coupleId, setCoupleId] = useState<string | null>(null)
    const generatingRef = useRef(false)
    const mountedRef = useRef(true)

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
                    const { data: existingCouple } = await supabase.from("couples").select("*").eq("id", profile.couple_id).single()

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

                const code = Math.random().toString(36).substring(2, 8).toUpperCase()

                const { data: couple, error: coupleError } = await supabase
                    .from("couples")
                    .insert({ invite_code: code, user_one_id: user!.id }).select().single()

                if (coupleError) throw coupleError

                const { error: profileError } = await supabase
                    .from("profiles").update({ couple_id: couple.id }).eq("id", user!.id)

                if (profileError) throw profileError

                if (profileError) throw profileError

                await refreshCoupleData()

                if (mountedRef.current) {
                    setInviteCode(code)
                    setCoupleId(couple.id) // Trigger subscription
                    setLoading(false)
                }

            } catch (err: any) {
                console.error('Error in generateSpace', err)
                if (mountedRef.current) {
                    setError(err.message)
                    setLoading(false)
                }
            }
        }

        generateSpace()
    }, [user, navigate, refreshCoupleData]) // Added refreshCoupleData to deps

    useEffect(() => {
        if (!coupleId) return

        const channel = supabase
            .channel(`couple:${coupleId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${coupleId}` }, async (payload) => {
                if (payload.new.user_two_id) {
                    // Explicitly mark onboarding as completed
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ onboarding_completed: true })
                        .eq('id', user!.id)

                    if (profileError) console.error('Error setting onboarding_completed', profileError)

                    navigate("/")
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [coupleId, navigate, refreshCoupleData])

    // Reset copied state if the code changes
    useEffect(() => {
        setCopied(false)
    }, [inviteCode])

    const [copied, setCopied] = useState(false)
    const [isSharing, setIsSharing] = useState(false)

    const copyToClipboard = async () => {
        console.log("----------------------------------------")
        console.log("[CreateSpace] Copy Button Clicked")
        console.log("[CreateSpace] Invite Code:", inviteCode)
        console.log("[CreateSpace] Secure Context:", window.isSecureContext)
        console.log("[CreateSpace] navigator.clipboard:", navigator.clipboard)

        if (!inviteCode) {
            console.error("[CreateSpace] Abort: No invite code")
            return
        }

        try {
            if (!navigator.clipboard) {
                console.error("[CreateSpace] navigator.clipboard API missing. Check HTTPS/Localhost.")
                // Fallback using execCommand for older mobile browsers/http
                const textArea = document.createElement("textarea")
                textArea.value = inviteCode

                // Avoid scrolling to bottom
                textArea.style.top = "0"
                textArea.style.left = "0"
                textArea.style.position = "fixed"

                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()

                try {
                    const successful = document.execCommand('copy')
                    const msg = successful ? 'successful' : 'unsuccessful'
                    console.log('[CreateSpace] Fallback execCommand was ' + msg)
                    if (successful) {
                        setCopied(true)
                        // Persistent success state as requested
                    } else {
                        throw new Error("execCommand returned false")
                    }
                } catch (err) {
                    console.error('[CreateSpace] Fallback execCommand error', err)
                }

                document.body.removeChild(textArea)
                return
            }

            console.log("[CreateSpace] Attempting navigator.clipboard.writeText...")
            await navigator.clipboard.writeText(inviteCode)
            console.log("[CreateSpace] WriteText Promise Resolved - Success")

            setCopied(true)
            // Persistent success state as requested

        } catch (err) {
            console.error('[CreateSpace] Failed to copy token:', err)
            // Try fallback if writeText fails (e.g. mobile permissions)
            console.log("[CreateSpace] Attempting fallback after writeText failure...")
            // ... (Same fallback logic potentially, but let's see logs first)
        }
    }

    const shareCode = async () => {
        console.log("----------------------------------------")
        console.log("[CreateSpace] Share Button Clicked")
        console.log("[CreateSpace] navigator.share supported:", !!navigator.share)
        console.log("[CreateSpace] navigator.canShare supported:", !!navigator.canShare)

        const shareData = {
            title: "Join me on CoupleLink!",
            text: `Use this code to connect with me: ${inviteCode}`,
            url: window.location.origin
        }

        console.log("[CreateSpace] Data to share:", shareData)

        if (!navigator.share) {
            console.warn("[CreateSpace] navigator.share missing")
            const isSecure = window.isSecureContext
            const protocol = window.location.protocol
            alert(`Sharing unavailable.\n\nDebug Info:\nSecure Context: ${isSecure}\nProtocol: ${protocol}\nNavigator.share: ${!!navigator.share}\n\nNote: iOS/Chrome requires HTTPS for sharing.`)
            return
        }

        if (navigator.canShare && !navigator.canShare(shareData)) {
            console.warn("[CreateSpace] navigator.canShare returned false for data")
            alert("This device doesn't support sharing this specific data.")
            return
        }

        setIsSharing(true)
        try {
            console.log("[CreateSpace] Calling navigator.share()...")
            await navigator.share(shareData)
            console.log("[CreateSpace] navigator.share() completed successfully")
        } catch (err) {
            console.error("[CreateSpace] Error sharing:", err)
            // Don't fallback to copy on error (like user cancellation)
        } finally {
            setIsSharing(false)
        }
    }

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
