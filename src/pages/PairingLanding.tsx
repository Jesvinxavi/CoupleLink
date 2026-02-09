// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { SpaceActionTile } from "@/components/ui/SpaceActionTile"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function PairingLanding() {
    const navigate = useNavigate()
    useLockBodyScroll()

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleCreateSpace = () => navigate("/create-space")
    const handleJoinPartner = () => navigate("/join-partner")
    const handleRestoreSpace = () => navigate("/restore-space")

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div
            className="fixed inset-0 flex h-[100dvh] w-full flex-col items-center overflow-hidden overscroll-none bg-[#FFF5F5] p-4 pt-12"
            style={{ touchAction: 'none' }}
            onTouchMove={(e) => e.preventDefault()}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl"
            >
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-[#EA2831]">favorite_border</span>
                    </div>
                    <h1 className="text-3xl font-bold text-heading-dark">Let's Connect</h1>
                    <p className="mt-3 text-lg text-body-soft">
                        Choose how you'd like to set up your shared space
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {/* Create Space Card */}
                    <SpaceActionTile
                        description="Ready to start your journey? Create a space now"
                        icon="add_circle"
                        buttonText="Create Space"
                        onClick={handleCreateSpace}
                        variant="primary"
                        className="bg-[#FFF5F5]"
                    />

                    {/* Join Partner Card */}
                    <SpaceActionTile
                        description="Partner already made a space?"
                        icon="group_add"
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-50"
                        buttonText="Join Partner"
                        onClick={handleJoinPartner}
                        variant="primary"
                        buttonClassName="bg-[#3B82F6] hover:bg-[#2563EB]"
                        className="bg-blue-50/50"
                    />

                    {/* Restore Space Card */}
                    <SpaceActionTile
                        description="Recover a previous connection"
                        icon="history"
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-50"
                        buttonText="Restore Space"
                        onClick={handleRestoreSpace}
                        variant="primary"
                        buttonClassName="bg-purple-600 hover:bg-purple-700"
                        className="bg-purple-50/50"
                    />
                </div>
            </motion.div>
        </div>
    )
}
