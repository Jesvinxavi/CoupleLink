import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
    onlineUsers: string[]
    isRecovery: boolean
    completeRecovery: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
    onlineUsers: [],
    isRecovery: false,
    completeRecovery: () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])
    const [isRecovery, setIsRecovery] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        // Check for recovery flow immediately
        const isRecoveryFlow = window.location.hash && window.location.hash.includes('type=recovery')
        if (isRecoveryFlow) {
            setIsRecovery(true)
        }

        // Check if there's an auth hash in the URL
        const isAuthCallback = window.location.hash && (
            window.location.hash.includes('access_token') ||
            window.location.hash.includes('error_description')
        );



        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)

            // Only set loading to false if we're not waiting for a hash callback
            // or if we already have a session
            if (!isAuthCallback || session) {
                setLoading(false)
            }

            if (session?.user) {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
                supabase
                    .from('profiles')
                    .update({ timezone: timeZone })
                    .eq('id', session.user.id)
                    .then(({ error }) => {
                        if (error) console.error('Error updating timezone:', error)
                    })
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {

            if (_event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true)
                setLoading(false)
                navigate('/reset-password')
                return
            }



            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            if (session?.user) {
                const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
                supabase
                    .from('profiles')
                    .update({ timezone: timeZone })
                    .eq('id', session.user.id)
                    .then(({ error }) => {
                        if (error) console.error('Error updating timezone:', error)
                    })
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (!user) return

        const channel = supabase.channel('online_users')
        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const users = Object.values(newState).flat() as unknown as { user_id: string }[]
                const userIds = users.map(u => u.user_id)
                setOnlineUsers(userIds)
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                const joinedUsers = newPresences as unknown as { user_id: string }[]
                setOnlineUsers(prev => [...prev, ...joinedUsers.map(u => u.user_id)])
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                const leftUsers = leftPresences as unknown as { user_id: string }[]
                const leftUserIds = leftUsers.map(u => u.user_id)
                setOnlineUsers(prev => prev.filter(id => !leftUserIds.includes(id)))
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setOnlineUsers([])
    }

    const completeRecovery = () => setIsRecovery(false)

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut, onlineUsers, isRecovery, completeRecovery }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
