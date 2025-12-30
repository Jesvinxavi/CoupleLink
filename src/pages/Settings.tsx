import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import Sidebar from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"
import { useCoupleData } from '@/hooks/useCoupleData';
import { STORAGE_KEYS } from "@/lib/constants";


export default function Settings() {
    const { user, signOut } = useAuth()
    const { couple, refreshCoupleData } = useCoupleData()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showSpicy, setShowSpicy] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showUnpairModal, setShowUnpairModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    useEffect(() => {
        if (user) {
            fetchProfile()
        }
    }, [user])

    useEffect(() => {
        if (couple) {
            setShowSpicy(couple.spicy_mode ?? false)
        }
    }, [couple])

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single()

            if (error) throw error
            if (data) {
                setFirstName(data.first_name || "")
                setLastName(data.last_name || "")
                setAvatarUrl(data.avatar_url || "")
                setBirthDate(data.birth_date || "")
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (!user) {
            setMessage({ type: 'error', text: 'You must be logged in to update your profile' })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    avatar_url: avatarUrl,
                    birth_date: birthDate,
                })
                .eq('id', user!.id)

            if (error) throw error

            setMessage({ type: 'success', text: 'Profile updated successfully' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0]
            if (!file) return

            setLoading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `${user!.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)

            // Auto-save the new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user!.id)

            if (updateError) throw updateError

            setMessage({ type: 'success', text: 'Avatar updated successfully' })

            // CLEANUP: Delete old avatar if it exists and is being replaced
            if (avatarUrl && avatarUrl !== publicUrl) {
                // Check if it's a storage URL (simple check)
                if (avatarUrl.includes('/avatars/')) {
                    const path = avatarUrl.split('/avatars/')[1];
                    if (path) {
                        const { error: deleteError } = await supabase.storage
                            .from('avatars')
                            .remove([path]);

                        if (deleteError) {
                            // Non-blocking cleanup error
                        }
                    }

                }
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleSpicyToggle = async (checked: boolean) => {
        if (!couple) return
        try {
            const { error } = await supabase
                .from('couples')
                .update({ spicy_mode: checked })
                .eq('id', couple.id)

            if (error) throw error

            setShowSpicy(checked)
            await refreshCoupleData()
        } catch (error: any) {

            setMessage({ type: 'error', text: 'Failed to update setting' })
            // Revert on error
            setShowSpicy(!checked)
        }
    }

    const handleUnpair = async () => {
        setLoading(true);

        if (!user) {
            setMessage({ type: 'error', text: 'You must be logged in to unpair' });
            setLoading(false);
            return;
        }

        try {
            if (!couple) {
                // Even if no couple in context, we might want to try RPC? But context should be source of truth.
                throw new Error("No active couple found");
            }

            // Call the secure RPC to unpair both users and delete the couple record
            const { error: rpcError } = await supabase.rpc('unpair_couple');

            if (rpcError) {
                throw rpcError;
            }

            // Clear any dismissed restore modal flag so it can reappear if they repair
            sessionStorage.removeItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);

            // Refresh local state to reflect changes immediately
            await refreshCoupleData();
            navigate("/dashboard");
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteAccount = async () => {
        setLoading(true)

        try {
            // 1. If in a couple, unpair properly first
            if (couple) {
                const { error: unpairError } = await supabase.rpc('unpair_couple')
                if (unpairError) {
                    // Proceeding anyway
                }
            }


            // 2. Wipe the account
            const { error } = await supabase.rpc('reset_profile')
            if (error) throw error

            sessionStorage.removeItem('dismissed_restore_modal');

            await signOut()
            navigate("/")
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-4 pt-20 md:ml-[250px] md:pt-8 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <div className="flex items-center justify-between pt-4 md:pt-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">settings</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-heading-dark">Settings</h1>
                                <p className="text-sm text-body-soft">Manage your profile and preferences</p>
                            </div>
                        </div>
                        <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                <AvatarImage src={avatarUrl} className="object-cover" />
                                <AvatarFallback>{firstName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white text-sm">edit</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>

                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                            <AlertTitle>{message.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Section - Spans 2 columns */}
                        <div className="lg:col-span-2">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                    <CardDescription>Update your personal information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    id="firstName"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="First Name"
                                                />
                                                <Input
                                                    id="lastName"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Second Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="birthDate">Birthday</Label>
                                            <div className="flex gap-2 relative">
                                                <Input
                                                    id="birthDate"
                                                    type="text"
                                                    readOnly
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 pointer-events-none"
                                                />
                                                <div className="relative">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-11 shrink-0 p-0 text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-rose-500"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                                                    </Button>
                                                    <input
                                                        type="date"
                                                        value={birthDate}
                                                        onChange={(e) => setBirthDate(e.target.value)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-none"
                                                        title="Select date"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button type="submit" disabled={loading}>
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Preferences & Danger Zone */}
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preferences</CardTitle>
                                    <CardDescription>Customize your experience</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Spicy Content</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Show spicy challenges and suggestions
                                            </p>
                                        </div>
                                        <Switch
                                            checked={showSpicy}
                                            onCheckedChange={handleSpicyToggle}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Danger Zone</CardTitle>
                                    <CardDescription>Irreversible actions</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">Unpair Partner</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Disconnect from current partner</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => setShowUnpairModal(true)} disabled={loading}>
                                            Unpair
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div>
                                            <h4 className="font-medium">Delete Account</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Wipe data and reset profile</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} disabled={loading}>
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </div>
            </main >

            <ConfirmationModal
                isOpen={showUnpairModal}
                onClose={() => setShowUnpairModal(false)}
                onConfirm={handleUnpair}
                title="Unpair Partner"
                description="Are you sure you want to unpair? This cannot be undone."
                confirmText="Unpair"
                variant="destructive"
                loading={loading}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                description="Are you sure you want to delete your account? This will wipe all your data and cannot be undone."
                confirmText="Delete Account"
                variant="destructive"
                loading={loading}
            />
        </div >
    )
}
