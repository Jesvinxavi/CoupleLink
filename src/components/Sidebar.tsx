import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "./ui/sheet"
import { Button } from "./ui/button"
import { useAuth } from "@/context/AuthContext"
import { UserAvatar } from "./ui/UserAvatar"
import { ConfirmationModal } from "./ui/ConfirmationModal"
import { supabase } from "@/lib/supabase"
import { useCoupleData } from "@/hooks/useCoupleData"
import logo from "@/assets/logo.png"
import { STORAGE_KEYS } from "@/lib/constants"

const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "home" },
    { name: "Challenges", path: "/challenges", icon: "emoji_events" },
    { name: "Journal", path: "/journal", icon: "menu_book" },
    { name: "Sexploration", path: "/sexploration", icon: "local_fire_department" },
    { name: "Insights", path: "/stats", icon: "query_stats" },
    { name: "Calendar", path: "/calendar", icon: "event" },
    { name: "Memories", path: "/memories", icon: "photo_library" },
    { name: "Games", path: "/games", icon: "stadia_controller" },
    { name: "Date Night", path: "/date-night", icon: "local_activity" },
]

export default function Sidebar() {
    const [open, setOpen] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [userProfile, setUserProfile] = useState<{ first_name: string | null; avatar_url: string | null } | null>(null)
    const location = useLocation()
    const { signOut, user } = useAuth()
    const { couple } = useCoupleData()

    useEffect(() => {
        if (user) {
            fetchUserProfile()
        }
    }, [user])

    useEffect(() => {
        // console.log('[DEBUG-UNPAIR] Sidebar RENDER. Couple:', couple?.id, 'RainChecks:', couple?.rain_check_tokens)
    }, [couple])

    const [canRestore, setCanRestore] = useState(false);

    useEffect(() => {
        const checkRestore = () => {
            const dismissed = sessionStorage.getItem('dismissed_restore_modal');
            setCanRestore(!!dismissed);
        };
        checkRestore();
        window.addEventListener('restore_modal_dismissed', checkRestore);
        // Also listen if restore is completed? We might want to clear it.
        // Assuming refresh works.
        return () => window.removeEventListener('restore_modal_dismissed', checkRestore);
    }, []);

    const handleTriggerRestore = () => {
        window.dispatchEvent(new Event('request_open_restore_modal'));
    };

    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, avatar_url')
                .eq('id', user!.id)
                .single()

            if (error) throw error
            if (data) {
                setUserProfile(data)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
        }
    }

    const handleLogout = async () => {
        await signOut()
        setOpen(false)
    }

    const filteredNavItems = navItems.filter(item => {
        if (!couple) {
            return item.name === "Dashboard"
        }
        if (item.name === "Sexploration") {
            return couple?.spicy_mode === true
        }
        return true
    })

    const NavLinks = () => (
        <>
            {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors ${isActive
                            ? "bg-[#EA2831]/10 text-[#EA2831]"
                            : "text-heading-dark md:hover:bg-gray-100"
                            }`}
                        onClick={() => setOpen(false)}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <p>{item.name}</p>
                    </Link>
                )
            })}
        </>
    )

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden shadow-sm">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img src={logo} alt="CoupleLink Logo" className="h-7 w-7 object-contain" />
                    <h1 className="text-2xl font-bold text-heading-dark">Couple<span className="text-[#EA2831]">Link</span></h1>
                </Link>
                <div className="flex items-center gap-2">
                    {/* Rain Check Tokens */}
                    {/* Rain Check Tokens */}
                    {couple && (
                        <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1.5 shadow-sm">
                            <span className="material-symbols-outlined text-[#EA2831] text-lg">umbrella</span>
                            <div className="flex flex-col">
                                <p className="text-[10px] text-body-soft leading-none">Rain Checks</p>
                                <p className="text-xs font-bold text-heading-dark">
                                    {couple?.rain_check_tokens ?? 0} Tokens
                                </p>
                            </div>
                        </div>
                    )}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <span className="material-symbols-outlined">menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[250px] p-0">
                            {/* Accessibility: Radix Dialog (Sheet) requires a title + description */}
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation menu</SheetTitle>
                                <SheetDescription>Primary app navigation</SheetDescription>
                            </SheetHeader>
                            <div className="flex h-full flex-col justify-between bg-white p-4">
                                <div className="flex flex-col gap-8">
                                    <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 pt-2">
                                        <img src={logo} alt="CoupleLink Logo" className="h-7 w-7 object-contain" />
                                        <h1 className="text-2xl font-bold text-heading-dark">Couple<span className="text-[#EA2831]">Link</span></h1>
                                    </Link>
                                    <nav className="flex flex-col gap-2">
                                        <NavLinks />
                                        {canRestore && (
                                            <button
                                                onClick={() => {
                                                    setOpen(false);
                                                    handleTriggerRestore();
                                                }}
                                                className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors bg-purple-50 text-purple-600 md:hover:bg-purple-100 border border-purple-200 mt-2"
                                            >
                                                <span className="material-symbols-outlined">history</span>
                                                <div className="flex flex-col items-start leading-tight">
                                                    <span>Restore Old Space</span>
                                                    <span className="text-[10px] opacity-80">6 days left</span>
                                                </div>
                                            </button>
                                        )}
                                    </nav>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Link
                                        to="/settings"
                                        className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-heading-dark md:hover:bg-gray-100"
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="material-symbols-outlined">settings</span>
                                        <p>Settings</p>
                                    </Link>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-heading-dark md:hover:bg-gray-100"
                                    >
                                        <span className="material-symbols-outlined">logout</span>
                                        <p>Log Out</p>
                                    </button>
                                    <div className="flex items-center gap-3 border-t border-gray-100 p-3 pt-4 mt-2">
                                        <UserAvatar
                                            user={userProfile}
                                            className="w-10 h-10"
                                        />
                                        <div className="flex flex-col">
                                            <h1 className="text-base font-medium text-heading-dark">{userProfile?.first_name || 'User'}</h1>
                                            <p className="text-sm text-body-soft">couple.link/{userProfile?.first_name?.toLowerCase() || 'user'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 hidden h-screen w-[250px] bg-white shadow-sm md:flex md:flex-col md:justify-between p-4">
                <div className="flex flex-col gap-8">
                    <Link to="/dashboard" className="flex items-center gap-2 px-3 pt-2">
                        <img src={logo} alt="CoupleLink Logo" className="h-7 w-7 object-contain" />
                        <h1 className="text-2xl font-bold text-heading-dark">Couple<span className="text-[#EA2831]">Link</span></h1>
                    </Link>
                    <nav className="flex flex-col gap-2">
                        <NavLinks />
                        {canRestore && (
                            <button
                                onClick={handleTriggerRestore}
                                className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors bg-purple-50 text-purple-600 md:hover:bg-purple-100 border border-purple-200 mt-2"
                            >
                                <span className="material-symbols-outlined">history</span>
                                <div className="flex flex-col items-start leading-tight">
                                    <span>Restore Old Space</span>
                                    <span className="text-[10px] opacity-80">6 days left</span>
                                </div>
                            </button>
                        )}
                    </nav>
                </div>
                <div className="flex flex-col gap-1">
                    {/* Rain Check Tokens */}
                    {/* Rain Check Tokens */}
                    {couple && (
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 mb-2 shadow-sm">
                            <span className="material-symbols-outlined text-[#EA2831] text-xl">umbrella</span>
                            <div className="flex flex-col">
                                <p className="text-xs text-body-soft leading-none">Rain Checks</p>
                                <p className="text-sm font-bold text-heading-dark">
                                    {couple?.rain_check_tokens ?? 0} Tokens
                                </p>
                            </div>
                        </div>
                    )}
                    <Link
                        to="/settings"
                        className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-heading-dark md:hover:bg-gray-100"
                    >
                        <span className="material-symbols-outlined">settings</span>
                        <p>Settings</p>
                    </Link>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-heading-dark md:hover:bg-gray-100"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <p>Log Out</p>
                    </button>
                    <div className="flex items-center gap-3 border-t border-gray-100 p-3 pt-4 mt-2">
                        <UserAvatar
                            user={userProfile}
                            className="w-10 h-10"
                        />
                        <div className="flex flex-col">
                            <h1 className="text-base font-medium text-heading-dark">{userProfile?.first_name || 'User'}</h1>
                            <p className="text-sm text-body-soft">couple.link/{userProfile?.first_name?.toLowerCase() || 'user'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    sessionStorage.removeItem(STORAGE_KEYS.DISMISSED_RESTORE_MODAL);
                    handleLogout();
                }}
                title="Log Out"
                description="Are you sure you want to log out?"
                confirmText="Log Out"
                variant="destructive"
            />
        </>
    )
}
