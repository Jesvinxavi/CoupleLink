import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { SpaceActionTile } from "../components/ui/SpaceActionTile"

export default function PairingLanding() {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFF5F5] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className="material-symbols-outlined text-4xl text-[#EA2831]">favorite_border</span>
                    </div>
                    <h1 className="text-4xl font-bold text-heading-dark">Let's Connect</h1>
                    <p className="mt-3 text-lg text-body-soft">
                        Choose how you'd like to set up your shared space
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Create Space Card */}
                    <SpaceActionTile
                        description="Start here and get a unique code to share with your partner"
                        icon="add_circle"
                        buttonText="Create Space"
                        onClick={() => navigate("/create-space")}
                        variant="primary"
                        className="bg-[#FFF5F5]"
                    />

                    {/* Join Partner Card */}
                    <SpaceActionTile
                        description="Have a code from your partner? Enter it here to connect"
                        icon="group_add"
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-50"
                        buttonText="Join Partner"
                        onClick={() => navigate("/join-partner")}
                        variant="primary"
                        buttonClassName="bg-[#3B82F6] hover:bg-[#2563EB]"
                        className="bg-blue-50/50"
                    />
                </div>
            </motion.div>
        </div>
    )
}
