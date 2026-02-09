// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Image, History } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChallengeHistory } from "@/components/memories/ChallengeHistory"
import { MomentsGallery } from "@/components/memories/MomentsGallery"

// ═══════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function MemoriesPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabParam = searchParams.get("tab")

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [activeTab, setActiveTab] = useState(tabParam === "moments" ? "moments" : "history")
    const [isOverlayFocused, setIsOverlayFocused] = useState(false)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    // Sync state with URL param if it changes externally (e.g. navigation)
    useEffect(() => {
        if (tabParam === "moments" || tabParam === "history") {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set("tab", value)
            return next
        })
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <>
            <div style={{ display: isOverlayFocused ? "none" : "contents" }}>
                <Sidebar />
                <div className="pt-14 md:ml-[250px] md:pt-0 min-h-screen dark:bg-gray-900">
                    <main className="p-4 md:p-8">
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="max-w-7xl mx-auto"
                        >
                            <motion.header variants={item} className="pt-4 md:pt-8 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-2xl">photo_library</span>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Memories</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Your shared photos and history</p>
                                    </div>
                                </div>
                            </motion.header>

                            <motion.div variants={item}>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                    <TabsList className="relative flex w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8 h-auto">
                                        <motion.div
                                            className="absolute left-1 inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                                            initial={false}
                                            animate={{
                                                x: activeTab === "history" ? 0 : "100%"
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                        <TabsTrigger
                                            value="history"
                                            className="relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 font-medium rounded-lg transition-colors data-[state=active]:bg-transparent data-[state=active]:text-rose-500 data-[state=active]:shadow-none hover:bg-transparent"
                                        >
                                            <History className="w-4 h-4" />
                                            <span>History</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="moments"
                                            className="relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 font-medium rounded-lg transition-colors data-[state=active]:bg-transparent data-[state=active]:text-rose-500 data-[state=active]:shadow-none hover:bg-transparent"
                                        >
                                            <Image className="w-4 h-4" />
                                            <span>Moments</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="history" className="mt-0">
                                        <ChallengeHistory />
                                    </TabsContent>

                                    <TabsContent value="moments" className="mt-0">
                                        <MomentsGallery onOverlayFocusChange={setIsOverlayFocused} />
                                    </TabsContent>
                                </Tabs>
                            </motion.div>
                        </motion.div>
                    </main>
                </div>
            </div>
        </>
    )
}
