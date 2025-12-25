import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Welcome() {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5F5] p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md space-y-8"
            >
                <div className="flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
                        <span className="material-symbols-outlined text-5xl text-[#EA2831]">favorite</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-heading-dark">Welcome to Couple<span className="text-[#EA2831]">Link</span></h1>
                    <p className="text-lg text-body-soft">
                        Your private space to connect, play, and grow closer, no matter the distance.
                    </p>
                </div>

                <div className="pt-8">
                    <Button
                        onClick={() => navigate("/profile-setup")}
                        className="h-14 w-full rounded-full bg-[#EA2831] text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#D41F27]"
                    >
                        Get Started
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
