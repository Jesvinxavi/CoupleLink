/**
 * Static suggested date night ideas and bundled modal items.
 */

// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import type { DateIdea, DateIdeaItem } from "@/types/datenight"

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
export const MUSEUM_TOURS: DateIdeaItem[] = [
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
]

export const COOK_ALONG_RECIPES: DateIdeaItem[] = [
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
]

export const DATE_IDEAS: DateIdea[] = [
    {
        title: "Virtual Museum Tour",
        description: "Walk through world-class museums together and discuss art from the comfort of your sofa.",
        imageUrl: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        duration: "1-2 Hours",
        cost: "Free",
        categories: ["Culture", "Chill", "Long Distance"],
        type: "modal",
        modalItems: MUSEUM_TOURS,
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
        type: "modal",
        modalItems: COOK_ALONG_RECIPES,
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
        type: "simple",
        link: "https://www.teleparty.com/"
    },
    {
        title: "World Exploration",
        description: "Use Google Earth to show each other your childhood homes, dream destinations, or random cool spots.",
        imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        duration: "1 Hour",
        cost: "Free",
        categories: ["Adventure", "Chill", "Long Distance"],
        type: "simple",
        link: "https://earth.google.com/"
    },
    {
        title: "Virtual Escape Room",
        description: "Solve puzzles and riddles together to escape before time runs out!",
        imageUrl: "https://plus.unsplash.com/premium_photo-1692063696055-5f8df260b7c1?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        duration: "1-1.5 Hours",
        cost: "$$",
        categories: ["Adventure", "Active", "Long Distance"],
        type: "simple",
        link: "https://theescapegame.com/remote-adventures/"
    },
    {
        title: "Dream Home Hunting",
        description: "Browse Zillow or Rightmove in a random city and pick out your dream home (or the weirdest one).",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
        duration: "1 Hour",
        cost: "Free",
        categories: ["Chill", "Long Distance"],
        type: "simple",
        link: "https://www.zillow.com/"
    },
    {
        title: "Online Gaming",
        description: "Play a co-op game like Worldguesser and 8 Ball Pool",
        imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
        duration: "2+ Hours",
        cost: "$",
        categories: ["Entertainment", "Active", "Long Distance"],
        type: "simple",
        link: "https://www.crazygames.com/multiplayer?tab=with-friends"
    },
    {
        title: "Spotify Jam Session",
        description: "Start a Spotify Jam and take turns DJing or listening to a shared playlist.",
        imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800",
        duration: "1+ Hours",
        cost: "Free",
        categories: ["Music", "Chill", "Long Distance"],
        type: "simple",
        link: "https://www.spotify.com/"
    }
]
