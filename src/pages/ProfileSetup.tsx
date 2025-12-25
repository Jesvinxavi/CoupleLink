import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { useCoupleData } from "../hooks/useCoupleData"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription } from "../components/ui/alert"
import { motion } from "framer-motion"

export default function ProfileSetup() {
    const { user } = useAuth()
    const { refreshCoupleData } = useCoupleData()
    const navigate = useNavigate()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleProfileSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        setMessage(null)

        try {
            let avatarUrl = null
            if (avatarFile) {

                const fileExt = avatarFile.name.split(".").pop()
                const fileName = `${user.id}-${Math.random()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(fileName, avatarFile)

                if (uploadError) {
                    console.error('Avatar upload error:', uploadError)
                    throw uploadError
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(fileName)

                avatarUrl = publicUrl
            }

            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    birth_date: birthDate,
                    avatar_url: avatarUrl,
                })
                .eq("id", user.id)

            if (updateError) {
                console.error('Profile update error:', updateError)
                throw updateError
            }

            // Critical fix: Refresh couple data to ensure app knows about new profile info
            await refreshCoupleData()

            navigate("/pairing")
        } catch (error: any) {
            console.error('Setup failed:', error)
            setMessage({ type: "error", text: error.message || "An error occurred" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFF5F5] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="border-none shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EA2831]/10">
                            <span className="material-symbols-outlined text-3xl text-[#EA2831]">person_edit</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-heading-dark">Set Up Your Profile</CardTitle>
                        <CardDescription className="text-body-soft">
                            Let's make your profile look great for your partner.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {message && (
                            <Alert variant={message.type === "error" ? "destructive" : "default"}>
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleProfileSetup} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-heading-dark">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:border-[#EA2831] focus:ring-[#EA2831]"
                                        placeholder="First"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-heading-dark">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:border-[#EA2831] focus:ring-[#EA2831]"
                                        placeholder="Last"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthDate" className="text-heading-dark">Birthday</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="birthDate"
                                        type="date"
                                        value={birthDate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthDate(e.target.value)}
                                        required
                                        className="h-12 flex-1 rounded-xl border-gray-200 bg-gray-50 focus:border-[#EA2831] focus:ring-[#EA2831] [&::-webkit-calendar-picker-indicator]:hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 w-12 shrink-0 rounded-xl border-gray-200 bg-gray-50 p-0 text-gray-500 hover:bg-gray-100 hover:text-[#EA2831]"
                                        onClick={() => {
                                            const input = document.getElementById('birthDate') as HTMLInputElement;
                                            input?.showPicker();
                                        }}
                                    >
                                        <span className="material-symbols-outlined">calendar_month</span>
                                    </Button>
                                </div>
                                <p className="text-xs text-body-soft">So we can celebrate your special day!</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="avatar" className="text-heading-dark">Profile Picture</Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400">
                                        {avatarFile ? (
                                            <img
                                                src={URL.createObjectURL(avatarFile)}
                                                alt="Preview"
                                                className="h-full w-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined">add_a_photo</span>
                                        )}
                                    </div>
                                    <Input
                                        id="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarFile(e.target.files?.[0] || null)}
                                        className="flex-1 cursor-pointer h-16 pt-4 file:mr-4 file:rounded-full file:border-0 file:bg-[#EA2831]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#EA2831] hover:file:bg-[#EA2831]/20"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-full bg-[#EA2831] text-lg font-medium text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-[#D41F27]"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Continue"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
