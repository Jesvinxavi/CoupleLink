import { useState, useEffect, useRef } from "react"
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode)
    }

    const shareCode = () => {
        if (navigator.share) {
            navigator.share({
                title: "Join me on CoupleLink!",
                text: `Use this code to connect with me: ${inviteCode}`,
            })
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
                        <Button className="flex-1" onClick={copyToClipboard}>
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </Button>
                        <Button variant="outline" onClick={shareCode}>
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
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
