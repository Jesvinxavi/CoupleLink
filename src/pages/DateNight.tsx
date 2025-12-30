import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { DateIdeaCard } from "../components/datenight/DateIdeaCard";
import { DateIdeaModal, type DateIdeaItem } from "../components/datenight/DateIdeaModal";
import { AddDateIdeaOverlay } from "../components/datenight/AddDateIdeaOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { useCoupleData } from "../hooks/useCoupleData";
import { supabase } from "../lib/supabase";
import { Plus, Loader2 } from "lucide-react";

interface DateIdea {
    title: string;
    description: string;
    imageUrl: string;
    duration: string;
    cost: string;
    categories: string[];
    link?: string;
    type: 'simple' | 'modal';
    modalItems?: DateIdeaItem[];
    buttonText?: string;
    showExternalIcon?: boolean;
}

interface UserDate {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    duration: string;
    cost: string;
    checklist: string[];
}

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

export default function DateNightPage() {
    const { couple } = useCoupleData();
    const [activeTab, setActiveTab] = useState("suggested");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isOverlayFocused, setIsOverlayFocused] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalDescription, setModalDescription] = useState("");
    const [modalItems, setModalItems] = useState<DateIdeaItem[]>([]);

    // User Dates State
    const [userDates, setUserDates] = useState<UserDate[]>([]);
    const [loadingUserDates, setLoadingUserDates] = useState(false);

    const fetchUserDates = async () => {
        if (!couple?.id) return;

        try {
            setLoadingUserDates(true);
            const { data, error } = await supabase
                .from('user_dates')
                .select('*')
                .eq('couple_id', couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedData: UserDate[] = (data || []).map(item => ({
                ...item,
                checklist: item.checklist || [] // Ensure checklist is string[] not null
            }));

            setUserDates(transformedData);
        } catch (error) {
            console.error('Error fetching user dates:', error);
        } finally {
            setLoadingUserDates(false);
        }
    };

    useEffect(() => {
        if (couple?.id) {
            fetchUserDates();
        }
    }, [couple?.id]);

    const museumTours: DateIdeaItem[] = [
        {
            title: "The Louvre",
            description: "Explore the world's largest art museum and a historic monument in Paris, France. See the Mona Lisa and the Venus de Milo.",
            imageUrl: "https://images.unsplash.com/photo-1655573293252-740f354a6756?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            duration: "1-2 Hours",
            link: "https://www.louvre.fr/en/online-tours",
            buttonText: "Visit Museum"
        },
        {
            title: "Musée d'Orsay",
            description: "Walk through the former Gare d'Orsay railway station and see masterpieces by Monet, Manet, Degas, Renoir, Cézanne, and Van Gogh.",
            imageUrl: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?auto=format&fit=crop&q=80&w=800",
            duration: "1.5 Hours",
            link: "https://artsandculture.google.com/partner/musee-dorsay-paris",
            buttonText: "Visit Museum"
        },
        {
            title: "Vatican Museums",
            description: "Discover the immense collection amassed by the Popes throughout the centuries including the Sistine Chapel.",
            imageUrl: "https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&q=80&w=800",
            duration: "2 Hours",
            link: "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/tour-virtuali-elenco.html",
            buttonText: "Visit Museum"
        },
        {
            title: "Van Gogh Museum",
            description: "Step into Van Gogh's world. Explore the largest collection of artworks by Vincent van Gogh.",
            imageUrl: "https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&q=80&w=800",
            duration: "1 Hour",
            link: "https://artsandculture.google.com/partner/van-gogh-museum",
            buttonText: "Visit Museum"
        },
        {
            title: "Uffizi Gallery",
            description: "Wander the halls of one of the most famous museums in the world, located in Florence, Italy.",
            imageUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800",
            duration: "1.5 Hours",
            link: "https://artsandculture.google.com/partner/uffizi-gallery",
            buttonText: "Visit Museum"
        }
    ];

    const cookAlongRecipes: DateIdeaItem[] = [
        {
            title: "Homemade Pasta",
            description: "Learn to make fresh pasta from scratch. A fun, hands-on activity that ends with a delicious meal.",
            imageUrl: "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            duration: "1.5 Hours",
            cost: "$$",
            link: "https://www.youtube.com/results?search_query=romantic+pasta+dinner+for+two",
            buttonText: "Start Cooking"
        },
        {
            title: "Sushi Night",
            description: "Roll your own sushi! It's easier than you think and perfect for a date night challenge.",
            imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
            duration: "2 Hours",
            cost: "$$$",
            link: "https://www.youtube.com/results?search_query=how+to+make+sushi+at+home+for+beginners",
            buttonText: "Start Cooking"
        },
        {
            title: "Homemade Pizza",
            description: "Toss some dough and get creative with toppings. The perfect casual and fun dinner date.",
            imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
            duration: "1 Hour",
            cost: "$",
            link: "https://www.youtube.com/results?search_query=homemade+pizza+date+night",
            buttonText: "Start Cooking"
        }
    ];

    const dateIdeas: DateIdea[] = [
        {
            title: "Virtual Museum Tour",
            description: "Walk through world-class museums together and discuss art from the comfort of your sofa.",
            imageUrl: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            duration: "1-2 Hours",
            cost: "Free",
            categories: ["Culture", "Chill", "Long Distance"],
            type: 'modal',
            modalItems: museumTours,
            buttonText: "Explore Options",
            showExternalIcon: false
        },
        {
            title: "Cook-Along Dinner",
            description: "Pick a recipe, buy the ingredients, and cook 'together' over video call.",
            imageUrl: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            duration: "2 Hours",
            cost: "$$",
            categories: ["Food", "Active", "Long Distance"],
            type: 'modal',
            modalItems: cookAlongRecipes,
            buttonText: "Explore Options",
            showExternalIcon: false
        },
        {
            title: "Watch Party",
            description: "Sync up a movie or show and react in real-time using Teleparty or just hitting play together.",
            imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800",
            duration: "2+ Hours",
            cost: "$",
            categories: ["Entertainment", "Chill", "Long Distance"],
            type: 'simple',
            link: "https://www.teleparty.com/"
        },
        {
            title: "World Exploration",
            description: "Use Google Earth to show each other your childhood homes, dream destinations, or random cool spots.",
            imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
            duration: "1 Hour",
            cost: "Free",
            categories: ["Adventure", "Chill", "Long Distance"],
            type: 'simple',
            link: "https://earth.google.com/"
        },
        {
            title: "Virtual Escape Room",
            description: "Solve puzzles and riddles together to escape before time runs out!",
            imageUrl: "https://plus.unsplash.com/premium_photo-1692063696055-5f8df260b7c1?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            duration: "1-1.5 Hours",
            cost: "$$",
            categories: ["Adventure", "Active", "Long Distance"],
            type: 'simple',
            link: "https://theescapegame.com/remote-adventures/"
        },
        {
            title: "Dream Home Hunting",
            description: "Browse Zillow or Rightmove in a random city and pick out your dream home (or the weirdest one).",
            imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
            duration: "1 Hour",
            cost: "Free",
            categories: ["Chill", "Long Distance"],
            type: 'simple',
            link: "https://www.zillow.com/"
        },
        {
            title: "Online Gaming",
            description: "Play a co-op game like Worldguesser and 8 Ball Pool",
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
            duration: "2+ Hours",
            cost: "$",
            categories: ["Entertainment", "Active", "Long Distance"],
            type: 'simple',
            link: "https://www.crazygames.com/multiplayer?tab=with-friends"
        },
        {
            title: "Spotify Jam Session",
            description: "Start a Spotify Jam and take turns DJing or listening to a shared playlist.",
            imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800",
            duration: "1+ Hours",
            cost: "Free",
            categories: ["Music", "Chill", "Long Distance"],
            type: 'simple',
            link: "https://www.spotify.com/"
        }
    ];

    const handleStartDate = (idea: DateIdea) => {
        if (idea.type === 'modal' && idea.modalItems) {
            setModalTitle(idea.title);
            setModalDescription(idea.description);
            setModalItems(idea.modalItems);
            setIsModalOpen(true);
        } else if (idea.link) {
            window.open(idea.link, '_blank');
        }
    };

    const [editingDate, setEditingDate] = useState<DateIdeaItem | null>(null);

    const handleEditDate = (item: DateIdeaItem) => {
        setEditingDate(item);
        setIsAddModalOpen(true);
    };

    return (
        <>
            <div style={{ display: isOverlayFocused ? 'none' : 'contents' }}>
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
                                                    userDates.map((date) => (
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
    );
}
