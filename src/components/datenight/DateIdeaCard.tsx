import { Card, CardContent } from "../ui/card";
import { ExternalLink, Clock } from "lucide-react";
import { Button } from "../ui/button";

interface DateIdeaCardProps {
    title: string;
    description: string;
    imageUrl: string;
    duration: string;
    cost: string;
    category: string;
    link?: string;
    onStart?: () => void;
    buttonText?: string;
    showExternalIcon?: boolean;
}

export function DateIdeaCard({
    title,
    description,
    imageUrl,
    duration,
    cost,
    category,
    link,
    onStart,
    buttonText = "Start Date",
    showExternalIcon = true
}: DateIdeaCardProps) {
    const handleStart = () => {
        if (onStart) {
            onStart();
        } else if (link) {
            window.open(link, '_blank');
        }
    };

    return (
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group h-full flex flex-col">
            <div className="relative h-48 overflow-hidden shrink-0">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-800 uppercase tracking-wide">
                    {category}
                </div>
            </div>
            <CardContent className="p-5 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                    {description}
                </p>

                <div className="flex items-center gap-4 mb-6 text-xs text-gray-500 font-medium mt-auto">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration}
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500 font-medium">{cost}</span>
                    </div>
                </div>

                <Button
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2"
                    onClick={handleStart}
                >
                    {buttonText}
                    {showExternalIcon && <ExternalLink className="w-4 h-4" />}
                </Button>
            </CardContent>
        </Card>
    );
}
