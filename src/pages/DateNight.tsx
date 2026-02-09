// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Plus, Loader2 } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { DateIdeaCard } from "@/components/datenight/DateIdeaCard"
import { DateIdeaModal } from "@/components/datenight/DateIdeaModal"
import { AddDateIdeaOverlay } from "@/components/datenight/AddDateIdeaOverlay"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { DATE_IDEAS } from "@/data/dateNightIdeas"
import type { DateIdea, DateIdeaItem } from "@/types/datenight"

interface UserDate {
    id: string
    title: string
    description: string
    image_url: string | null
    duration: string
    cost: string
    checklist: string[]
}

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

const USER_DATES_PAGE_SIZE = 9

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export default function DateNightPage() {
    const { couple } = useCoupleData()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [activeTab, setActiveTab] = useState("suggested")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isOverlayFocused, setIsOverlayFocused] = useState(false)
    const [modalTitle, setModalTitle] = useState("")
    const [modalDescription, setModalDescription] = useState("")
    const [modalItems, setModalItems] = useState<DateIdeaItem[]>([])
    const [editingDate, setEditingDate] = useState<DateIdeaItem | null>(null)

    // User Dates State
    const [userDates, setUserDates] = useState<UserDate[]>([])
    const [loadingUserDates, setLoadingUserDates] = useState(false)
    const [visibleUserDatesCount, setVisibleUserDatesCount] = useState(USER_DATES_PAGE_SIZE)

    const fetchUserDates = useCallback(async () => {
        if (!couple?.id) return

        try {
            setLoadingUserDates(true)
            const { data, error } = await supabase
                .from("user_dates")
                .select("id, title, description, image_url, duration, cost, checklist, created_at, is_completed, completed_at, couple_id")
                .eq("couple_id", couple.id)
                .order("created_at", { ascending: false })

            if (error) throw error

            const transformedData: UserDate[] = (data || []).map(item => ({
                ...item,
                checklist: item.checklist || [] // Ensure checklist is string[] not null
            }))

            setUserDates(transformedData)
        } catch (error) {
            logger.error("DateNightPage", "Error fetching user dates", error)
        } finally {
            setLoadingUserDates(false)
        }
    }, [couple?.id])

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        if (couple?.id) {
            fetchUserDates()
        }
    }, [couple?.id, fetchUserDates])

    useEffect(() => {
        setVisibleUserDatesCount(USER_DATES_PAGE_SIZE)
    }, [userDates.length])

    const visibleUserDates = useMemo(() => {
        return userDates.slice(0, visibleUserDatesCount)
    }, [userDates, visibleUserDatesCount])

    const canLoadMoreUserDates = userDates.length > visibleUserDatesCount

    const handleLoadMoreUserDates = useCallback(() => {
        setVisibleUserDatesCount((prev) => Math.min(prev + USER_DATES_PAGE_SIZE, userDates.length))
    }, [userDates.length])

    // ═══════════════════════════════════════
    // STATIC IDEA DATA
    // ═══════════════════════════════════════
    const dateIdeas = DATE_IDEAS

    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const handleStartDate = (idea: DateIdea) => {
        if (idea.type === "modal" && idea.modalItems) {
            setModalTitle(idea.title)
            setModalDescription(idea.description)
            setModalItems(idea.modalItems)
            setIsModalOpen(true)
        } else if (idea.link) {
            window.open(idea.link, "_blank")
        }
    }

    const handleEditDate = (item: DateIdeaItem) => {
        setEditingDate(item)
        setIsAddModalOpen(true)
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
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-2xl">local_activity</span>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Date Night</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Curated experiences for quality time together</p>
                                    </div>
                                </div>
                            </motion.header>

                            <motion.div variants={item}>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="relative flex w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8 h-auto">
                                        <motion.div
                                            className="absolute left-1 inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                                            initial={false}
                                            animate={{
                                                x: activeTab === 'suggested' ? 0 : '100%'
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                        <TabsTrigger
                                            value="suggested"
                                            className="relative z-10 w-1/2 py-2.5 font-medium rounded-lg transition-colors data-[state=active]:bg-transparent data-[state=active]:text-rose-500 data-[state=active]:shadow-none hover:bg-transparent"
                                        >
                                            Suggested Dates
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="user_created"
                                            className="relative z-10 w-1/2 py-2.5 font-medium rounded-lg transition-colors data-[state=active]:bg-transparent data-[state=active]:text-rose-500 data-[state=active]:shadow-none hover:bg-transparent"
                                        >
                                            Your Dates
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="suggested" className="mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {dateIdeas.map((idea, index) => (
                                                <DateIdeaCard
                                                    key={index}
                                                    {...idea}
                                                    category={idea.categories[0]} // Display primary category
                                                    onStart={() => handleStartDate(idea)}
                                                />
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="user_created" className="mt-0">
                                        <div className="mb-8 flex justify-end">
                                            <Button
                                                onClick={() => {
                                                    setEditingDate(null);
                                                    setIsAddModalOpen(true);
                                                }}
                                                className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add New Date
                                            </Button>
                                        </div>

                                        {loadingUserDates ? (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {userDates.length > 0 ? (
                                                    visibleUserDates.map((date) => (
                                                        <DateIdeaCard
                                                            key={date.id}
                                                            title={date.title}
                                                            description={date.description}
                                                            imageUrl={date.image_url || "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800"}
                                                            duration={date.duration}
                                                            cost={date.cost}
                                                            category="Custom Date"
                                                            showExternalIcon={false}
                                                            buttonText="View Details"
                                                            onStart={() => {
                                                                setModalTitle(date.title);
                                                                setModalDescription(date.description);
                                                                setModalItems([{
                                                                    id: date.id,
                                                                    title: date.title,
                                                                    description: date.description,
                                                                    imageUrl: date.image_url || "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800",
                                                                    duration: date.duration,
                                                                    cost: date.cost,
                                                                    checklist: date.checklist,
                                                                    link: "", // No link for user dates usually
                                                                    buttonText: "View Details"
                                                                }]);
                                                                setIsModalOpen(true);
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">You haven't added any date ideas yet.</p>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingDate(null);
                                                                setIsAddModalOpen(true);
                                                            }}
                                                        >
                                                            Create your first date
                                                        </Button>
                                                    </div>
                                                )}

                                                {canLoadMoreUserDates && (
                                                    <div className="col-span-full flex justify-center pt-4">
                                                        <Button variant="outline" onClick={handleLoadMoreUserDates}>
                                                            Load more ({visibleUserDates.length} of {userDates.length})
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </motion.div>
                        </motion.div>
                    </main>
                </div>
            </div>

            <DateIdeaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                description={modalDescription}
                items={modalItems}
                onEdit={activeTab === 'user_created' ? handleEditDate : undefined}
                showNavigation={activeTab === 'suggested'}
            />

            <AddDateIdeaOverlay
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingDate(null);
                }}
                onSuccess={fetchUserDates}
                coupleId={couple?.id || ""}
                initialData={editingDate}
                onFocusChange={setIsOverlayFocused}
            />
        </>
    )
}
